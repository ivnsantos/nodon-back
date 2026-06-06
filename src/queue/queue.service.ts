import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { newRelicLog } from 'src/common/utils/newrelic-logger';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  public confirmacaoAgendamentoQueue: Queue;
  public processarRecorrenciaQueue: Queue;
  private redisConnectionOptions: any;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (!redisUrl) {
      throw new Error('REDIS_URL não configurada nas variáveis de ambiente');
    }

    console.log('🔌 Configurando conexão Redis...');
    console.log(`   URL: ${redisUrl.replace(/:[^:@]+@/, ':****@')}`); // Ocultar senha no log

    // Parse da URL do Redis para obter opções de conexão
    const url = new URL(redisUrl);
    this.redisConnectionOptions = {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 10000, // 10 segundos de timeout
      lazyConnect: true, // Não conectar imediatamente
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 100, 5000); // Máximo 5 segundos entre tentativas
        if (times <= 10 || times % 10 === 0) {
          console.log(`🔄 Tentando reconectar ao Redis (tentativa ${times})...`);
        }
        // Limitar tentativas - após 100 tentativas, parar por 30 segundos
        if (times > 100) {
          console.error(`❌ Muitas tentativas de reconexão (${times}). Verifique se o Redis está acessível.`);
          return 30000; // Esperar 30 segundos antes de tentar novamente
        }
        return delay;
      },
    };

    // Criar fila de confirmação de agendamento
    try {
      this.confirmacaoAgendamentoQueue = new Queue('confirmacao-agendamento', {
        connection: this.redisConnectionOptions,
        defaultJobOptions: {
          attempts: 3, // Tentar 3 vezes em caso de falha
          backoff: {
            type: 'exponential',
            delay: 2000, // Começar com 2 segundos, dobrar a cada tentativa
          },
          removeOnComplete: {
            age: 24 * 3600, // Manter jobs completos por 24 horas
            count: 1000, // Manter últimos 1000 jobs
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Manter jobs falhados por 7 dias
          },
        },
      });

      // Tentar conectar
      await this.confirmacaoAgendamentoQueue.waitUntilReady();
      console.log('✅ Fila de confirmação de agendamento criada e conectada');
    } catch (error: any) {
      console.error('❌ Erro ao criar fila de confirmação de agendamento:', error.message);
      console.error('   Verifique se o Redis está acessível e se a REDIS_URL está correta');
      throw error;
    }

    // Criar fila de processamento de recorrências
    try {
      this.processarRecorrenciaQueue = new Queue('processar-recorrencia', {
        connection: this.redisConnectionOptions,
        defaultJobOptions: {
          attempts: 1,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: {
            age: 7 * 24 * 3600,
            count: 5000,
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Manter jobs falhados por 7 dias
          },
        },
      });

      // Tentar conectar
      await this.processarRecorrenciaQueue.waitUntilReady();
      console.log('✅ Fila de processamento de recorrências criada e conectada');
    } catch (error: any) {
      console.error('❌ Erro ao criar fila de processamento de recorrências:', error.message);
      console.error('   Verifique se o Redis está acessível e se a REDIS_URL está correta');
      throw error;
    }
  }

  async onModuleDestroy() {
    console.log('🔌 Fechando conexões...');
    
    if (this.confirmacaoAgendamentoQueue) {
      await this.confirmacaoAgendamentoQueue.close();
    }
    
    if (this.processarRecorrenciaQueue) {
      await this.processarRecorrenciaQueue.close();
    }
    
    console.log('✅ Conexões fechadas');
  }

  /**
   * Adiciona um job para enviar SMS de confirmação de agendamento
   */
  async adicionarJobConfirmacaoAgendamento(
    consultaId: string,
    clienteMasterId: string,
  ): Promise<void> {
    try {
      if (!this.confirmacaoAgendamentoQueue) {
        throw new Error('Fila de confirmação de agendamento não está disponível');
      }

      await this.confirmacaoAgendamentoQueue.add(
        'enviar-sms-confirmacao',
        {
          consultaId,
          clienteMasterId,
        },
        {
          jobId: `confirmacao-${consultaId}`, // ID único para evitar duplicatas
          removeOnComplete: true,
        },
      );

      console.log(`📋 Job adicionado à fila: confirmacao-agendamento (Consulta: ${consultaId})`);
    } catch (error: any) {
      newRelicLog('error', 'Erro ao adicionar job de confirmação', {
        error: error.message,
        stack: error.stack,
      });
      console.error(`❌ Erro ao adicionar job de confirmação: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lock distribuído (Redis) para evitar CRONs concorrentes.
   */
  async acquireLock(lockKey: string, ttlMs: number): Promise<boolean> {
    try {
      if (!this.processarRecorrenciaQueue) {
        return true;
      }
      const client = await this.processarRecorrenciaQueue.client;
      const result = await client.set(`lock:${lockKey}`, '1', 'PX', ttlMs, 'NX');
      return result === 'OK';
    } catch (error: any) {
      console.warn(`⚠️ Não foi possível adquirir lock ${lockKey}: ${error.message}`);
      return true;
    }
  }

  async releaseLock(lockKey: string): Promise<void> {
    try {
      if (!this.processarRecorrenciaQueue) {
        return;
      }
      const client = await this.processarRecorrenciaQueue.client;
      await client.del(`lock:${lockKey}`);
    } catch (error: any) {
      console.warn(`⚠️ Não foi possível liberar lock ${lockKey}: ${error.message}`);
    }
  }

  /**
   * Adiciona um job para processar uma recorrência
   */
  async adicionarJobProcessarRecorrencia(
    recorrenciaId: string,
    assinaturaId: string,
    vencimentoStr: string,
  ): Promise<void> {
    try {
      if (!this.processarRecorrenciaQueue) {
        throw new Error('Fila de processamento de recorrências não está disponível');
      }

      // Um job por ciclo de vencimento (permite reprocessar atrasadas após falha)
      const jobId = `recorrencia-${recorrenciaId}-${vencimentoStr}`;
      const existente = await this.processarRecorrenciaQueue.getJob(jobId);
      if (existente) {
        const estado = await existente.getState();
        if (estado === 'completed') {
          console.log(`📋 Job ${jobId} já concluído — não reprocessar vencimento ${vencimentoStr}`);
          return;
        }
        if (estado === 'active' || estado === 'waiting' || estado === 'delayed') {
          console.log(`📋 Job ${jobId} já existe (${estado}), não duplicar`);
          return;
        }
        if (estado === 'failed') {
          await existente.remove();
        }
      }

      await this.processarRecorrenciaQueue.add(
        'processar-recorrencia',
        {
          recorrenciaId,
          assinaturaId,
          vencimentoStr,
        },
        {
          jobId,
          removeOnComplete: false,
          attempts: 1,
        },
      );

      console.log(
        `📋 Job adicionado à fila: ${jobId} (vencimento ${vencimentoStr})`,
      );
    } catch (error: any) {
      console.error(`❌ Erro ao adicionar job de recorrência: ${error.message}`);
      throw error;
    }
  }
}

