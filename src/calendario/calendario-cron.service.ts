import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consulta } from './entities/consulta.entity';
import { CalendarioService } from './calendario.service';

@Injectable()
export class CalendarioCronService {
  private readonly logger = new Logger(CalendarioCronService.name);

  constructor(
    @InjectRepository(Consulta)
    private consultaRepository: Repository<Consulta>,
    private calendarioService: CalendarioService,
  ) {}

  /**
   * Cron job que roda todo dia às 7h da manhã
   * Envia SMS de confirmação para consultas do dia seguinte com status 'agendada'
   */
  @Cron('0 7 * * *', {
    name: 'enviar-sms-confirmacao-consultas',
    timeZone: 'America/Sao_Paulo',
  })
  async enviarSmsConfirmacaoConsultasAmanha() {
    this.logger.log('🕐 Iniciando cron job: Enviar SMS de confirmação para consultas de amanhã');

    try {
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

      this.logger.log(`📅 Buscando consultas para ${dataAmanha} com status 'agendada'`);

      // Buscar consultas do dia seguinte com status 'agendada' e que tenham paciente vinculado
      // Usar QueryBuilder para comparar data corretamente
      const consultas = await this.consultaRepository
        .createQueryBuilder('consulta')
        .leftJoinAndSelect('consulta.paciente', 'paciente')
        .leftJoinAndSelect('consulta.clienteMaster', 'clienteMaster')
        .where('consulta.data_consulta = :dataAmanha', { dataAmanha })
        .andWhere('consulta.status = :status', { status: 'agendada' })
        .andWhere('consulta.paciente_id IS NOT NULL')
        .getMany();

      this.logger.log(`📊 Encontradas ${consultas.length} consultas para processar`);

      let sucessos = 0;
      let erros = 0;

      for (const consulta of consultas) {
        try {
          // Verificar se tem paciente vinculado e telefone
          if (!consulta.pacienteId || !consulta.paciente) {
            this.logger.warn(`⚠️ Consulta ${consulta.id} não possui paciente vinculado. Pulando...`);
            continue;
          }

          if (!consulta.paciente.telefone) {
            this.logger.warn(`⚠️ Consulta ${consulta.id} - Paciente não possui telefone. Pulando...`);
            continue;
          }

          if (!consulta.clienteMasterId) {
            this.logger.warn(`⚠️ Consulta ${consulta.id} não possui cliente master. Pulando...`);
            continue;
          }

          // Enviar SMS de confirmação
          await this.calendarioService.solicitarConfirmacaoAgendamento(
            consulta.id,
            consulta.clienteMasterId,
          );

          sucessos++;
          this.logger.log(`✅ SMS enviado para consulta ${consulta.id} - Paciente: ${consulta.paciente.nome || 'N/A'}`);
        } catch (error) {
          erros++;
          this.logger.error(
            `❌ Erro ao enviar SMS para consulta ${consulta.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `✅ Cron job finalizado. Sucessos: ${sucessos}, Erros: ${erros}, Total: ${consultas.length}`,
      );
    } catch (error) {
      this.logger.error(`❌ Erro crítico no cron job: ${error.message}`, error.stack);
    }
  }
}

