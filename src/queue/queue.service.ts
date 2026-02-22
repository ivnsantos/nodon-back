import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

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
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`🔄 Tentando reconectar ao Redis (tentativa ${times})...`);
        return delay;
      },
    };

    // Criar fila de confirmação de agendamento
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

    console.log('✅ Fila de confirmação de agendamento criada');

    // Criar fila de processamento de recorrências
    this.processarRecorrenciaQueue = new Queue('processar-recorrencia', {
      connection: this.redisConnectionOptions,
      defaultJobOptions: {
        attempts: 3, // Tentar 3 vezes em caso de falha
        backoff: {
          type: 'exponential',
          delay: 5000, // Começar com 5 segundos, dobrar a cada tentativa
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

    console.log('✅ Fila de processamento de recorrências criada');
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
  }

  /**
   * Adiciona um job para processar uma recorrência
   */
  async adicionarJobProcessarRecorrencia(
    recorrenciaId: string,
    assinaturaId: string,
  ): Promise<void> {
    await this.processarRecorrenciaQueue.add(
      'processar-recorrencia',
      {
        recorrenciaId,
        assinaturaId,
      },
      {
        jobId: `recorrencia-${recorrenciaId}`, // ID único para evitar duplicatas
        removeOnComplete: true,
      },
    );

    console.log(`📋 Job adicionado à fila: processar-recorrencia (Recorrência: ${recorrenciaId})`);
  }
}

