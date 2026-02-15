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
import { Console } from 'console';

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
    };
  }
}

