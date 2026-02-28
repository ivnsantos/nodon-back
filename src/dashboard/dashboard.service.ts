import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Radiografia } from '../radiografias/entities/radiografia.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { CalendarioService } from '../calendario/calendario.service';
import { ChatService } from '../chat/chat.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { ClientesMasterService } from '../users/clientes-master.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Radiografia)
    private radiografiaRepository: Repository<Radiografia>,
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
    @Inject(forwardRef(() => AssinaturasService))
    private assinaturasService: AssinaturasService,
    @Inject(forwardRef(() => CalendarioService))
    private calendarioService: CalendarioService,
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
    @Inject(forwardRef(() => PacientesService))
    private pacientesService: PacientesService,
    private clientesMasterService: ClientesMasterService,
  ) {}

  async getDashboardData(clienteMasterId: string, userId: string, userTipo: string) {
    try {
      const agora = new Date();
      const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);
    
    // Início e fim da semana (domingo a sábado)
    const diaSemana = agora.getDay();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - diaSemana);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59);

    // 1. Diagnósticos (Radiografias)
    const totalDiagnosticos = await this.radiografiaRepository
      .createQueryBuilder('radiografia')
      .where('radiografia.clienteMasterId = :clienteMasterId', { clienteMasterId })
      .getCount();
    
    const diagnosticosEsteMes = await this.radiografiaRepository
      .createQueryBuilder('radiografia')
      .where('radiografia.clienteMasterId = :clienteMasterId', { clienteMasterId })
      .andWhere('radiografia.createdAt >= :inicioMes', { inicioMes })
      .andWhere('radiografia.createdAt <= :fimMes', { fimMes })
      .getCount();

    // 2. Conversas (Chat)
    const conversas = await this.chatService.getConversationsByUser(userId);
    const totalConversas = conversas.length;

    // Tokens: buscar direto no Chat (conversas + mensagens) e limite na assinatura
    let tokensUsados = 0;
    let tokensLimite = 0;
    try {
      const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
      const ownerUserId = clienteMaster?.userId;
      if (ownerUserId) {
        const fromConversations = await this.chatService.getTotalTokensForDashboard(clienteMasterId, ownerUserId);
        const fromMessages = await this.chatService.getTotalTokensFromMessagesForDashboard(clienteMasterId, ownerUserId);
        tokensUsados = Math.max(Number(fromConversations), Number(fromMessages));
      } else {
        tokensUsados = Number(await this.chatService.getTotalTokensByClienteMaster(clienteMasterId));
      }
      const dashboardInfo = await this.assinaturasService.getDashboardInfo(clienteMasterId, userTipo);
      tokensLimite = Number(dashboardInfo?.tokensChat?.limitePlano ?? 0);
    } catch (err: any) {
      console.warn('[Dashboard] Erro ao buscar tokens/limite:', err?.message);
    }
    const porcentagemTokens = tokensLimite > 0 ? Math.round((tokensUsados / tokensLimite) * 100 * 10) / 10 : 0;

    // 3. Consultas
    // Para consultas de hoje, usar início e fim do dia para garantir comparação correta
    const inicioHoje = new Date(hoje);
    inicioHoje.setHours(0, 0, 0, 0);
    const fimHoje = new Date(hoje);
    fimHoje.setHours(23, 59, 59, 999);
    
    // Data de amanhã
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    const inicioAmanha = new Date(amanha);
    inicioAmanha.setHours(0, 0, 0, 0);
    const fimAmanha = new Date(amanha);
    fimAmanha.setHours(23, 59, 59, 999);
    
    const hojeStr = hoje.toISOString().split('T')[0];
    const amanhaStr = amanha.toISOString().split('T')[0];
    
    // Buscar consultas de hoje
    const consultasHoje = await this.calendarioService.findAllConsultas(clienteMasterId, {
      dataInicio: hojeStr,
      dataFim: hojeStr,
    });
    
    // Filtrar apenas consultas que realmente são de hoje (comparar apenas a data)
    const consultasHojeFiltradas = consultasHoje.filter(consulta => {
      let dataConsulta: Date;
      if (consulta.dataConsulta instanceof Date) {
        dataConsulta = consulta.dataConsulta;
      } else if (typeof consulta.dataConsulta === 'string') {
        dataConsulta = new Date(consulta.dataConsulta);
      } else {
        dataConsulta = new Date(consulta.dataConsulta as any);
      }
      return dataConsulta.toISOString().split('T')[0] === hojeStr;
    });
    
    // Buscar consultas de amanhã
    const consultasAmanha = await this.calendarioService.findAllConsultas(clienteMasterId, {
      dataInicio: amanhaStr,
      dataFim: amanhaStr,
    });
    
    // Filtrar apenas consultas que realmente são de amanhã
    const consultasAmanhaFiltradas = consultasAmanha.filter(consulta => {
      let dataConsulta: Date;
      if (consulta.dataConsulta instanceof Date) {
        dataConsulta = consulta.dataConsulta;
      } else if (typeof consulta.dataConsulta === 'string') {
        dataConsulta = new Date(consulta.dataConsulta);
      } else {
        dataConsulta = new Date(consulta.dataConsulta as any);
      }
      return dataConsulta.toISOString().split('T')[0] === amanhaStr;
    });
    
    const consultasEstaSemana = await this.calendarioService.findAllConsultas(clienteMasterId, {
      dataInicio: inicioSemana.toISOString().split('T')[0],
      dataFim: fimSemana.toISOString().split('T')[0],
    });

    // 4. Clientes (Pacientes)
    const pacientes = await this.pacientesService.findAll(clienteMasterId, userId, userTipo);
    const pacientesAtivos = pacientes.filter(p => p.status === 'ativo' || p.status === null);

    // 5. Diagnósticos Recentes (últimas 5 radiografias)
    const diagnosticosRecentes = await this.radiografiaRepository
      .createQueryBuilder('radiografia')
      .leftJoinAndSelect('radiografia.paciente', 'paciente')
      .where('radiografia.clienteMasterId = :clienteMasterId', { clienteMasterId })
      .orderBy('radiografia.createdAt', 'DESC')
      .limit(5)
      .getMany();

    // 6. Uso de Tokens (utilizados, limite, quanto falta, porcentagem)
    const usoTokens = {
      utilizados: tokensUsados,
      limite: tokensLimite,
      restantes: Math.max(0, tokensLimite - tokensUsados),
      porcentagem: porcentagemTokens,
    };

    // Helper para formatar consulta
    const formatarConsulta = (consulta: any) => {
      let dataConsulta: Date;
      if (consulta.dataConsulta instanceof Date) {
        dataConsulta = consulta.dataConsulta;
      } else if (typeof consulta.dataConsulta === 'string') {
        dataConsulta = new Date(consulta.dataConsulta);
      } else {
        dataConsulta = new Date(consulta.dataConsulta as any);
      }

      return {
        id: consulta.id,
        hora: consulta.horaConsulta,
        paciente: consulta.paciente ? {
          id: consulta.paciente.id,
          nome: consulta.paciente.nome,
        } : null,
        tipoConsulta: consulta.tipoConsulta ? {
          id: consulta.tipoConsulta.id,
          nome: consulta.tipoConsulta.nome,
          cor: consulta.tipoConsulta.cor,
        } : null,
        titulo: consulta.titulo,
        observacoes: consulta.observacoes,
        status: consulta.status,
        data: dataConsulta.toISOString().split('T')[0],
        dataRelativa: this.getDataRelativa(dataConsulta),
        profissional: consulta.profissional ? {
          id: consulta.profissional.id,
          nome: consulta.profissional.user?.nome || 'Profissional',
        } : null,
      };
    };

    return {
      resumo: {
        diagnosticos: {
          total: totalDiagnosticos,
          esteMes: diagnosticosEsteMes,
        },
        conversas: {
          total: totalConversas,
          porcentagemTokensUsados: porcentagemTokens,
        },
        consultas: {
          hoje: consultasHojeFiltradas.length,
          estaSemana: consultasEstaSemana.length,
        },
        clientes: {
          total: pacientes.length,
          ativos: pacientesAtivos.length,
        },
      },
      consultasHoje: consultasHojeFiltradas.map(formatarConsulta),
      consultasAmanha: consultasAmanhaFiltradas.map(formatarConsulta),
      usoTokens,
      diagnosticosRecentes: diagnosticosRecentes.map(diag => {
        // Converter data para Date se necessário
        let data: Date;
        if (diag.data instanceof Date) {
          data = diag.data;
        } else if (typeof diag.data === 'string') {
          data = new Date(diag.data);
        } else {
          data = new Date(diag.data as any);
        }

        return {
          id: diag.id,
          paciente: diag.paciente?.nome || diag.nome,
          tipoExame: diag.tipoExame || 'Radiografia',
          data: data.toISOString().split('T')[0],
          achados: diag.achadosRadiograficos?.length || 0,
          status: diag.achadosRadiograficos && diag.achadosRadiograficos.length > 0 ? 'completo' : 'pendente',
        };
      }),
    };
    } catch (error) {
      console.error('❌ Erro ao buscar dados do dashboard:', {
        clienteMasterId,
        userId,
        userTipo,
        error: error?.message || error,
        stack: error?.stack,
      });
      throw error;
    }
  }

  private getDataRelativa(data: Date): string {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataConsulta = new Date(data);
    dataConsulta.setHours(0, 0, 0, 0);
    
    const diffTime = dataConsulta.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays === -1) return 'Ontem';
    if (diffDays > 1 && diffDays <= 7) return `Em ${diffDays} dias`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} dias atrás`;
    
    return dataConsulta.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
}

