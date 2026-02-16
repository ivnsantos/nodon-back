import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Orcamento, StatusOrcamento } from './entities/orcamento.entity';
import { ItemOrcamento, StatusItemOrcamento } from './entities/item-orcamento.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { Consulta } from '../calendario/entities/consulta.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';
import { ClientesMasterService } from '../users/clientes-master.service';
import { UserComumService } from '../users/services/user-comum.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { Console } from 'console';

@Injectable()
export class OrcamentosService {
  constructor(
    @InjectRepository(Orcamento)
    private orcamentoRepository: Repository<Orcamento>,
    @InjectRepository(ItemOrcamento)
    private itemOrcamentoRepository: Repository<ItemOrcamento>,
    @InjectRepository(Treatment)
    private treatmentRepository: Repository<Treatment>,
    @InjectRepository(Consulta)
    private consultaRepository: Repository<Consulta>,
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
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
   * Recalcula e atualiza o valor total do orçamento
   */
  private async recalcularValorTotalOrcamento(orcamentoId: string): Promise<void> {
    const todosItens = await this.itemOrcamentoRepository.find({
      where: { orcamentoId: orcamentoId },
    });

    const valorTotal = this.calcularValorTotal(todosItens);

    await this.orcamentoRepository.update(orcamentoId, { valorTotal });
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

      // Recalcular valor total após criar itens
      await this.recalcularValorTotalOrcamento(orcamentoSalvo.id);
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
      console.log('🔍 Atualizando itens do orçamento:', id);
      console.log('📦 Itens recebidos:', JSON.stringify(updateOrcamentoDto.itens, null, 2));
      
      const itensExistentes = await this.itemOrcamentoRepository.find({
        where: { orcamentoId: id },
      });

      console.log('📋 Itens existentes no banco:', itensExistentes.map(i => ({ id: i.id, status: i.status })));

      // Separar itens para atualizar e itens para criar
      const itensParaCriar: any[] = [];

      for (const itemDto of updateOrcamentoDto.itens) {
        if (itemDto.id) {
          // Item existente - atualizar usando update do TypeORM
          const itemExistente = itensExistentes.find((item) => item.id === itemDto.id);
          console.log(`🔎 Procurando item com ID: ${itemDto.id}`);
          console.log(`✅ Item encontrado:`, itemExistente ? 'SIM' : 'NÃO');
          
          if (itemExistente) {
            console.log(`📝 Status atual do item: ${itemExistente.status}`);
            console.log(`🔄 Novo status solicitado: ${itemDto.status}`);
            
            // Atualizar o objeto diretamente
            let temAlteracao = false;
            
            if (itemDto.tratamentoId !== undefined) {
              itemExistente.tratamentoId = itemDto.tratamentoId || null;
              temAlteracao = true;
            }
            if (itemDto.nome !== undefined) {
              itemExistente.nome = itemDto.nome;
              temAlteracao = true;
            }
            if (itemDto.descricao !== undefined) {
              itemExistente.descricao = itemDto.descricao || null;
              temAlteracao = true;
            }
            if (itemDto.preco !== undefined) {
              itemExistente.preco = itemDto.preco;
              temAlteracao = true;
            }
            if (itemDto.quantidade !== undefined) {
              itemExistente.quantidade = itemDto.quantidade;
              temAlteracao = true;
            }
            if (itemDto.status !== undefined) {
              itemExistente.status = itemDto.status as StatusItemOrcamento;
              temAlteracao = true;
              console.log(`✅ Status do objeto alterado para: ${itemExistente.status}`);
            }
            if (itemDto.ordem !== undefined) {
              itemExistente.ordem = itemDto.ordem;
              temAlteracao = true;
            }

            // Salvar usando save() que é mais confiável
            if (temAlteracao) {
              const itemSalvo = await this.itemOrcamentoRepository.save(itemExistente);
              console.log('✅ Item salvo com sucesso. Status:', itemSalvo.status);
            } else {
              console.log('⚠️ Nenhum dado para atualizar');
            }
          } else {
            console.log(`❌ Item com ID ${itemDto.id} não encontrado no orçamento ${id}`);
          }
        } else {
          // Novo item - criar
          itensParaCriar.push({
            orcamentoId: id,
            tratamentoId: itemDto.tratamentoId || null,
            nome: itemDto.nome || '',
            descricao: itemDto.descricao || null,
            preco: itemDto.preco || 0,
            quantidade: itemDto.quantidade || 1,
            status: itemDto.status || StatusItemOrcamento.EM_ANALISE,
            ordem: itemDto.ordem !== undefined ? itemDto.ordem : itensParaCriar.length,
          });
        }
      }

      // NOTA: Não removemos itens que não foram enviados na atualização
      // Isso permite atualizar apenas alguns itens sem afetar os outros
      // Se quiser remover itens, deve ser feito explicitamente via DELETE

      // Criar novos itens
      if (itensParaCriar.length > 0) {
        const novosItens = this.itemOrcamentoRepository.create(itensParaCriar);
        await this.itemOrcamentoRepository.save(novosItens);
      }

      // Recalcular valor total após atualizar/criar itens
      await this.recalcularValorTotalOrcamento(id);
    }

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
   * Atualiza apenas o status de um item de orçamento
   */
  async updateItemStatus(
    orcamentoId: string,
    itemId: string,
    status: string,
    userId: string,
    userTipo: string,
  ): Promise<ItemOrcamento> {
    // Verificar se o orçamento existe e tem permissão
    const orcamento = await this.findOne(orcamentoId, userId, userTipo);

    // Buscar o item
    const item = await this.itemOrcamentoRepository.findOne({
      where: { id: itemId, orcamentoId: orcamentoId },
    });

    console.log('🔍 Item encontrado:', item);
    if (!item) {
      throw new NotFoundException('Item não encontrado neste orçamento');
    }

    // Validar status
    if (!Object.values(StatusItemOrcamento).includes(status as StatusItemOrcamento)) {
      throw new BadRequestException(`Status inválido. Valores permitidos: ${Object.values(StatusItemOrcamento).join(', ')}`);
    }

    // Atualizar status - forma mais simples e direta
    item.status = status as StatusItemOrcamento;
    const itemSalvo = await this.itemOrcamentoRepository.save(item);

    // Recalcular valor total do orçamento após atualizar status do item
    await this.recalcularValorTotalOrcamento(orcamentoId);

    // Retornar apenas os campos necessários
    return {
      id: itemSalvo.id,
      orcamentoId: itemSalvo.orcamentoId,
      tratamentoId: itemSalvo.tratamentoId,
      nome: itemSalvo.nome,
      descricao: itemSalvo.descricao,
      preco: itemSalvo.preco,
      quantidade: itemSalvo.quantidade,
      status: itemSalvo.status,
      ordem: itemSalvo.ordem,
      createdAt: itemSalvo.createdAt,
      updatedAt: itemSalvo.updatedAt,
    } as ItemOrcamento;
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

  /**
   * Retorna dados para gráficos mensais de orçamentos
   * Recebe o mês no formato YYYY-MM (ex: "2026-02")
   */
  async getGraficosMensais(
    clienteMasterId: string,
    userId: string,
    userTipo: string,
    mes: string, // formato YYYY-MM
  ) {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    // Validar formato do mês
    const mesRegex = /^\d{4}-\d{2}$/;
    if (!mesRegex.test(mes)) {
      throw new BadRequestException('Formato de mês inválido. Use YYYY-MM (ex: 2026-02)');
    }

    const [ano, mesNum] = mes.split('-').map(Number);
    const dataInicio = new Date(ano, mesNum - 1, 1, 0, 0, 0, 0);
    const dataFim = new Date(ano, mesNum, 0, 23, 59, 59, 999);

    // Usar query builder para filtrar por data corretamente
    const orcamentosQuery = await this.orcamentoRepository
      .createQueryBuilder('orcamento')
      .leftJoinAndSelect('orcamento.itens', 'item')
      .leftJoinAndSelect('item.tratamento', 'tratamento')
      .where('orcamento.clienteMasterId = :clienteMasterId', { clienteMasterId })
      .andWhere('orcamento.createdAt >= :dataInicio', { dataInicio })
      .andWhere('orcamento.createdAt <= :dataFim', { dataFim })
      .getMany();

    // Quantidade de orçamentos que entraram no mês
    const qtdOrcamentosEntraram = orcamentosQuery.length;

    // Buscar todos os itens dos orçamentos do mês
    const todosItens = orcamentosQuery.flatMap((o) => o.itens || []);

    // Quantidade de itens pagos
    const qtdItensPagos = todosItens.filter((item) => item.status === StatusItemOrcamento.PAGO).length;

    // Valor total dos orçamentos que entraram
    const valorTotalOrcamentos = orcamentosQuery.reduce((sum, o) => sum + Number(o.valorTotal || 0), 0);

    // Valor total dos itens que entraram (todos os itens dos orçamentos do mês)
    const valorTotalItens = todosItens.reduce((sum, item) => sum + Number(item.preco || 0) * (item.quantidade || 1), 0);

    // Valor total dos itens pagos
    const valorTotalItensPagos = todosItens
      .filter((item) => item.status === StatusItemOrcamento.PAGO)
      .reduce((sum, item) => sum + Number(item.preco || 0) * (item.quantidade || 1), 0);

    // Dados por status de orçamento (para gráfico)
    const orcamentosPorStatus = {
      RASCUNHO: orcamentosQuery.filter((o) => o.status === StatusOrcamento.RASCUNHO).length,
      ENVIADO: orcamentosQuery.filter((o) => o.status === StatusOrcamento.ENVIADO).length,
      EM_ANDAMENTO: orcamentosQuery.filter((o) => o.status === StatusOrcamento.EM_ANDAMENTO).length,
      ACEITO: orcamentosQuery.filter((o) => o.status === StatusOrcamento.ACEITO).length,
      RECUSADO: orcamentosQuery.filter((o) => o.status === StatusOrcamento.RECUSADO).length,
      CANCELADO: orcamentosQuery.filter((o) => o.status === StatusOrcamento.CANCELADO).length,
      FINALIZADO: orcamentosQuery.filter((o) => o.status === StatusOrcamento.FINALIZADO).length,
    };

    // Dados por status de itens (para gráfico)
    const itensPorStatus = {
      EM_ANALISE: todosItens.filter((item) => item.status === StatusItemOrcamento.EM_ANALISE).length,
      PAGO: todosItens.filter((item) => item.status === StatusItemOrcamento.PAGO).length,
      RECUSADO: todosItens.filter((item) => item.status === StatusItemOrcamento.RECUSADO).length,
      PERDIDO: todosItens.filter((item) => item.status === StatusItemOrcamento.PERDIDO).length,
    };

    // Valor por status de orçamento
    const valorPorStatusOrcamento = {
      RASCUNHO: orcamentosQuery
        .filter((o) => o.status === StatusOrcamento.RASCUNHO)
        .reduce((sum, o) => sum + Number(o.valorTotal || 0), 0),
      ENVIADO: orcamentosQuery
        .filter((o) => o.status === StatusOrcamento.ENVIADO)
        .reduce((sum, o) => sum + Number(o.valorTotal || 0), 0),
      EM_ANDAMENTO: orcamentosQuery
        .filter((o) => o.status === StatusOrcamento.EM_ANDAMENTO)
        .reduce((sum, o) => sum + Number(o.valorTotal || 0), 0),
      ACEITO: orcamentosQuery
        .filter((o) => o.status === StatusOrcamento.ACEITO)
        .reduce((sum, o) => sum + Number(o.valorTotal || 0), 0),
      RECUSADO: orcamentosQuery
        .filter((o) => o.status === StatusOrcamento.RECUSADO)
        .reduce((sum, o) => sum + Number(o.valorTotal || 0), 0),
      CANCELADO: orcamentosQuery
        .filter((o) => o.status === StatusOrcamento.CANCELADO)
        .reduce((sum, o) => sum + Number(o.valorTotal || 0), 0),
      FINALIZADO: orcamentosQuery
        .filter((o) => o.status === StatusOrcamento.FINALIZADO)
        .reduce((sum, o) => sum + Number(o.valorTotal || 0), 0),
    };

    // Valor por status de itens
    const valorPorStatusItens = {
      EM_ANALISE: todosItens
        .filter((item) => item.status === StatusItemOrcamento.EM_ANALISE)
        .reduce((sum, item) => sum + Number(item.preco || 0) * (item.quantidade || 1), 0),
      PAGO: todosItens
        .filter((item) => item.status === StatusItemOrcamento.PAGO)
        .reduce((sum, item) => sum + Number(item.preco || 0) * (item.quantidade || 1), 0),
      RECUSADO: todosItens
        .filter((item) => item.status === StatusItemOrcamento.RECUSADO)
        .reduce((sum, item) => sum + Number(item.preco || 0) * (item.quantidade || 1), 0),
      PERDIDO: todosItens
        .filter((item) => item.status === StatusItemOrcamento.PERDIDO)
        .reduce((sum, item) => sum + Number(item.preco || 0) * (item.quantidade || 1), 0),
    };

    // Analisar top 5 tratamentos mais vendidos do mês
    const tratamentosMap = new Map<string, { tratamento: Treatment; quantidade: number; valorTotal: number }>();

    todosItens.forEach((item) => {
      if (item.tratamentoId && item.tratamento) {
        const tratamentoId = item.tratamentoId;
        const quantidadeItem = item.quantidade || 1;
        const valorItem = Number(item.preco || 0) * quantidadeItem;

        if (tratamentosMap.has(tratamentoId)) {
          const existente = tratamentosMap.get(tratamentoId)!;
          existente.quantidade += quantidadeItem;
          existente.valorTotal += valorItem;
        } else {
          tratamentosMap.set(tratamentoId, {
            tratamento: item.tratamento,
            quantidade: quantidadeItem,
            valorTotal: valorItem,
          });
        }
      }
    });

    // Converter para array, ordenar por quantidade e pegar top 5
    const topTratamentos = Array.from(tratamentosMap.values())
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5)
      .map((t) => ({
        id: t.tratamento.id,
        name: t.tratamento.name,
        quantidade: t.quantidade,
        valorTotal: Number(t.valorTotal.toFixed(2)),
      }));

    return {
      mes,
      resumo: {
        qtdOrcamentosEntraram,
        qtdItensPagos,
        qtdItensTotal: todosItens.length,
        valorTotalOrcamentos: Number(valorTotalOrcamentos.toFixed(2)),
        valorTotalItens: Number(valorTotalItens.toFixed(2)),
        valorTotalItensPagos: Number(valorTotalItensPagos.toFixed(2)),
      },
      graficos: {
        orcamentosPorStatus,
        itensPorStatus,
        valorPorStatusOrcamento: {
          RASCUNHO: Number(valorPorStatusOrcamento.RASCUNHO.toFixed(2)),
          ENVIADO: Number(valorPorStatusOrcamento.ENVIADO.toFixed(2)),
          EM_ANDAMENTO: Number(valorPorStatusOrcamento.EM_ANDAMENTO.toFixed(2)),
          ACEITO: Number(valorPorStatusOrcamento.ACEITO.toFixed(2)),
          RECUSADO: Number(valorPorStatusOrcamento.RECUSADO.toFixed(2)),
          CANCELADO: Number(valorPorStatusOrcamento.CANCELADO.toFixed(2)),
          FINALIZADO: Number(valorPorStatusOrcamento.FINALIZADO.toFixed(2)),
        },
        valorPorStatusItens: {
          EM_ANALISE: Number(valorPorStatusItens.EM_ANALISE.toFixed(2)),
          PAGO: Number(valorPorStatusItens.PAGO.toFixed(2)),
          RECUSADO: Number(valorPorStatusItens.RECUSADO.toFixed(2)),
          PERDIDO: Number(valorPorStatusItens.PERDIDO.toFixed(2)),
        },
      },
      topTratamentos,
    };
  }

  /**
   * Retorna dados gerais de orçamentos e itens do mês atual
   */
  async getDadosGerais(clienteMasterId: string, userId: string, userTipo: string) {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    // Calcular início e fim do mês atual
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = agora.getMonth() + 1; // getMonth() retorna 0-11
    const dataInicio = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
    const dataFim = new Date(ano, mes, 0, 23, 59, 59, 999);

    // Buscar orçamentos do mês atual usando query builder
    const orcamentos = await this.orcamentoRepository
      .createQueryBuilder('orcamento')
      .leftJoinAndSelect('orcamento.itens', 'item')
      .leftJoinAndSelect('item.tratamento', 'tratamento')
      .leftJoinAndSelect('orcamento.paciente', 'paciente')
      .where('orcamento.clienteMasterId = :clienteMasterId', { clienteMasterId })
      .andWhere('orcamento.createdAt >= :dataInicio', { dataInicio })
      .andWhere('orcamento.createdAt <= :dataFim', { dataFim })
      .getMany();

    // Buscar todos os itens dos orçamentos do mês atual
    const todosItens = orcamentos.flatMap((o) => o.itens || []);

    // Estatísticas gerais de orçamentos
    const totalOrcamentos = orcamentos.length;
    const orcamentosPorStatus = {
      RASCUNHO: orcamentos.filter((o) => o.status === StatusOrcamento.RASCUNHO).length,
      ENVIADO: orcamentos.filter((o) => o.status === StatusOrcamento.ENVIADO).length,
      EM_ANDAMENTO: orcamentos.filter((o) => o.status === StatusOrcamento.EM_ANDAMENTO).length,
      ACEITO: orcamentos.filter((o) => o.status === StatusOrcamento.ACEITO).length,
      RECUSADO: orcamentos.filter((o) => o.status === StatusOrcamento.RECUSADO).length,
      CANCELADO: orcamentos.filter((o) => o.status === StatusOrcamento.CANCELADO).length,
      FINALIZADO: orcamentos.filter((o) => o.status === StatusOrcamento.FINALIZADO).length,
    };

    // Valores totais por status de orçamento
    const valorTotalPorStatus = {
      RASCUNHO: orcamentos
        .filter((o) => o.status === StatusOrcamento.RASCUNHO)
        .reduce((sum, o) => sum + Number(o.valorTotal || 0), 0),
      ENVIADO: orcamentos
        .filter((o) => o.status === StatusOrcamento.ENVIADO)
        .reduce((sum, o) => sum + Number(o.valorTotal || 0), 0),
      EM_ANDAMENTO: orcamentos
        .filter((o) => o.status === StatusOrcamento.EM_ANDAMENTO)
        .reduce((sum, o) => sum + Number(o.valorTotal || 0), 0),
      ACEITO: orcamentos
        .filter((o) => o.status === StatusOrcamento.ACEITO)
        .reduce((sum, o) => sum + Number(o.valorTotal || 0), 0),
      RECUSADO: orcamentos
        .filter((o) => o.status === StatusOrcamento.RECUSADO)
        .reduce((sum, o) => sum + Number(o.valorTotal || 0), 0),
      CANCELADO: orcamentos
        .filter((o) => o.status === StatusOrcamento.CANCELADO)
        .reduce((sum, o) => sum + Number(o.valorTotal || 0), 0),
      FINALIZADO: orcamentos
        .filter((o) => o.status === StatusOrcamento.FINALIZADO)
        .reduce((sum, o) => sum + Number(o.valorTotal || 0), 0),
    };

    // Estatísticas gerais de itens
    const totalItens = todosItens.length;
    const itensPorStatus = {
      EM_ANALISE: todosItens.filter((item) => item.status === StatusItemOrcamento.EM_ANALISE).length,
      PAGO: todosItens.filter((item) => item.status === StatusItemOrcamento.PAGO).length,
      RECUSADO: todosItens.filter((item) => item.status === StatusItemOrcamento.RECUSADO).length,
      PERDIDO: todosItens.filter((item) => item.status === StatusItemOrcamento.PERDIDO).length,
    };

    // Valores totais por status de itens
    const valorTotalPorStatusItens = {
      EM_ANALISE: todosItens
        .filter((item) => item.status === StatusItemOrcamento.EM_ANALISE)
        .reduce((sum, item) => sum + Number(item.preco || 0) * (item.quantidade || 1), 0),
      PAGO: todosItens
        .filter((item) => item.status === StatusItemOrcamento.PAGO)
        .reduce((sum, item) => sum + Number(item.preco || 0) * (item.quantidade || 1), 0),
      RECUSADO: todosItens
        .filter((item) => item.status === StatusItemOrcamento.RECUSADO)
        .reduce((sum, item) => sum + Number(item.preco || 0) * (item.quantidade || 1), 0),
      PERDIDO: todosItens
        .filter((item) => item.status === StatusItemOrcamento.PERDIDO)
        .reduce((sum, item) => sum + Number(item.preco || 0) * (item.quantidade || 1), 0),
    };

    // Valores gerais
    const valorTotalGeral = orcamentos.reduce((sum, o) => sum + Number(o.valorTotal || 0), 0);
    const valorTotalItensGeral = todosItens.reduce(
      (sum, item) => sum + Number(item.preco || 0) * (item.quantidade || 1),
      0,
    );
    const valorMedioOrcamento = totalOrcamentos > 0 ? valorTotalGeral / totalOrcamentos : 0;
    const valorMedioItem = totalItens > 0 ? valorTotalItensGeral / totalItens : 0;

    // Taxa de conversão (aceitos / enviados + aceitos)
    const orcamentosEnviadosOuAceitos = orcamentos.filter(
      (o) => o.status === StatusOrcamento.ENVIADO || o.status === StatusOrcamento.ACEITO,
    ).length;
    const taxaConversao =
      orcamentosEnviadosOuAceitos > 0
        ? (orcamentosPorStatus.ACEITO / orcamentosEnviadosOuAceitos) * 100
        : 0;

    // Taxa de pagamento de itens
    const taxaPagamentoItens = totalItens > 0 ? (itensPorStatus.PAGO / totalItens) * 100 : 0;

    // Analisar tratamentos mais vendidos
    const tratamentosMap = new Map<string, { tratamento: Treatment; quantidade: number; valorTotal: number }>();

    todosItens.forEach((item) => {
      if (item.tratamentoId && item.tratamento) {
        const tratamentoId = item.tratamentoId;
        const quantidadeItem = item.quantidade || 1;
        const valorItem = Number(item.preco || 0) * quantidadeItem;

        if (tratamentosMap.has(tratamentoId)) {
          const existente = tratamentosMap.get(tratamentoId)!;
          existente.quantidade += quantidadeItem;
          existente.valorTotal += valorItem;
        } else {
          tratamentosMap.set(tratamentoId, {
            tratamento: item.tratamento,
            quantidade: quantidadeItem,
            valorTotal: valorItem,
          });
        }
      }
    });

    // Converter para array e ordenar por quantidade (mais vendido primeiro)
    const tratamentosArray = Array.from(tratamentosMap.values()).sort((a, b) => b.quantidade - a.quantidade);

    // Tratamento mais vendido
    const tratamentoMaisVendido = tratamentosArray.length > 0
      ? {
          id: tratamentosArray[0].tratamento.id,
          name: tratamentosArray[0].tratamento.name,
          quantidade: tratamentosArray[0].quantidade,
          valorTotal: Number(tratamentosArray[0].valorTotal.toFixed(2)),
        }
      : null;

    // Top 10 tratamentos para gráficos
    const topTratamentos = tratamentosArray.slice(0, 10).map((t) => ({
      id: t.tratamento.id,
      name: t.tratamento.name,
      quantidade: t.quantidade,
      valorTotal: Number(t.valorTotal.toFixed(2)),
    }));

    // Formatar mês atual no formato YYYY-MM
    const mesAtual = `${ano}-${String(mes).padStart(2, '0')}`;

    return {
      mes: mesAtual,
      orcamentos: {
        total: totalOrcamentos,
        porStatus: orcamentosPorStatus,
        valorTotal: Number(valorTotalGeral.toFixed(2)),
        valorMedio: Number(valorMedioOrcamento.toFixed(2)),
        valorPorStatus: {
          RASCUNHO: Number(valorTotalPorStatus.RASCUNHO.toFixed(2)),
          ENVIADO: Number(valorTotalPorStatus.ENVIADO.toFixed(2)),
          EM_ANDAMENTO: Number(valorTotalPorStatus.EM_ANDAMENTO.toFixed(2)),
          ACEITO: Number(valorTotalPorStatus.ACEITO.toFixed(2)),
          RECUSADO: Number(valorTotalPorStatus.RECUSADO.toFixed(2)),
          CANCELADO: Number(valorTotalPorStatus.CANCELADO.toFixed(2)),
          FINALIZADO: Number(valorTotalPorStatus.FINALIZADO.toFixed(2)),
        },
        taxaConversao: Number(taxaConversao.toFixed(2)),
      },
      itens: {
        total: totalItens,
        porStatus: itensPorStatus,
        valorTotal: Number(valorTotalItensGeral.toFixed(2)),
        valorMedio: Number(valorMedioItem.toFixed(2)),
        valorPorStatus: {
          EM_ANALISE: Number(valorTotalPorStatusItens.EM_ANALISE.toFixed(2)),
          PAGO: Number(valorTotalPorStatusItens.PAGO.toFixed(2)),
          RECUSADO: Number(valorTotalPorStatusItens.RECUSADO.toFixed(2)),
          PERDIDO: Number(valorTotalPorStatusItens.PERDIDO.toFixed(2)),
        },
        taxaPagamento: Number(taxaPagamentoItens.toFixed(2)),
      },
      tratamentos: {
        maisVendido: tratamentoMaisVendido,
        topTratamentos,
      },
    };
  }

  /**
   * Retorna todos os orçamentos que possuem itens pagos, filtrados por mês e ano
   */
  async buscarOrcamentosComItensPagos(
    mes: number,
    ano: number,
    clienteMasterId: string,
    userId: string,
    userTipo: string,
  ): Promise<{
    orcamentos: Array<{
      id: string;
      pacienteId: string;
      paciente: {
        id: string;
        nome: string;
        cpf: string;
      };
      status: StatusOrcamento;
      valorTotal: number;
      itensPagos: Array<{
        id: string;
        nome: string;
        preco: number;
        quantidade: number;
        tratamentoId: string | null;
        tratamento: {
          id: string;
          name: string;
          custo: number;
          lucro: number;
        } | null;
        lucroItem: number;
        valorBrutoItem: number;
      }>;
      lucroTotal: number;
      valorBrutoTotal: number;
      createdAt: Date;
    }>;
    resumo: {
      valorBrutoTotalGeral: number;
      lucroTotalGeral: number;
      quantidadeOrcamentos: number;
      quantidadeItensPagos: number;
    };
  }> {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    // Calcular início e fim do mês
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0, 23, 59, 59, 999);

    // Buscar orçamentos criados no mês/ano especificado
    const orcamentos = await this.orcamentoRepository.find({
      where: {
        clienteMasterId,
        createdAt: Between(dataInicio, dataFim),
      },
      relations: ['paciente', 'itens', 'itens.tratamento'],
      order: { createdAt: 'DESC' },
    });

    // Filtrar apenas orçamentos que têm pelo menos um item PAGO
    const orcamentosComItensPagos = orcamentos.filter((orcamento) =>
      orcamento.itens.some((item) => item.status === StatusItemOrcamento.PAGO),
    );

    // Processar cada orçamento
    const orcamentosProcessados = orcamentosComItensPagos.map((orcamento) => {
      // Filtrar apenas itens PAGOS
      const itensPagos = orcamento.itens.filter((item) => item.status === StatusItemOrcamento.PAGO);

      // Processar cada item pago
      const itensProcessados = itensPagos.map((item) => {
        const valorBrutoItem = Number(item.preco) * item.quantidade;
        let lucroItem = 0;

        // Se o item tem tratamentoId, calcular o lucro
        if (item.tratamentoId && item.tratamento) {
          const custoTratamento = Number(item.tratamento.custo) || 0;
          const custoTotalItem = custoTratamento * item.quantidade;
          lucroItem = valorBrutoItem - custoTotalItem;
        }

        return {
          id: item.id,
          nome: item.nome,
          preco: Number(item.preco),
          quantidade: item.quantidade,
          tratamentoId: item.tratamentoId,
          tratamento: item.tratamento
            ? {
                id: item.tratamento.id,
                name: item.tratamento.name,
                custo: Number(item.tratamento.custo),
                lucro: Number(item.tratamento.lucro),
              }
            : null,
          lucroItem: Number(lucroItem.toFixed(2)),
          valorBrutoItem: Number(valorBrutoItem.toFixed(2)),
        };
      });

      // Calcular totais do orçamento
      const lucroTotal = itensProcessados.reduce((acc, item) => acc + item.lucroItem, 0);
      const valorBrutoTotal = itensProcessados.reduce((acc, item) => acc + item.valorBrutoItem, 0);

      return {
        id: orcamento.id,
        pacienteId: orcamento.pacienteId,
        paciente: {
          id: orcamento.paciente.id,
          nome: orcamento.paciente.nome || '',
          cpf: orcamento.paciente.cpf || '',
        },
        status: orcamento.status,
        valorTotal: Number(orcamento.valorTotal),
        itensPagos: itensProcessados,
        lucroTotal: Number(lucroTotal.toFixed(2)),
        valorBrutoTotal: Number(valorBrutoTotal.toFixed(2)),
        createdAt: orcamento.createdAt,
      };
    });

    // Calcular resumo geral
    const valorBrutoTotalGeral = orcamentosProcessados.reduce(
      (acc, orcamento) => acc + orcamento.valorBrutoTotal,
      0,
    );
    const lucroTotalGeral = orcamentosProcessados.reduce((acc, orcamento) => acc + orcamento.lucroTotal, 0);
    const quantidadeItensPagos = orcamentosProcessados.reduce(
      (acc, orcamento) => acc + orcamento.itensPagos.length,
      0,
    );

    return {
      orcamentos: orcamentosProcessados,
      resumo: {
        valorBrutoTotalGeral: Number(valorBrutoTotalGeral.toFixed(2)),
        lucroTotalGeral: Number(lucroTotalGeral.toFixed(2)),
        quantidadeOrcamentos: orcamentosProcessados.length,
        quantidadeItensPagos,
      },
    };
  }

  /**
   * Retorna analytics de clientes (pacientes)
   */
  async getAnalyticsClientes(
    clienteMasterId: string,
    userId: string,
    userTipo: string,
    mes?: number,
    ano?: number,
  ) {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    // Se mês e ano não forem fornecidos, usar o mês atual
    const agora = new Date();
    const mesAtual = mes || agora.getMonth() + 1;
    const anoAtual = ano || agora.getFullYear();

    // 1. Top 5 clientes que mais pagaram tratamentos em QUANTIDADE
    const itensPagos = await this.itemOrcamentoRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.orcamento', 'orcamento')
      .leftJoinAndSelect('orcamento.paciente', 'paciente')
      .where('item.status = :status', { status: StatusItemOrcamento.PAGO })
      .andWhere('orcamento.clienteMasterId = :clienteMasterId', { clienteMasterId })
      .getMany();

    const clientesPorQuantidade = new Map<
      string,
      { paciente: Paciente; quantidade: number; valorTotal: number }
    >();

    itensPagos.forEach((item) => {
      const pacienteId = item.orcamento.pacienteId;
      const quantidadeItem = item.quantidade || 1;
      const valorItem = Number(item.preco || 0) * quantidadeItem;

      if (clientesPorQuantidade.has(pacienteId)) {
        const existente = clientesPorQuantidade.get(pacienteId)!;
        existente.quantidade += quantidadeItem;
        existente.valorTotal += valorItem;
      } else {
        clientesPorQuantidade.set(pacienteId, {
          paciente: item.orcamento.paciente,
          quantidade: quantidadeItem,
          valorTotal: valorItem,
        });
      }
    });

    const top5Quantidade = Array.from(clientesPorQuantidade.values())
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5)
      .map((c) => ({
        id: c.paciente.id,
        nome: c.paciente.nome || '',
        cpf: c.paciente.cpf || '',
        quantidade: c.quantidade,
        valorTotal: Number(c.valorTotal.toFixed(2)),
      }));

    // 2. Top 5 clientes que mais pagaram tratamentos em VALOR (dinheiro)
    const top5Valor = Array.from(clientesPorQuantidade.values())
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 5)
      .map((c) => ({
        id: c.paciente.id,
        nome: c.paciente.nome || '',
        cpf: c.paciente.cpf || '',
        quantidade: c.quantidade,
        valorTotal: Number(c.valorTotal.toFixed(2)),
      }));

    // 3. Clientes com mais agendamentos feitos
    const consultas = await this.consultaRepository
      .createQueryBuilder('consulta')
      .leftJoinAndSelect('consulta.paciente', 'paciente')
      .where('consulta.clienteMasterId = :clienteMasterId', { clienteMasterId })
      .getMany();

    const clientesPorAgendamentos = new Map<string, { paciente: Paciente; quantidade: number }>();

    consultas.forEach((consulta) => {
      const pacienteId = consulta.pacienteId;
      if (clientesPorAgendamentos.has(pacienteId)) {
        const existente = clientesPorAgendamentos.get(pacienteId)!;
        existente.quantidade += 1;
      } else {
        clientesPorAgendamentos.set(pacienteId, {
          paciente: consulta.paciente,
          quantidade: 1,
        });
      }
    });

    const topAgendamentos = Array.from(clientesPorAgendamentos.values())
      .sort((a, b) => b.quantidade - a.quantidade)
      .map((c) => ({
        id: c.paciente.id,
        nome: c.paciente.nome || '',
        cpf: c.paciente.cpf || '',
        quantidadeAgendamentos: c.quantidade,
      }));

    // 4. Clientes que têm aniversário no mês
    const pacientesComAniversario = await this.pacienteRepository
      .createQueryBuilder('paciente')
      .where('paciente.clienteMasterId = :clienteMasterId', { clienteMasterId })
      .andWhere('paciente.dataNascimento IS NOT NULL')
      .getMany();

    const aniversariantes = pacientesComAniversario
      .filter((paciente) => {
        if (!paciente.dataNascimento) return false;
        const dataNasc = new Date(paciente.dataNascimento);
        const mesNasc = dataNasc.getMonth() + 1; // getMonth() retorna 0-11
        return mesNasc === mesAtual;
      })
      .map((paciente) => {
        const dataNasc = new Date(paciente.dataNascimento!);
        const diaAniversario = dataNasc.getDate();
        return {
          id: paciente.id,
          nome: paciente.nome || '',
          cpf: paciente.cpf || '',
          dataNascimento: paciente.dataNascimento,
          diaAniversario,
          telefone: paciente.telefone || '',
          email: paciente.email || '',
        };
      })
      .sort((a, b) => a.diaAniversario - b.diaAniversario); // Ordenar por dia do mês

    return {
      mes: `${anoAtual}-${String(mesAtual).padStart(2, '0')}`,
      top5ClientesQuantidade: top5Quantidade,
      top5ClientesValor: top5Valor,
      topAgendamentos,
      aniversariantes,
    };
  }

  /**
   * Retorna analytics gerais de clientes (todos os tempos)
   * - Cliente com mais orçamentos com itens PAGOS
   * - Cliente com maior quantidade de dinheiro pago
   */
  async getAnalyticsClientesGeral(clienteMasterId: string, userId: string, userTipo: string) {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    // Buscar todos os orçamentos com itens pagos
    const orcamentosComItensPagos = await this.orcamentoRepository
      .createQueryBuilder('orcamento')
      .leftJoinAndSelect('orcamento.itens', 'item')
      .leftJoinAndSelect('orcamento.paciente', 'paciente')
      .where('orcamento.clienteMasterId = :clienteMasterId', { clienteMasterId })
      .andWhere('item.status = :status', { status: StatusItemOrcamento.PAGO })
      .getMany();

    // Mapa para contar orçamentos e valores por cliente
    const clientesMap = new Map<
      string,
      {
        paciente: Paciente;
        quantidadeOrcamentos: number;
        quantidadeItensPagos: number;
        valorTotalPago: number;
      }
    >();

    orcamentosComItensPagos.forEach((orcamento) => {
      const pacienteId = orcamento.pacienteId;
      const itensPagos = orcamento.itens.filter((item) => item.status === StatusItemOrcamento.PAGO);
      const valorTotalItensPagos = itensPagos.reduce(
        (sum, item) => sum + Number(item.preco || 0) * (item.quantidade || 1),
        0,
      );

      if (clientesMap.has(pacienteId)) {
        const existente = clientesMap.get(pacienteId)!;
        existente.quantidadeOrcamentos += 1;
        existente.quantidadeItensPagos += itensPagos.length;
        existente.valorTotalPago += valorTotalItensPagos;
      } else {
        clientesMap.set(pacienteId, {
          paciente: orcamento.paciente,
          quantidadeOrcamentos: 1,
          quantidadeItensPagos: itensPagos.length,
          valorTotalPago: valorTotalItensPagos,
        });
      }
    });

    const clientesArray = Array.from(clientesMap.values());

    // Top 10 clientes com mais orçamentos com itens PAGOS
    const topClientesMaisOrcamentos = clientesArray
      .sort((a, b) => b.quantidadeOrcamentos - a.quantidadeOrcamentos)
      .slice(0, 10)
      .map((c) => ({
        id: c.paciente.id,
        nome: c.paciente.nome || '',
        cpf: c.paciente.cpf || '',
        quantidadeOrcamentos: c.quantidadeOrcamentos,
        quantidadeItensPagos: c.quantidadeItensPagos,
        valorTotalPago: Number(c.valorTotalPago.toFixed(2)),
      }));

    // Top 10 clientes com maior quantidade de dinheiro pago
    const topClientesMaiorValor = clientesArray
      .sort((a, b) => b.valorTotalPago - a.valorTotalPago)
      .slice(0, 10)
      .map((c) => ({
        id: c.paciente.id,
        nome: c.paciente.nome || '',
        cpf: c.paciente.cpf || '',
        quantidadeOrcamentos: c.quantidadeOrcamentos,
        quantidadeItensPagos: c.quantidadeItensPagos,
        valorTotalPago: Number(c.valorTotalPago.toFixed(2)),
      }));

    return {
      topClientesMaisOrcamentos,
      topClientesMaiorValor,
    };
  }

  /**
   * Retorna analytics de clientes por mês
   * - Cliente com mais orçamentos com itens PAGOS no mês
   * - Cliente com maior quantidade de dinheiro pago no mês
   */
  async getAnalyticsClientesPorMes(
    clienteMasterId: string,
    userId: string,
    userTipo: string,
    mes: number,
    ano: number,
  ) {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    // Calcular início e fim do mês
    const dataInicio = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
    const dataFim = new Date(ano, mes, 0, 23, 59, 59, 999);

    // Buscar orçamentos criados no mês com itens pagos
    const orcamentosComItensPagos = await this.orcamentoRepository
      .createQueryBuilder('orcamento')
      .leftJoinAndSelect('orcamento.itens', 'item')
      .leftJoinAndSelect('orcamento.paciente', 'paciente')
      .where('orcamento.clienteMasterId = :clienteMasterId', { clienteMasterId })
      .andWhere('orcamento.createdAt >= :dataInicio', { dataInicio })
      .andWhere('orcamento.createdAt <= :dataFim', { dataFim })
      .andWhere('item.status = :status', { status: StatusItemOrcamento.PAGO })
      .getMany();

    // Mapa para contar orçamentos e valores por cliente
    const clientesMap = new Map<
      string,
      {
        paciente: Paciente;
        quantidadeOrcamentos: number;
        quantidadeItensPagos: number;
        valorTotalPago: number;
      }
    >();

    orcamentosComItensPagos.forEach((orcamento) => {
      const pacienteId = orcamento.pacienteId;
      const itensPagos = orcamento.itens.filter((item) => item.status === StatusItemOrcamento.PAGO);
      const valorTotalItensPagos = itensPagos.reduce(
        (sum, item) => sum + Number(item.preco || 0) * (item.quantidade || 1),
        0,
      );

      if (clientesMap.has(pacienteId)) {
        const existente = clientesMap.get(pacienteId)!;
        existente.quantidadeOrcamentos += 1;
        existente.quantidadeItensPagos += itensPagos.length;
        existente.valorTotalPago += valorTotalItensPagos;
      } else {
        clientesMap.set(pacienteId, {
          paciente: orcamento.paciente,
          quantidadeOrcamentos: 1,
          quantidadeItensPagos: itensPagos.length,
          valorTotalPago: valorTotalItensPagos,
        });
      }
    });

    const clientesArray = Array.from(clientesMap.values());

    // Top 10 clientes com mais orçamentos com itens PAGOS no mês
    const topClientesMaisOrcamentos = clientesArray
      .sort((a, b) => b.quantidadeOrcamentos - a.quantidadeOrcamentos)
      .slice(0, 10)
      .map((c) => ({
        id: c.paciente.id,
        nome: c.paciente.nome || '',
        cpf: c.paciente.cpf || '',
        quantidadeOrcamentos: c.quantidadeOrcamentos,
        quantidadeItensPagos: c.quantidadeItensPagos,
        valorTotalPago: Number(c.valorTotalPago.toFixed(2)),
      }));

    // Top 10 clientes com maior quantidade de dinheiro pago no mês
    const topClientesMaiorValor = clientesArray
      .sort((a, b) => b.valorTotalPago - a.valorTotalPago)
      .slice(0, 10)
      .map((c) => ({
        id: c.paciente.id,
        nome: c.paciente.nome || '',
        cpf: c.paciente.cpf || '',
        quantidadeOrcamentos: c.quantidadeOrcamentos,
        quantidadeItensPagos: c.quantidadeItensPagos,
        valorTotalPago: Number(c.valorTotalPago.toFixed(2)),
      }));

    return {
      mes: `${ano}-${String(mes).padStart(2, '0')}`,
      topClientesMaisOrcamentos,
      topClientesMaiorValor,
    };
  }
}

