import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Treatment } from '../entities/treatment.entity';
import { CostCategory, CostCategoryType } from '../entities/cost-category.entity';
import { Product } from '../entities/product.entity';
import { ClientesMasterService } from '../../users/clientes-master.service';
import { UserComumService } from '../../users/services/user-comum.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Treatment)
    private treatmentRepository: Repository<Treatment>,
    @InjectRepository(CostCategory)
    private costCategoryRepository: Repository<CostCategory>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @Inject(forwardRef(() => ClientesMasterService))
    private clientesMasterService: ClientesMasterService,
    private userComumService: UserComumService,
  ) {}

  /**
   * Verifica se o usuário tem permissão para acessar o cliente master
   */
  private async verificarPermissao(userId: string, userTipo: string, clienteMasterId: string): Promise<void> {
    if (userTipo === 'master') {
      const clientesMaster = await this.clientesMasterService.findByUserId(userId);
      const temAcesso = clientesMaster.some((cm) => cm.id === clienteMasterId);
      if (!temAcesso) {
        throw new BadRequestException('Você não tem permissão para acessar este recurso');
      }
    } else {
      const usuariosComuns = await this.userComumService.findByUserId(userId);
      const temAcesso = usuariosComuns.some((uc) => uc.clienteMasterId === clienteMasterId);
      if (!temAcesso) {
        throw new BadRequestException('Você não tem permissão para acessar este recurso');
      }
    }
  }

  /**
   * Retorna dados agregados de tratamentos para gráficos
   */
  async getTratamentosAnalytics(
    clienteMasterId: string,
    userId: string,
    userTipo: string,
    query: AnalyticsQueryDto,
  ) {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    const whereCondition: any = { clienteMasterId };

    // Filtrar por período se fornecido
    if (query.dataInicio && query.dataFim) {
      whereCondition.createdAt = Between(
        new Date(query.dataInicio),
        new Date(query.dataFim),
      );
    }

    const tratamentos = await this.treatmentRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });

    // Dados agregados
    const totalTratamentos = tratamentos.length;
    const totalReceita = tratamentos.reduce((sum, t) => sum + Number(t.price), 0);
    const totalCusto = tratamentos.reduce((sum, t) => sum + Number(t.custo), 0);
    const totalLucro = tratamentos.reduce((sum, t) => sum + Number(t.lucro), 0);
    const lucroMedio = totalTratamentos > 0 ? totalLucro / totalTratamentos : 0;
    const margemMedia = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0;

    // Top 10 tratamentos por lucro
    const topTratamentosPorLucro = tratamentos
      .sort((a, b) => Number(b.lucro) - Number(a.lucro))
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        name: t.name,
        price: Number(t.price),
        custo: Number(t.custo),
        lucro: Number(t.lucro),
        margem: Number(t.price) > 0 ? (Number(t.lucro) / Number(t.price)) * 100 : 0,
      }));

    // Distribuição de custos vs lucros
    const distribuicaoCustosLucros = {
      labels: ['Custos Totais', 'Lucro Total'],
      datasets: [
        {
          label: 'Valor (R$)',
          data: [totalCusto, totalLucro],
          backgroundColor: ['#ff6384', '#36a2eb'],
        },
      ],
    };

    // Evolução ao longo do tempo (se groupBy for fornecido)
    let evolucaoTemporal: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor: string;
      }>;
    } | null = null;
    if (query.groupBy) {
      evolucaoTemporal = this.agruparPorPeriodo(tratamentos, query.groupBy);
    }

    return {
      resumo: {
        totalTratamentos,
        totalReceita: Number(totalReceita.toFixed(2)),
        totalCusto: Number(totalCusto.toFixed(2)),
        totalLucro: Number(totalLucro.toFixed(2)),
        lucroMedio: Number(lucroMedio.toFixed(2)),
        margemMedia: Number(margemMedia.toFixed(2)),
      },
      topTratamentosPorLucro,
      distribuicaoCustosLucros,
      evolucaoTemporal,
    };
  }

  /**
   * Retorna dados agregados de custos indiretos para gráficos
   */
  async getCustosIndiretosAnalytics(
    clienteMasterId: string,
    userId: string,
    userTipo: string,
    query: AnalyticsQueryDto,
  ) {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    // Buscar categorias de custo indiretas
    const categoriasIndiretas = await this.costCategoryRepository.find({
      where: {
        clienteMasterId,
        type: CostCategoryType.INDIRECT,
      },
      relations: ['products'],
    });

    // Buscar produtos de custos indiretos
    const produtosIndiretos = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.cliente_master_id = :clienteMasterId', { clienteMasterId })
      .andWhere('category.type = :type', { type: CostCategoryType.INDIRECT })
      .getMany();

    // Calcular custos por categoria
    const custosPorCategoria = categoriasIndiretas.map((categoria) => {
      const produtosCategoria = produtosIndiretos.filter((p) => p.categoryId === categoria.id);
      const custoTotal = produtosCategoria.reduce((sum, p) => sum + Number(p.unitCost), 0);

      return {
        categoriaId: categoria.id,
        categoriaNome: categoria.name,
        quantidadeProdutos: produtosCategoria.length,
        custoTotal: Number(custoTotal.toFixed(2)),
      };
    });

    // Ordenar por custo total (maior para menor)
    custosPorCategoria.sort((a, b) => b.custoTotal - a.custoTotal);

    // Total de custos indiretos
    const totalCustosIndiretos = custosPorCategoria.reduce((sum, c) => sum + c.custoTotal, 0);

    // Gráfico de pizza: Distribuição de custos por categoria
    const distribuicaoCustosPorCategoria = {
      labels: custosPorCategoria.map((c) => c.categoriaNome),
      datasets: [
        {
          label: 'Custo (R$)',
          data: custosPorCategoria.map((c) => c.custoTotal),
          backgroundColor: this.gerarCores(custosPorCategoria.length),
        },
      ],
    };

    // Gráfico de barras: Custos por categoria
    const custosPorCategoriaBarras = {
      labels: custosPorCategoria.map((c) => c.categoriaNome),
      datasets: [
        {
          label: 'Custo Total (R$)',
          data: custosPorCategoria.map((c) => c.custoTotal),
          backgroundColor: '#ff6384',
        },
      ],
    };

    return {
      resumo: {
        totalCategorias: categoriasIndiretas.length,
        totalProdutos: produtosIndiretos.length,
        totalCustosIndiretos: Number(totalCustosIndiretos.toFixed(2)),
      },
      custosPorCategoria,
      distribuicaoCustosPorCategoria,
      custosPorCategoriaBarras,
    };
  }

  /**
   * Retorna dados comparativos entre tratamentos e custos indiretos
   */
  async getComparativoAnalytics(
    clienteMasterId: string,
    userId: string,
    userTipo: string,
    query: AnalyticsQueryDto,
  ) {
    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    // Buscar dados de tratamentos
    const tratamentosData = await this.getTratamentosAnalytics(clienteMasterId, userId, userTipo, query);

    // Buscar dados de custos indiretos
    const custosIndiretosData = await this.getCustosIndiretosAnalytics(clienteMasterId, userId, userTipo, query);

    // Comparativo: Receita vs Custos Diretos vs Custos Indiretos
    const comparativoReceitaCustos = {
      labels: ['Receita Total', 'Custos Diretos', 'Custos Indiretos'],
      datasets: [
        {
          label: 'Valor (R$)',
          data: [
            tratamentosData.resumo.totalReceita,
            tratamentosData.resumo.totalCusto,
            custosIndiretosData.resumo.totalCustosIndiretos,
          ],
          backgroundColor: ['#36a2eb', '#ff6384', '#ffce56'],
        },
      ],
    };

    // Lucro líquido (receita - custos diretos - custos indiretos)
    const lucroLiquido = tratamentosData.resumo.totalReceita - tratamentosData.resumo.totalCusto - custosIndiretosData.resumo.totalCustosIndiretos;

    return {
      comparativoReceitaCustos,
      lucroLiquido: Number(lucroLiquido.toFixed(2)),
      resumo: {
        receitaTotal: tratamentosData.resumo.totalReceita,
        custosDiretos: tratamentosData.resumo.totalCusto,
        custosIndiretos: custosIndiretosData.resumo.totalCustosIndiretos,
        lucroBruto: tratamentosData.resumo.totalLucro,
        lucroLiquido: Number(lucroLiquido.toFixed(2)),
      },
    };
  }

  /**
   * Agrupa tratamentos por período
   */
  private agruparPorPeriodo(tratamentos: Treatment[], groupBy: 'day' | 'week' | 'month' | 'year') {
    const grupos: { [key: string]: { receita: number; custo: number; lucro: number; quantidade: number } } = {};

    tratamentos.forEach((tratamento) => {
      const data = new Date(tratamento.createdAt);
      let chave: string;

      switch (groupBy) {
        case 'day':
          chave = data.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          const semana = this.getSemanaAno(data);
          chave = `${data.getFullYear()}-W${semana}`;
          break;
        case 'month':
          chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          chave = String(data.getFullYear());
          break;
        default:
          chave = data.toISOString().split('T')[0];
      }

      if (!grupos[chave]) {
        grupos[chave] = { receita: 0, custo: 0, lucro: 0, quantidade: 0 };
      }

      grupos[chave].receita += Number(tratamento.price);
      grupos[chave].custo += Number(tratamento.custo);
      grupos[chave].lucro += Number(tratamento.lucro);
      grupos[chave].quantidade += 1;
    });

    const labels = Object.keys(grupos).sort();
    return {
      labels,
      datasets: [
        {
          label: 'Receita (R$)',
          data: labels.map((l) => Number(grupos[l].receita.toFixed(2))),
          backgroundColor: '#36a2eb',
        },
        {
          label: 'Custo (R$)',
          data: labels.map((l) => Number(grupos[l].custo.toFixed(2))),
          backgroundColor: '#ff6384',
        },
        {
          label: 'Lucro (R$)',
          data: labels.map((l) => Number(grupos[l].lucro.toFixed(2))),
          backgroundColor: '#4bc0c0',
        },
      ],
    };
  }

  /**
   * Calcula o número da semana do ano
   */
  private getSemanaAno(data: Date): number {
    const inicioAno = new Date(data.getFullYear(), 0, 1);
    const dias = Math.floor((data.getTime() - inicioAno.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((dias + inicioAno.getDay() + 1) / 7);
  }

  /**
   * Gera cores para gráficos
   */
  private gerarCores(quantidade: number): string[] {
    const cores = [
      '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff',
      '#ff9f40', '#ff6384', '#c9cbcf', '#4bc0c0', '#ff6384',
    ];
    return cores.slice(0, quantidade);
  }
}

