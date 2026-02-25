import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job } from 'bullmq';
import { CalendarioService } from '../calendario/calendario.service';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { newRelicLog } from '../common/utils/newrelic-logger';

@Injectable()
export class QueueWorkerService implements OnModuleInit, OnModuleDestroy {
  private confirmacaoWorker: Worker;
  private recorrenciaWorker: Worker;
  private redisConnectionOptions: any;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => CalendarioService))
    private calendarioService: CalendarioService,
    @Inject(forwardRef(() => AssinaturasService))
    private assinaturasService: AssinaturasService,
  ) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (!redisUrl) {
      throw new Error('REDIS_URL não configurada nas variáveis de ambiente');
    }

    console.log('🔌 Worker: Configurando conexão Redis...');

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
          console.log(`🔄 Worker: Tentando reconectar ao Redis (tentativa ${times})...`);
        }
        // Limitar tentativas - após 100 tentativas, parar por 30 segundos
        if (times > 100) {
          console.error(`❌ Worker: Muitas tentativas de reconexão (${times}). Verifique se o Redis está acessível.`);
          return 30000; // Esperar 30 segundos antes de tentar novamente
        }
        return delay;
      },
    };

    // Criar worker para processar jobs de confirmação de agendamento
    this.confirmacaoWorker = new Worker(
      'confirmacao-agendamento',
      async (job: Job) => {
        return await this.processarJobConfirmacao(job);
      },
      {
        connection: this.redisConnectionOptions,
        concurrency: 5, // Processar até 5 jobs simultaneamente
        limiter: {
          max: 10, // Máximo de 10 jobs por segundo
          duration: 1000,
        },
      },
    );

    // Event listeners para worker de confirmação
    this.confirmacaoWorker.on('completed', (job: Job) => {
      console.log(`✅ Job ${job.id} concluído: ${job.name}`);
      newRelicLog('info', 'Job de confirmação de agendamento concluído', {
        jobId: job.id,
        jobName: job.name,
        consultaId: job.data.consultaId,
      });
    });

    this.confirmacaoWorker.on('failed', (job: Job | undefined, error: Error) => {
      console.error(`❌ Job ${job?.id} falhou: ${error.message}`);
      newRelicLog('error', 'Job de confirmação de agendamento falhou', {
        jobId: job?.id,
        jobName: job?.name,
        consultaId: job?.data?.consultaId,
        error: error.message,
        stack: error.stack,
      });
    });

    this.confirmacaoWorker.on('error', (error: Error) => {
      console.error(`❌ Erro no worker de confirmação: ${error.message}`);
      newRelicLog('error', 'Erro no worker de confirmação de agendamento', {
        error: error.message,
        stack: error.stack,
      });
    });

    console.log('✅ Worker de confirmação de agendamento iniciado');

    // Criar worker para processar jobs de recorrências
    this.recorrenciaWorker = new Worker(
      'processar-recorrencia',
      async (job: Job) => {
        return await this.processarJobRecorrencia(job);
      },
      {
        connection: this.redisConnectionOptions,
        concurrency: 3, // Processar até 3 recorrências simultaneamente (mais conservador)
        limiter: {
          max: 5, // Máximo de 5 jobs por segundo (para não sobrecarregar API ASAAS)
          duration: 1000,
        },
      },
    );

    // Event listeners para worker de recorrências
    this.recorrenciaWorker.on('completed', (job: Job) => {
      console.log(`✅ Job de recorrência ${job.id} concluído: ${job.name}`);
      newRelicLog('info', 'Job de processamento de recorrência concluído', {
        jobId: job.id,
        jobName: job.name,
        recorrenciaId: job.data.recorrenciaId,
        assinaturaId: job.data.assinaturaId,
      });
    });

    this.recorrenciaWorker.on('failed', (job: Job | undefined, error: Error) => {
      console.error(`❌ Job de recorrência ${job?.id} falhou: ${error.message}`);
      newRelicLog('error', 'Job de processamento de recorrência falhou', {
        jobId: job?.id,
        jobName: job?.name,
        recorrenciaId: job?.data?.recorrenciaId,
        assinaturaId: job?.data?.assinaturaId,
        error: error.message,
        stack: error.stack,
      });
    });

    this.recorrenciaWorker.on('error', (error: Error) => {
      console.error(`❌ Erro no worker de recorrências: ${error.message}`);
      newRelicLog('error', 'Erro no worker de processamento de recorrências', {
        error: error.message,
        stack: error.stack,
      });
    });

    console.log('✅ Worker de processamento de recorrências iniciado');
  }

  /**
   * Processa um job de confirmação de agendamento
   */
  private async processarJobConfirmacao(job: Job): Promise<void> {
    const { consultaId, clienteMasterId } = job.data;

    console.log(`🔄 Processando job ${job.id}: Enviar SMS de confirmação para consulta ${consultaId}`);

    try {
      // Chamar o serviço para enviar SMS de confirmação
      await this.calendarioService.solicitarConfirmacaoAgendamento(
        consultaId,
        clienteMasterId,
      );

      console.log(`✅ SMS de confirmação enviado para consulta ${consultaId}`);
    } catch (error: any) {
      console.error(`❌ Erro ao processar job ${job.id}:`, error.message);
      
      // Re-throw para que o BullMQ possa fazer retry
      throw error;
    }
  }

  /**
   * Processa um job de recorrência
   */
  private async processarJobRecorrencia(job: Job): Promise<void> {
    const { recorrenciaId, assinaturaId } = job.data;

    console.log(`🔄 Processando job ${job.id}: Processar recorrência ${recorrenciaId} para assinatura ${assinaturaId}`);

    try {
      // Chamar o serviço para processar a recorrência individual
      await this.assinaturasService.processarRecorrenciaIndividual(
        recorrenciaId,
        assinaturaId,
      );

      console.log(`✅ Recorrência ${recorrenciaId} processada com sucesso`);
    } catch (error: any) {
      console.error(`❌ Erro ao processar job ${job.id}:`, error.message);
      
      // Re-throw para que o BullMQ possa fazer retry
      throw error;
    }
  }

  async onModuleDestroy() {
    console.log('🔌 Fechando workers...');
    
    if (this.confirmacaoWorker) {
      await this.confirmacaoWorker.close();
    }
    
    if (this.recorrenciaWorker) {
      await this.recorrenciaWorker.close();
    }
    
    console.log('✅ Workers fechados');
  }
}

