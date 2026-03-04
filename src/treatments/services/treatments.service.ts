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
    
    // Calcular custo total: soma dos produtos + mão de obra
    let custoTotal = 0;
    
    // 1. Somar valor de cada produto passado pelo front
    if (createTreatmentDto.products && createTreatmentDto.products.length > 0) {
      for (const productDto of createTreatmentDto.products) {
        custoTotal += Number(productDto.costInReais);
      }
    }
    
    // 2. Adicionar custo de mão de obra (valor hora × tempo em minutos convertido para horas)
    if (clienteMaster.valorHora) {
      const tempoEmHoras = Number(createTreatmentDto.averageDurationMinutes) / 60;
      const custoMaoDeObra = Number(clienteMaster.valorHora) * tempoEmHoras;
      custoTotal += custoMaoDeObra;
    }
    
    // Usar custo fornecido no body ou calcular automaticamente
    if (createTreatmentDto.custo !== undefined && createTreatmentDto.custo !== null) {
      treatment.custo = Number(Number(createTreatmentDto.custo).toFixed(2));
    } else {
      treatment.custo = Number(custoTotal.toFixed(2));
    }
    
    // Calcular lucro
    if (createTreatmentDto.price !== undefined && treatment.custo !== undefined) {
      treatment.lucro = Number((Number(createTreatmentDto.price) - treatment.custo).toFixed(2));
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
    
    // Primeiro remover todos os TreatmentProducts relacionados
    await this.treatmentProductRepository.delete({ treatmentId: id });
    
    // Depois remover o tratamento
    await this.treatmentRepository.remove(treatment);
  }

  /**
   * Adiciona produtos a um tratamento
   */
  private async adicionarProdutosAoTratamento(
    treatmentId: string,
    products: Array<{ productId: string; quantityUsed: number; costInReais: number }>,
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
        throw new ForbiddenException('Produto não pertence a este Cliente Master');
      }

      // Criar TreatmentProduct com o valor em reais
      const treatmentProduct = new TreatmentProduct();
      treatmentProduct.treatmentId = treatmentId;
      treatmentProduct.productId = productDto.productId;
      treatmentProduct.quantityUsed = Number(productDto.quantityUsed);
      treatmentProduct.costInReais = Number(Number(productDto.costInReais).toFixed(2));

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

    // 1. Calcular custo de cada produto
    for (const treatmentProduct of treatment.treatmentProducts) {
      const product = treatmentProduct.product;
      let custoProduto = 0;

      // Se tiver costInReais, usar valor fixo
      if (treatmentProduct.costInReais) {
        custoProduto = Number(treatmentProduct.costInReais);
      } else {
        // Senão, usar preço atual do produto com lógica correta
        const quantidadeUsada = Number(treatmentProduct.quantityUsed);
        const custoTotalProduto = Number(product.unitCost);

        if (product.totalQuantity && product.totalQuantity > 0) {
          // Produto com quantidade (ex: 200g, 100ml)
          custoProduto = (quantidadeUsada / product.totalQuantity) * custoTotalProduto;
        } else if (product.stockQuantity && product.stockQuantity > 0) {
          // Produto unitário com stock (ex: 30 pacotes)
          custoProduto = (quantidadeUsada / product.stockQuantity) * custoTotalProduto;
        } else {
          // Produto unitário sem stock definido
          custoProduto = custoTotalProduto * quantidadeUsada;
        }
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

    // 1. Somar valor em reais de cada produto
    for (const treatmentProduct of treatment.treatmentProducts) {
      const product = treatmentProduct.product;
      const quantidadeUsada = Number(treatmentProduct.quantityUsed);
      let cost = 0;

      // Usar costInReais se disponível, senão calcular proporcional
      if (treatmentProduct.costInReais) {
        cost = Number(treatmentProduct.costInReais);
      } else {
        const custoTotalProduto = Number(product.unitCost);

        if (product.totalQuantity && product.totalQuantity > 0) {
          // Produto com quantidade (ex: 200g, 100ml)
          cost = (quantidadeUsada / product.totalQuantity) * custoTotalProduto;
        } else if (product.stockQuantity && product.stockQuantity > 0) {
          // Produto unitário com stock (ex: 30 pacotes)
          cost = (quantidadeUsada / product.stockQuantity) * custoTotalProduto;
        } else {
          // Produto unitário sem stock definido
          cost = custoTotalProduto * quantidadeUsada;
        }
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
   * Atualiza os custos de um tratamento (produtos + mão de obra)
   * Chamado quando um produto é alterado
   */
  private async recalcularCustoProdutos(treatmentId: string): Promise<void> {
    const treatment = await this.treatmentRepository.findOne({
      where: { id: treatmentId },
      relations: ['treatmentProducts', 'clienteMaster'],
    });

    if (!treatment) {
      return;
    }

    let custoTotalProdutos = 0;

    // Somar os custos dos produtos
    for (const treatmentProduct of treatment.treatmentProducts) {
      if (treatmentProduct.costInReais) {
        custoTotalProdutos += Number(treatmentProduct.costInReais);
      }
    }

    // Adicionar custo de mão de obra (valor hora × tempo em horas)
    let custoMaoDeObra = 0;
    if (treatment.clienteMaster && treatment.clienteMaster.valorHora) {
      const tempoEmHoras = Number(treatment.averageDurationMinutes) / 60;
      custoMaoDeObra = Number(treatment.clienteMaster.valorHora) * tempoEmHoras;
    }

    // Custo total = produtos + mão de obra
    const custoTotal = custoTotalProdutos + custoMaoDeObra;
    
    // Atualizar tratamento
    treatment.custo = Number(custoTotal.toFixed(2));
    
    // Recalcular lucro
    if (treatment.price) {
      treatment.lucro = Number((Number(treatment.price) - treatment.custo).toFixed(2));
    }

    await this.treatmentRepository.save(treatment);
    
    console.log(`  💰 Custo final: produtos R$${custoTotalProdutos.toFixed(2)} + mão de obra R$${custoMaoDeObra.toFixed(2)} = R$${custoTotal.toFixed(2)}`);
  }

  /**
   * Atualiza todos os custos de tratamentos que usam um produto específico
   * Chamado quando o preço de um produto é alterado
   */
  async atualizarCustosPorProduto(productId: string): Promise<{
    atualizados: number;
    detalhes: Array<{
      treatmentId: string;
      nome: string;
      custoAnterior: number;
      custoNovo: number;
    }>;
  }> {
    // Buscar o produto para obter o novo preço e quantidade
    const produto = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Buscar todos os TreatmentProducts que usam este produto
    const treatmentProducts = await this.treatmentProductRepository.find({
      where: { productId },
      relations: ['treatment', 'treatment.clienteMaster'],
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

    console.log(`🔄 Produto ${productId}: preço=${produto.unitCost}, quantidade=${produto.totalQuantity}, tipo=${produto.unitType}`);

    for (const treatmentProduct of treatmentProducts) {
      const treatment = treatmentProduct.treatment;
      if (!treatment) continue;

      const custoAnterior = Number(treatment.custo);
      
      // Calcular NOVO costInReais baseado no NOVO preço e tipo do produto
      const quantidadeUsada = Number(treatmentProduct.quantityUsed);
      const custoTotalProduto = Number(produto.unitCost);

      let novoCostInReais: number;

      if (produto.totalQuantity && produto.totalQuantity > 0) {
        // Produto com quantidade (ex: 200g, 100ml)
        // Lógica: (quantidadeUsada / quantidadeTotal) * custoTotalProduto
        novoCostInReais = (quantidadeUsada / produto.totalQuantity) * custoTotalProduto;
        console.log(`  📊 Tratamento ${treatment.name}: ${quantidadeUsada}/${produto.totalQuantity} * R$${custoTotalProduto} = R$${novoCostInReais}`);
      } else if (produto.stockQuantity && produto.stockQuantity > 0) {
        // Produto unitário com stock (ex: 30 pacotes, 100 unidades)
        // Lógica: (quantidadeUsada / stockQuantity) * custoTotalProduto
        // Ex: 1 unidade / 30 pacotes * R$ 100 = R$ 3.33
        novoCostInReais = (quantidadeUsada / produto.stockQuantity) * custoTotalProduto;
        console.log(`  📊 Tratamento ${treatment.name}: ${quantidadeUsada}/${produto.stockQuantity} * R$${custoTotalProduto} = R$${novoCostInReais}`);
      } else {
        // Produto unitário sem stock definido
        // Lógica: custoTotalProduto * quantidadeUsada
        novoCostInReais = custoTotalProduto * quantidadeUsada;
        console.log(`  📊 Tratamento ${treatment.name}: ${quantidadeUsada} * R$${custoTotalProduto} = R$${novoCostInReais}`);
      }

      // Atualizar o TreatmentProduct com o novo costInReais
      treatmentProduct.costInReais = Number(novoCostInReais.toFixed(2));
      await this.treatmentProductRepository.save(treatmentProduct);
      
      // Recalcular APENAS os custos dos produtos (sem valor hora)
      await this.recalcularCustoProdutos(treatment.id);
      
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
        console.log(`  ✅ Tratamento ${treatment.name}: R$${custoAnterior} → R$${custoNovo}`);
      }
    }

    return resultado;
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

