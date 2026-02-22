import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Treatment } from '../entities/treatment.entity';
import { TreatmentProduct } from '../entities/treatment-product.entity';
import { Product } from '../entities/product.entity';
import { CreateTreatmentDto } from '../dto/create-treatment.dto';
import { UpdateTreatmentDto } from '../dto/update-treatment.dto';
import { ClientesMasterService } from '../../users/clientes-master.service';
import { UserComumService } from '../../users/services/user-comum.service';

@Injectable()
export class TreatmentsService {
  constructor(
    @InjectRepository(Treatment)
    private treatmentRepository: Repository<Treatment>,
    @InjectRepository(TreatmentProduct)
    private treatmentProductRepository: Repository<TreatmentProduct>,
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
   * Cria um novo tratamento
   */
  async create(createTreatmentDto: CreateTreatmentDto, userId: string, userTipo: string): Promise<Treatment> {
    const clienteMasterId = createTreatmentDto.clienteMasterId;

    if (!clienteMasterId) {
      throw new BadRequestException('Cliente Master ID é obrigatório');
    }

    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    const treatment = new Treatment();
    treatment.clienteMasterId = clienteMasterId;
    treatment.name = createTreatmentDto.name;
    treatment.description = createTreatmentDto.description || null;
    treatment.averageDurationMinutes = createTreatmentDto.averageDurationMinutes;
    treatment.price = createTreatmentDto.price;
    
    // Calcular custo automaticamente (produtos + mão de obra)
    // Se custo for fornecido no body, usar ele; senão calcular
    if (createTreatmentDto.custo !== undefined && createTreatmentDto.custo !== null) {
      treatment.custo = Number(createTreatmentDto.custo);
    } else {
      // Calcular custo inicial (será recalculado após adicionar produtos)
      treatment.custo = 0;
      
      // Adicionar custo de mão de obra se valorhora estiver configurado
      if (clienteMaster.valorHora) {
        const tempoEmHoras = Number(createTreatmentDto.averageDurationMinutes) / 60;
        const custoMaoDeObra = Number(clienteMaster.valorHora) * tempoEmHoras;
        treatment.custo = Number(custoMaoDeObra.toFixed(2));
      }
    }
    
    // Calcular lucro apenas se ambos price e custo estiverem definidos
    if (createTreatmentDto.price !== undefined && treatment.custo !== undefined) {
      treatment.lucro = Number(createTreatmentDto.price) - treatment.custo;
    } else {
      treatment.lucro = 0;
    }
   
    const treatmentSalvo = await this.treatmentRepository.save(treatment);

    // Adicionar produtos se fornecidos (recalcula custo incluindo produtos + mão de obra)
    if (createTreatmentDto.products && createTreatmentDto.products.length > 0) {
      await this.adicionarProdutosAoTratamento(treatmentSalvo.id, createTreatmentDto.products, userId, userTipo);
    } else {
      // Se não tiver produtos, recalcular para garantir que mão de obra está incluída
      await this.recalcularCustoELucro(treatmentSalvo.id);
    }

    return this.findOne(treatmentSalvo.id, userId, userTipo);
  }

  /**
   * Lista todos os tratamentos de um cliente master
   * Retorna os dados como estão no banco, sem fazer cálculos
   */
  async findAll(clienteMasterId: string, userId: string, userTipo: string): Promise<Treatment[]> {
    if (!clienteMasterId) {
      throw new BadRequestException('Cliente Master ID é obrigatório');
    }

    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    return this.treatmentRepository.find({
      where: { clienteMasterId },
      relations: ['treatmentProducts', 'treatmentProducts.product', 'treatmentProducts.product.category', 'clienteMaster'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca tratamentos por nome (busca parcial e case-insensitive)
   * Retorna apenas tratamentos vinculados ao clienteMaster especificado
   */
  async buscarPorNome(nome: string, clienteMasterId: string, userId: string, userTipo: string): Promise<Treatment[]> {
    if (!nome || nome.trim().length === 0) {
      throw new BadRequestException('Nome é obrigatório para busca');
    }

    if (!clienteMasterId) {
      throw new BadRequestException('Cliente Master ID é obrigatório');
    }

    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    return this.treatmentRepository
      .createQueryBuilder('treatment')
      .leftJoinAndSelect('treatment.treatmentProducts', 'treatmentProduct')
      .leftJoinAndSelect('treatmentProduct.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .where('treatment.clienteMasterId = :clienteMasterId', { clienteMasterId })
      .andWhere('treatment.name ILIKE :nome', { nome: `%${nome.trim()}%` })
      .orderBy('treatment.name', 'ASC')
      .getMany();
  }

  /**
   * Busca um tratamento específico
   */
  async findOne(id: string, userId: string, userTipo: string): Promise<Treatment> {
    const treatment = await this.treatmentRepository.findOne({
      where: { id },
      relations: ['treatmentProducts', 'treatmentProducts.product', 'treatmentProducts.product.category', 'clienteMaster'],
    });

    if (!treatment) {
      throw new NotFoundException('Tratamento não encontrado');
    }

    await this.verificarPermissao(userId, userTipo, treatment.clienteMasterId);

    return treatment;
  }

  /**
   * Atualiza um tratamento
   * Grava apenas o que vier do body, sem fazer cálculos
   */
  async update(id: string, updateTreatmentDto: UpdateTreatmentDto, userId: string, userTipo: string): Promise<Treatment> {
    const treatment = await this.findOne(id, userId, userTipo);

    if (updateTreatmentDto.name !== undefined) {
      treatment.name = updateTreatmentDto.name;
    }
    if (updateTreatmentDto.description !== undefined) {
      treatment.description = updateTreatmentDto.description;
    }
    const tempoMudou = updateTreatmentDto.averageDurationMinutes !== undefined && 
      updateTreatmentDto.averageDurationMinutes !== treatment.averageDurationMinutes;
    
    if (updateTreatmentDto.averageDurationMinutes !== undefined) {
      treatment.averageDurationMinutes = updateTreatmentDto.averageDurationMinutes;
    }
    if (updateTreatmentDto.price !== undefined) {
      treatment.price = updateTreatmentDto.price;
    }
    
    // Se custo foi fornecido manualmente, usar ele; senão recalcular
    if (updateTreatmentDto.custo !== undefined && updateTreatmentDto.custo !== null) {
      treatment.custo = Number(updateTreatmentDto.custo);
    } else if (tempoMudou || updateTreatmentDto.products) {
      // Se tempo mudou ou produtos foram atualizados, recalcular custo (inclui valorhora)
      await this.recalcularCustoELucro(treatment.id);
      // Buscar tratamento atualizado após recálculo
      const treatmentAtualizado = await this.treatmentRepository.findOne({
        where: { id: treatment.id },
        relations: ['clienteMaster'],
      });
      if (treatmentAtualizado) {
        treatment.custo = treatmentAtualizado.custo;
        treatment.lucro = treatmentAtualizado.lucro;
      }
    }

    // Calcular lucro apenas se ambos price e custo estiverem definidos
    if (updateTreatmentDto.price !== undefined || updateTreatmentDto.custo !== undefined) {
      const priceFinal = updateTreatmentDto.price !== undefined ? Number(updateTreatmentDto.price) : Number(treatment.price);
      const custoFinal = updateTreatmentDto.custo !== undefined ? Number(updateTreatmentDto.custo) : Number(treatment.custo);
      treatment.lucro = priceFinal - custoFinal;
    }

    await this.treatmentRepository.save(treatment);

    // Atualizar produtos se fornecidos (recalcula custo incluindo produtos + mão de obra)
    if (updateTreatmentDto.products !== undefined) {
      // Remover produtos antigos
      await this.treatmentProductRepository.delete({ treatmentId: id });

      // Adicionar novos produtos
      if (updateTreatmentDto.products.length > 0) {
        await this.adicionarProdutosAoTratamento(id, updateTreatmentDto.products, userId, userTipo);
      } else {
        // Se removeu todos os produtos, recalcular custo (apenas mão de obra se tiver valorhora)
        await this.recalcularCustoELucro(id);
      }
    }

    return this.findOne(id, userId, userTipo);
  }

  /**
   * Remove um tratamento
   */
  async remove(id: string, userId: string, userTipo: string): Promise<void> {
    const treatment = await this.findOne(id, userId, userTipo);
    await this.treatmentRepository.remove(treatment);
  }

  /**
   * Adiciona produtos a um tratamento
   */
  private async adicionarProdutosAoTratamento(
    treatmentId: string,
    products: Array<{ productId: string; quantityUsed: number }>,
    userId: string,
    userTipo: string,
  ): Promise<void> {
    const treatment = await this.findOne(treatmentId, userId, userTipo);

    for (const productDto of products) {
      const product = await this.productRepository.findOne({
        where: { id: productDto.productId },
      });

      if (!product) {
        throw new NotFoundException(`Produto ${productDto.productId} não encontrado`);
      }

      // Verificar se o produto pertence ao mesmo cliente master
      if (product.clienteMasterId !== treatment.clienteMasterId) {
        throw new BadRequestException(`Produto ${product.name} não pertence ao mesmo Cliente Master`);
      }

      const treatmentProduct = new TreatmentProduct();
      treatmentProduct.treatmentId = treatmentId;
      treatmentProduct.productId = productDto.productId;
      treatmentProduct.quantityUsed = productDto.quantityUsed;

      await this.treatmentProductRepository.save(treatmentProduct);
    }

    // Recalcular custo após adicionar produtos (inclui produtos + mão de obra)
    await this.recalcularCustoELucro(treatmentId);
  }

  /**
   * Recalcula e atualiza o custo e lucro de um tratamento
   * Inclui custo dos produtos + (valorhora * tempo em horas)
   */
  private async recalcularCustoELucro(treatmentId: string): Promise<void> {
    const treatment = await this.treatmentRepository.findOne({
      where: { id: treatmentId },
      relations: ['treatmentProducts', 'treatmentProducts.product', 'clienteMaster'],
    });

    if (!treatment) {
      return;
    }

    let custoTotal = 0;

    // 1. Calcular custo total de todos os produtos (proporcional)
    for (const treatmentProduct of treatment.treatmentProducts) {
      const product = treatmentProduct.product;
      const quantidadeUsada = Number(treatmentProduct.quantityUsed);
      const quantidadeTotal = product.totalQuantity ? Number(product.totalQuantity) : null;
      const custoTotalProduto = Number(product.unitCost);

      let custoProduto: number;

      // Se tem quantidade total de referência, calcular proporcionalmente
      if (quantidadeTotal && quantidadeTotal > 0) {
        // Exemplo: 200g custa R$ 80, usar 80g = (80/200) * 80 = R$ 32
        custoProduto = (quantidadeUsada / quantidadeTotal) * custoTotalProduto;
      } else {
        // Se não tem quantidade total, usar custo direto (para produtos unitários)
        custoProduto = custoTotalProduto * quantidadeUsada;
      }

      custoTotal += custoProduto;
    }

    // 2. Adicionar custo de mão de obra (valorhora * tempo em horas)
    if (treatment.clienteMaster && treatment.clienteMaster.valorHora) {
      const tempoEmHoras = Number(treatment.averageDurationMinutes) / 60; // Converter minutos para horas
      const custoMaoDeObra = Number(treatment.clienteMaster.valorHora) * tempoEmHoras;
      custoTotal += custoMaoDeObra;
    }

    // Calcular lucro (preço - custo)
    const lucro = Number(treatment.price) - custoTotal;

    // Atualizar tratamento
    treatment.custo = Number(custoTotal.toFixed(2));
    treatment.lucro = Number(lucro.toFixed(2));

    await this.treatmentRepository.save(treatment);
  }

  /**
   * Calcula o custo direto total de um tratamento
   * Inclui custo dos produtos + mão de obra (valorhora * tempo)
   */
  async calculateTreatmentCost(treatmentId: string, userId: string, userTipo: string): Promise<{
    treatment: Treatment;
    directCost: number;
    margin: number;
    marginPercentage: number;
    productsBreakdown: Array<{
      product: Product;
      quantityUsed: number;
      cost: number;
    }>;
    laborCost?: number;
  }> {
    const treatment = await this.findOne(treatmentId, userId, userTipo);

    let directCost = 0;
    let laborCost = 0;
    const productsBreakdown: Array<{
      product: Product;
      quantityUsed: number;
      cost: number;
    }> = [];

    // 1. Calcular custo de cada produto usado (proporcional)
    for (const treatmentProduct of treatment.treatmentProducts) {
      const product = treatmentProduct.product;
      const quantidadeUsada = Number(treatmentProduct.quantityUsed);
      const quantidadeTotal = product.totalQuantity ? Number(product.totalQuantity) : null;
      const custoTotalProduto = Number(product.unitCost);

      let cost: number;

      // Se tem quantidade total de referência, calcular proporcionalmente
      if (quantidadeTotal && quantidadeTotal > 0) {
        // Exemplo: 200g custa R$ 80, usar 80g = (80/200) * 80 = R$ 32
        cost = (quantidadeUsada / quantidadeTotal) * custoTotalProduto;
      } else {
        // Se não tem quantidade total, usar custo direto (para produtos unitários)
        cost = custoTotalProduto * quantidadeUsada;
      }

      directCost += cost;

      productsBreakdown.push({
        product,
        quantityUsed: quantidadeUsada,
        cost: Number(cost.toFixed(2)),
      });
    }

    // 2. Adicionar custo de mão de obra (valorhora * tempo em horas)
    if (treatment.clienteMaster && treatment.clienteMaster.valorHora) {
      const tempoEmHoras = Number(treatment.averageDurationMinutes) / 60;
      laborCost = Number(treatment.clienteMaster.valorHora) * tempoEmHoras;
      directCost += laborCost;
    }

    // Calcular margem
    const margin = Number(treatment.price) - directCost;
    const marginPercentage = Number(treatment.price) > 0 
      ? (margin / Number(treatment.price)) * 100 
      : 0;

    return {
      treatment,
      directCost: Number(directCost.toFixed(2)),
      margin: Number(margin.toFixed(2)),
      marginPercentage: Number(marginPercentage.toFixed(2)),
      productsBreakdown,
      laborCost: laborCost > 0 ? Number(laborCost.toFixed(2)) : undefined,
    };
  }

  /**
   * Atualiza todos os custos de todos os tratamentos de um ClienteMaster
   * Chamado quando valorhora é alterado
   */
  async atualizarCustosPorValorHora(clienteMasterId: string): Promise<{
    atualizados: number;
    detalhes: Array<{
      treatmentId: string;
      nome: string;
      custoAnterior: number;
      custoNovo: number;
    }>;
  }> {
    const tratamentos = await this.treatmentRepository.find({
      where: { clienteMasterId },
      relations: ['treatmentProducts', 'treatmentProducts.product', 'clienteMaster'],
    });

    const resultado = {
      atualizados: 0,
      detalhes: [] as Array<{
        treatmentId: string;
        nome: string;
        custoAnterior: number;
        custoNovo: number;
      }>,
    };

    for (const treatment of tratamentos) {
      const custoAnterior = Number(treatment.custo);
      
      // Recalcular custo (inclui produtos + mão de obra atualizada)
      await this.recalcularCustoELucro(treatment.id);
      
      // Buscar tratamento atualizado
      const treatmentAtualizado = await this.treatmentRepository.findOne({
        where: { id: treatment.id },
      });

      if (treatmentAtualizado) {
        const custoNovo = Number(treatmentAtualizado.custo);
        resultado.atualizados++;
        resultado.detalhes.push({
          treatmentId: treatment.id,
          nome: treatment.name,
          custoAnterior,
          custoNovo,
        });
      }
    }

    return resultado;
  }
}

