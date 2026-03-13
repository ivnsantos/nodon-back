import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consulta } from './entities/consulta.entity';
import { CalendarioService } from './calendario.service';
import { newRelicLog } from '../common/utils/newrelic-logger';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class CalendarioCronService {

  constructor(
    @InjectRepository(Consulta)
    private consultaRepository: Repository<Consulta>,
    private calendarioService: CalendarioService,
    private queueService: QueueService,
  ) {}

  /**
   * CRON job que roda a cada 6 horas (para testes)
   * Usa expressão cron: a cada 6 horas
   * TODO: Alterar para '0 7 * * *' em produção (todo dia às 7h)
   */
  @Cron('0 6 * * *', {
    name: 'enviar-sms-confirmacao-consultas',
    timeZone: 'America/Sao_Paulo',
  })
  async handleCronEnviarSmsConfirmacao() {
    const dataExecucao = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    // Log customizado para New Relic
    newRelicLog('info', 'CRON: Iniciando envio de SMS de confirmação', {
      cronName: 'enviar-sms-confirmacao-consultas',
      dataExecucao,
      timeZone: 'America/Sao_Paulo',
    });
    
    try {
      await this.enviarSmsConfirmacaoConsultasAmanha();
    } catch (error: any) {
      console.error(`❌ Erro no CRON automático:`, error.message);
      
      // Log customizado para New Relic
      newRelicLog('error', 'CRON: Erro ao enviar SMS de confirmação', {
        cronName: 'enviar-sms-confirmacao-consultas',
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Envia SMS de confirmação para consultas do dia seguinte com status 'agendada'
   * Agora usa BullMQ para processar jobs de forma assíncrona
   */
  async enviarSmsConfirmacaoConsultasAmanha() {
    // Calcular data de amanhã (sem hora, apenas data)
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    amanha.setHours(0, 0, 0, 0);

    // Formatar data para YYYY-MM-DD
    const ano = amanha.getFullYear();
    const mes = String(amanha.getMonth() + 1).padStart(2, '0');
    const dia = String(amanha.getDate()).padStart(2, '0');
    const dataAmanha = `${ano}-${mes}-${dia}`;

    console.log(`📅 Buscando consultas para ${dataAmanha} com status 'agendada'`);

    // Buscar consultas do dia seguinte com status 'agendada' e que tenham paciente vinculado
    const consultas = await this.consultaRepository
      .createQueryBuilder('consulta')
      .leftJoinAndSelect('consulta.paciente', 'paciente')
      .leftJoinAndSelect('consulta.clienteMaster', 'clienteMaster')
      .where('consulta.data_consulta = :dataAmanha', { dataAmanha })
      .andWhere('consulta.status = :status', { status: 'agendada' })
      .andWhere('consulta.paciente_id IS NOT NULL')
      .getMany();

    console.log(`📊 Encontradas ${consultas.length} consultas para processar`);

    newRelicLog('info', 'CRON: Encontradas consultas para processar', {
      cronName: 'enviar-sms-confirmacao-consultas',
      consultasEncontradas: consultas.length,
    });
    
    if (consultas.length === 0) {
      console.log('ℹ️ Nenhuma consulta encontrada para processar');
      return;
    }

    let jobsAdicionados = 0;
    let jobsPulados = 0;

    // Adicionar cada consulta como um job na fila
    for (const consulta of consultas) {
      try {
        // Verificar se tem paciente vinculado e telefone
        if (!consulta.pacienteId || !consulta.paciente) {
          console.warn(`⚠️ Consulta ${consulta.id} não possui paciente vinculado. Pulando...`);
          jobsPulados++;
          continue;
        }

        if (!consulta.paciente.telefone) {
          console.warn(`⚠️ Consulta ${consulta.id} - Paciente não possui telefone. Pulando...`);
          jobsPulados++;
          continue;
        }

        if (!consulta.clienteMasterId) {
          console.warn(`⚠️ Consulta ${consulta.id} não possui cliente master. Pulando...`);
          jobsPulados++;
          continue;
        }

        newRelicLog('info', 'CRON: Adicionando job à fila', {
          cronName: 'enviar-sms-confirmacao-consultas',
          consultaId: consulta.id,
          pacienteId: consulta.pacienteId,
          clienteMasterId: consulta.clienteMasterId,
        });

        // Adicionar job na fila (processamento assíncrono)
        await this.queueService.adicionarJobConfirmacaoAgendamento(
          consulta.id,
          consulta.clienteMasterId,
        );

        jobsAdicionados++;
        console.log(`📋 Job adicionado à fila para consulta ${consulta.id} - Paciente: ${consulta.paciente.nome || 'N/A'}`);
      } catch (error: any) {
        jobsPulados++;
        console.error(`❌ Erro ao adicionar job para consulta ${consulta.id}: ${error.message}`);
        if (error.stack) {
          console.error(`   Stack: ${error.stack}`);
        }
      }
    }

    console.log(`✅ Jobs adicionados à fila. Total: ${jobsAdicionados}, Pulados: ${jobsPulados}, Total consultas: ${consultas.length}`);
    console.log(`📊 Os jobs serão processados assincronamente pelo worker`);
    
    // Log customizado para New Relic
    newRelicLog('info', 'CRON: Jobs de confirmação de agendamento adicionados à fila', {
      cronName: 'enviar-sms-confirmacao-consultas',
      totalConsultas: consultas.length,
      jobsAdicionados,
      jobsPulados,
    });
  }
}

