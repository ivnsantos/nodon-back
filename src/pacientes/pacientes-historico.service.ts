import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoricoPaciente } from './entities/historico-paciente.entity';
import { PacientesService } from './pacientes.service';
import { UserBaseService } from '../users/services/user-base.service';
import { UserComumService } from '../users/services/user-comum.service';
import { ClientesMasterService } from '../users/clientes-master.service';

@Injectable()
export class PacientesHistoricoService {
  constructor(
    @InjectRepository(HistoricoPaciente)
    private historicoRepository: Repository<HistoricoPaciente>,
    @Inject(forwardRef(() => PacientesService))
    private pacientesService: PacientesService,
    private userBaseService: UserBaseService,
    private userComumService: UserComumService,
    private clientesMasterService: ClientesMasterService,
  ) {}

  async registrarAlteracao(
    pacienteId: string,
    campoAlterado: string,
    valorAnterior: any,
    valorNovo: any,
    userId: string,
    userTipo: string,
  ): Promise<void> {
    try {
      // Converter valores para string para armazenar
      const valorAnteriorStr = valorAnterior !== null && valorAnterior !== undefined 
        ? String(valorAnterior) 
        : null;
      const valorNovoStr = valorNovo !== null && valorNovo !== undefined 
        ? String(valorNovo) 
        : null;

      // Criar descrição amigável da alteração
      const descricaoAlteracao = this.criarDescricaoAlteracao(campoAlterado, valorAnteriorStr, valorNovoStr);

      // Determinar userId e clienteMasterId baseado no tipo de usuário
      let clienteMasterId: string | null = null;
      let userIdParaHistorico: string | null = null;
      
      if (userTipo === 'master') {
        try {
          const clientesMaster = await this.clientesMasterService.findByUserId(userId);
          if (clientesMaster && clientesMaster.length > 0) {
            clienteMasterId = clientesMaster[0].id;
          }
        } catch (error: any) {
          console.error('Erro ao buscar cliente master para histórico:', error?.message);
        }
      } else if (userTipo === 'usuario') {
        userIdParaHistorico = userId;
        try {
          // Para usuário comum, buscar o clienteMasterId vinculado
          const usuariosComuns = await this.userComumService.findByUserId(userId);
          if (usuariosComuns && usuariosComuns.length > 0) {
            clienteMasterId = usuariosComuns[0].clienteMasterId;
          }
        } catch (error: any) {
          console.error('Erro ao buscar user comum para histórico:', error?.message);
        }
      }

      const historico = this.historicoRepository.create({
        pacienteId,
        userId: userIdParaHistorico,
        clienteMasterId: clienteMasterId,
        campoAlterado,
        valorAnterior: valorAnteriorStr,
        valorNovo: valorNovoStr,
        descricaoAlteracao,
      });

      await this.historicoRepository.save(historico);
    } catch (error: any) {
      console.error('Erro ao registrar alteração no histórico:', {
        pacienteId,
        campoAlterado,
        error: error?.message || error,
        stack: error?.stack,
      });
      throw error; // Re-throw para que o erro seja logado mas não bloqueie a atualização
    }
  }

  async buscarHistoricoPorPaciente(
    pacienteId: string,
    userId: string,
    userTipo: string,
  ): Promise<any[]> {
    // Verificar permissão através do paciente
    const paciente = await this.pacientesService.findOne(pacienteId, userId, userTipo);

    // Buscar histórico com relacionamentos (limitado a 5 itens mais recentes)
    const historico = await this.historicoRepository.find({
      where: { pacienteId },
      relations: ['user', 'clienteMaster'],
      order: { createdAt: 'DESC' },
      take: 5, // Limitar a 5 itens
    });

    // Enriquecer com nomes dos usuários
    const historicoEnriquecido = await Promise.all(
      historico.map(async (item) => {
        let nomeAlterador = 'Sistema';
        
        if (item.userId && item.user) {
          nomeAlterador = item.user.nome;
        } else if (item.clienteMasterId && item.clienteMaster) {
          // Buscar o user base do cliente master
          const userBase = await this.userBaseService.findById(item.clienteMaster.userId);
          if (userBase) {
            nomeAlterador = userBase.nome;
          }
        }

        // Formatar data e hora no formato brasileiro (DD/MM/YYYY, HH:mm:ss)
        const dataFormatada = this.formatarDataHoraBrasil(item.createdAt);

        return {
          id: item.id,
          pacienteId: item.pacienteId,
          campoAlterado: item.campoAlterado,
          valorAnterior: item.valorAnterior,
          valorNovo: item.valorNovo,
          descricaoAlteracao: item.descricaoAlteracao,
          nomeAlterador: nomeAlterador,
          createdAt: item.createdAt,
          dataFormatada: dataFormatada, // Data formatada no padrão brasileiro
        };
      })
    );

    return historicoEnriquecido;
  }

  private criarDescricaoAlteracao(campoAlterado: string, valorAnterior: string | null, valorNovo: string | null): string {
    const camposAmigaveis: Record<string, string> = {
      nome: 'Nome do paciente',
      cpf: 'CPF',
      dataNascimento: 'Data de nascimento',
      email: 'E-mail',
      telefone: 'Telefone',
      status: 'Status',
      cep: 'CEP',
      rua: 'Rua',
      numero: 'Número',
      complemento: 'Complemento',
      bairro: 'Bairro',
      cidade: 'Cidade',
      estado: 'Estado',
      necessidades: 'Necessidades',
      observacoes: 'Observações',
    };

    const nomeCampo = camposAmigaveis[campoAlterado] || campoAlterado;

    if (campoAlterado === 'status') {
      return `Status alterado para "${valorNovo || 'N/A'}"`;
    }

    if (valorAnterior === null || valorAnterior === '') {
      return `${nomeCampo} definido como "${valorNovo || 'N/A'}"`;
    }

    if (valorNovo === null || valorNovo === '') {
      return `${nomeCampo} removido (era "${valorAnterior}")`;
    }

    return `${nomeCampo} alterado de "${valorAnterior}" para "${valorNovo}"`;
  }

  private formatarDataHoraBrasil(data: Date | string): string {
    try {
      // Converter para Date se for string
      let dataObj: Date;
      if (typeof data === 'string') {
        // Se for string ISO, criar Date diretamente
        dataObj = new Date(data);
      } else {
        dataObj = data;
      }
      
      // Verificar se a data é válida
      if (isNaN(dataObj.getTime())) {
        console.error('Data inválida:', data);
        return '';
      }

      // Usar Intl.DateTimeFormat com timezone do Brasil
      // Isso garante conversão correta considerando horário de verão
      const opcoes: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      };

      const formatter = new Intl.DateTimeFormat('pt-BR', opcoes);
      const partes = formatter.formatToParts(dataObj);
      
      const dia = partes.find(p => p.type === 'day')?.value.padStart(2, '0') || '00';
      const mes = partes.find(p => p.type === 'month')?.value.padStart(2, '0') || '00';
      const ano = partes.find(p => p.type === 'year')?.value || '0000';
      const horas = partes.find(p => p.type === 'hour')?.value.padStart(2, '0') || '00';
      const minutos = partes.find(p => p.type === 'minute')?.value.padStart(2, '0') || '00';

      return `${dia}/${mes}/${ano}, ${horas}:${minutos}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error, 'Data original:', data);
      return '';
    }
  }
}
