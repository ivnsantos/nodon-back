import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consulta } from './entities/consulta.entity';
import { CalendarioService } from './calendario.service';
import { newRelicLog } from '../common/utils/newrelic-logger';

@Injectable()
export class CalendarioCronService {

  constructor(
    @InjectRepository(Consulta)
    private consultaRepository: Repository<Consulta>,
    private calendarioService: CalendarioService,
  ) {}

  /**
   * CRON job que roda todo minuto (para testes)
   * Usa expressão cron: * * * * * (todo minuto)
   * TODO: Alterar para '0 7 * * *' em produção (todo dia às 7h)
   */
  @Cron('0 7 * * *', {
    name: 'enviar-sms-confirmacao-consultas',
    timeZone: 'America/Sao_Paulo',
  })
  async handleCronEnviarSmsConfirmacao() {
    const dataExecucao = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    console.log(`\n${'#'.repeat(80)}`);
    console.log(`⏰ [${dataExecucao}] Executando CRON agendado às 7h da manhã - Enviar SMS de confirmação`);
    console.log(`${'#'.repeat(80)}\n`);
    
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
      console.error(`   Stack:`, error.stack);
      
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

    if (consultas.length === 0) {
      console.log('ℹ️ Nenhuma consulta encontrada para processar');
      return;
    }

    let sucessos = 0;
    let erros = 0;

    for (const consulta of consultas) {
      try {
        // Verificar se tem paciente vinculado e telefone
        if (!consulta.pacienteId || !consulta.paciente) {
          console.warn(`⚠️ Consulta ${consulta.id} não possui paciente vinculado. Pulando...`);
          continue;
        }

        if (!consulta.paciente.telefone) {
          console.warn(`⚠️ Consulta ${consulta.id} - Paciente não possui telefone. Pulando...`);
          continue;
        }

        if (!consulta.clienteMasterId) {
          console.warn(`⚠️ Consulta ${consulta.id} não possui cliente master. Pulando...`);
          continue;
        }

        // Enviar SMS de confirmação
        await this.calendarioService.solicitarConfirmacaoAgendamento(
          consulta.id,
          consulta.clienteMasterId,
        );

        sucessos++;
        console.log(`✅ SMS enviado para consulta ${consulta.id} - Paciente: ${consulta.paciente.nome || 'N/A'}`);
      } catch (error: any) {
        erros++;
        console.error(`❌ Erro ao enviar SMS para consulta ${consulta.id}: ${error.message}`);
        if (error.stack) {
          console.error(`   Stack: ${error.stack}`);
        }
      }
    }

    console.log(`✅ Processamento concluído. Sucessos: ${sucessos}, Erros: ${erros}, Total: ${consultas.length}`);
    
    // Log customizado para New Relic
    newRelicLog('info', 'CRON: Envio de SMS de confirmação concluído', {
      cronName: 'enviar-sms-confirmacao-consultas',
      totalConsultas: consultas.length,
      sucessos,
      erros,
    });
  }
}

