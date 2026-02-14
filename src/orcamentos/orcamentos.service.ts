import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Orcamento, StatusOrcamento } from './entities/orcamento.entity';
import { ItemOrcamento, StatusItemOrcamento } from './entities/item-orcamento.entity';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';
import { ClientesMasterService } from '../users/clientes-master.service';
import { UserComumService } from '../users/services/user-comum.service';
import { PacientesService } from '../pacientes/pacientes.service';

@Injectable()
export class OrcamentosService {
  constructor(
    @InjectRepository(Orcamento)
    private orcamentoRepository: Repository<Orcamento>,
    @InjectRepository(ItemOrcamento)
    private itemOrcamentoRepository: Repository<ItemOrcamento>,
    @Inject(forwardRef(() => ClientesMasterService))
    private clientesMasterService: ClientesMasterService,
    private userComumService: UserComumService,
    @Inject(forwardRef(() => PacientesService))
    private pacientesService: PacientesService,
  ) {}

  /**
   * Verifica se o usuário tem permissão para acessar o cliente master
   */
  private async verificarPermissao(userId: string, userTipo: string, clienteMasterId: string): Promise<void> {
    if (userTipo === 'master') {
      const clientesMaster = await this.clientesMasterService.findByUserId(userId);
      const temAcesso = clientesMaster.some((cm) => cm.id === clienteMasterId);
      if (!temAcesso) {
        throw new ForbiddenException('Você não tem permissão para acessar este recurso');
      }
    } else {
      const usuariosComuns = await this.userComumService.findByUserId(userId);
      const temAcesso = usuariosComuns.some((uc) => uc.clienteMasterId === clienteMasterId);
      if (!temAcesso) {
        throw new ForbiddenException('Você não tem permissão para acessar este recurso');
      }
    }
  }

  /**
   * Calcula o valor total do orçamento baseado nos itens (todos os status, exceto RECUSADO e PERDIDO)
   */
  private calcularValorTotal(itens: ItemOrcamento[]): number {
    return itens
      .filter((item) => item.status !== StatusItemOrcamento.RECUSADO && item.status !== StatusItemOrcamento.PERDIDO)
      .reduce((total, item) => total + Number(item.preco) * item.quantidade, 0);
  }

  /**
   * Cria um novo orçamento
   */
  async create(createOrcamentoDto: CreateOrcamentoDto, userId: string, userTipo: string): Promise<Orcamento> {
    const { pacienteId, clienteMasterId, itens, ...orcamentoData } = createOrcamentoDto;

    if (!pacienteId) {
      throw new BadRequestException('Paciente ID é obrigatório');
    }

    if (!clienteMasterId) {
      throw new BadRequestException('Cliente Master ID é obrigatório');
    }

    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    // Verificar se o paciente existe e pertence ao cliente master
    const paciente = await this.pacientesService.findOne(pacienteId, userId, userTipo);
    if (paciente.clienteMasterId !== clienteMasterId) {
      throw new BadRequestException('Paciente não pertence ao Cliente Master especificado');
    }

    // Criar orçamento
    const orcamento = this.orcamentoRepository.create({
      pacienteId,
      clienteMasterId,
      status: orcamentoData.status || StatusOrcamento.RASCUNHO,
      observacoes: orcamentoData.observacoes || null,
      valorTotal: 0,
    });

    const orcamentoSalvo = await this.orcamentoRepository.save(orcamento);

    // Criar itens se fornecidos
    if (itens && itens.length > 0) {
      const itensCriados = itens.map((itemDto, index) => {
        const item = this.itemOrcamentoRepository.create({
          orcamentoId: orcamentoSalvo.id,
          tratamentoId: itemDto.tratamentoId || null,
          nome: itemDto.nome,
          descricao: itemDto.descricao || null,
          preco: itemDto.preco,
          quantidade: itemDto.quantidade || 1,
          status: itemDto.status || StatusItemOrcamento.EM_ANALISE,
          ordem: itemDto.ordem !== undefined ? itemDto.ordem : index,
        });
        return item;
      });

      await this.itemOrcamentoRepository.save(itensCriados);

      // Recalcular valor total
      const itensSalvos = await this.itemOrcamentoRepository.find({
        where: { orcamentoId: orcamentoSalvo.id },
      });
      orcamentoSalvo.valorTotal = this.calcularValorTotal(itensSalvos);
      await this.orcamentoRepository.save(orcamentoSalvo);
    }

    return this.findOne(orcamentoSalvo.id, userId, userTipo);
  }

  /**
   * Lista todos os orçamentos de um paciente ou cliente master
   */
  async findAll(
    clienteMasterId: string,
    userId: string,
    userTipo: string,
    pacienteId?: string,
    status?: StatusOrcamento,
  ): Promise<Orcamento[]> {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    const where: any = { clienteMasterId };
    if (pacienteId) {
      where.pacienteId = pacienteId;
    }
    if (status) {
      where.status = status;
    }

    return this.orcamentoRepository.find({
      where,
      relations: ['paciente', 'itens', 'itens.tratamento'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca todos os orçamentos de um paciente específico
   */
  async findByPaciente(
    pacienteId: string,
    clienteMasterId: string,
    userId: string,
    userTipo: string,
  ): Promise<Orcamento[]> {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    // Verificar se o paciente existe e pertence ao cliente master
    const paciente = await this.pacientesService.findOne(pacienteId, userId, userTipo);
    if (paciente.clienteMasterId !== clienteMasterId) {
      throw new BadRequestException('Paciente não pertence ao Cliente Master especificado');
    }

    return this.orcamentoRepository.find({
      where: {
        pacienteId,
        clienteMasterId,
      },
      relations: ['paciente', 'itens', 'itens.tratamento'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca um orçamento específico
   */
  async findOne(id: string, userId: string, userTipo: string): Promise<Orcamento> {
    const orcamento = await this.orcamentoRepository.findOne({
      where: { id },
      relations: ['paciente', 'itens', 'itens.tratamento'],
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    await this.verificarPermissao(userId, userTipo, orcamento.clienteMasterId);

    return orcamento;
  }

  /**
   * Atualiza um orçamento
   */
  async update(id: string, updateOrcamentoDto: UpdateOrcamentoDto, userId: string, userTipo: string): Promise<Orcamento> {
    const orcamento = await this.findOne(id, userId, userTipo);

    if (updateOrcamentoDto.status !== undefined) {
      orcamento.status = updateOrcamentoDto.status;
    }
    if (updateOrcamentoDto.observacoes !== undefined) {
      orcamento.observacoes = updateOrcamentoDto.observacoes;
    }

    // Atualizar itens se fornecidos
    if (updateOrcamentoDto.itens !== undefined) {
      // Remover itens antigos
      await this.itemOrcamentoRepository.delete({ orcamentoId: id });

      // Criar novos itens
      if (updateOrcamentoDto.itens.length > 0) {
        const itensCriados = updateOrcamentoDto.itens.map((itemDto, index) => {
          const item = this.itemOrcamentoRepository.create({
            orcamentoId: id,
            tratamentoId: itemDto.tratamentoId || null,
            nome: itemDto.nome,
            descricao: itemDto.descricao || null,
            preco: itemDto.preco,
            quantidade: itemDto.quantidade || 1,
            status: itemDto.status || StatusItemOrcamento.EM_ANALISE,
            ordem: itemDto.ordem !== undefined ? itemDto.ordem : index,
          });
          return item;
        });

        await this.itemOrcamentoRepository.save(itensCriados);
      }
    }

    // Recalcular valor total
    const itens = await this.itemOrcamentoRepository.find({
      where: { orcamentoId: id },
    });
    orcamento.valorTotal = this.calcularValorTotal(itens);
    await this.orcamentoRepository.save(orcamento);

    return this.findOne(id, userId, userTipo);
  }

  /**
   * Remove um orçamento
   */
  async remove(id: string, userId: string, userTipo: string): Promise<void> {
    const orcamento = await this.findOne(id, userId, userTipo);
    await this.orcamentoRepository.remove(orcamento);
  }

  /**
   * Retorna analytics/insights sobre orçamentos
   */
  async getAnalytics(
    clienteMasterId: string,
    userId: string,
    userTipo: string,
    dataInicio?: string,
    dataFim?: string,
  ) {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    const queryBuilder = this.orcamentoRepository.createQueryBuilder('orcamento');
    queryBuilder.where('orcamento.clienteMasterId = :clienteMasterId', { clienteMasterId });
    queryBuilder.leftJoinAndSelect('orcamento.itens', 'item');
    queryBuilder.leftJoinAndSelect('orcamento.paciente', 'paciente');

    if (dataInicio) {
      queryBuilder.andWhere('orcamento.createdAt >= :dataInicio', { dataInicio: new Date(dataInicio) });
    }
    if (dataFim) {
      queryBuilder.andWhere('orcamento.createdAt <= :dataFim', { dataFim: new Date(dataFim) });
    }

    const orcamentos = await queryBuilder.getMany();

    // Estatísticas gerais
    const totalOrcamentos = orcamentos.length;
    const orcamentosPorStatus = {
      RASCUNHO: orcamentos.filter((o) => o.status === StatusOrcamento.RASCUNHO).length,
      ENVIADO: orcamentos.filter((o) => o.status === StatusOrcamento.ENVIADO).length,
      ACEITO: orcamentos.filter((o) => o.status === StatusOrcamento.ACEITO).length,
      RECUSADO: orcamentos.filter((o) => o.status === StatusOrcamento.RECUSADO).length,
      CANCELADO: orcamentos.filter((o) => o.status === StatusOrcamento.CANCELADO).length,
    };

    // Valores
    const valorTotal = orcamentos.reduce((sum, o) => sum + Number(o.valorTotal), 0);
    const valorMedio = totalOrcamentos > 0 ? valorTotal / totalOrcamentos : 0;
    const valorAceitos = orcamentos
      .filter((o) => o.status === StatusOrcamento.ACEITO)
      .reduce((sum, o) => sum + Number(o.valorTotal), 0);

    // Taxa de conversão
    const taxaConversao =
      orcamentos.filter((o) => o.status === StatusOrcamento.ENVIADO || o.status === StatusOrcamento.ACEITO).length > 0
        ? (orcamentosPorStatus.ACEITO /
            orcamentos.filter((o) => o.status === StatusOrcamento.ENVIADO || o.status === StatusOrcamento.ACEITO)
              .length) *
          100
        : 0;

    // Orçamentos por paciente
    const orcamentosPorPaciente: { [key: string]: { nome: string; quantidade: number; valorTotal: number } } = {};
    orcamentos.forEach((orcamento) => {
      const pacienteId = orcamento.pacienteId;
      if (!orcamentosPorPaciente[pacienteId]) {
        orcamentosPorPaciente[pacienteId] = {
          nome: orcamento.paciente?.nome || 'Paciente',
          quantidade: 0,
          valorTotal: 0,
        };
      }
      orcamentosPorPaciente[pacienteId].quantidade += 1;
      orcamentosPorPaciente[pacienteId].valorTotal += Number(orcamento.valorTotal);
    });

    return {
      resumo: {
        totalOrcamentos,
        orcamentosPorStatus,
        valorTotal: Number(valorTotal.toFixed(2)),
        valorMedio: Number(valorMedio.toFixed(2)),
        valorAceitos: Number(valorAceitos.toFixed(2)),
        taxaConversao: Number(taxaConversao.toFixed(2)),
      },
      orcamentosPorPaciente: Object.values(orcamentosPorPaciente),
    };
  }
}

