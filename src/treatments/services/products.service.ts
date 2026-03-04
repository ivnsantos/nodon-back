import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ClienteMaster } from '../../users/entities/cliente-master.entity';
import { UserComum } from '../../users/entities/user-comum.entity';
import { TreatmentValidationService } from './treatment-validation.service';
import { CostCategoriesService } from './cost-categories.service';
import { ClientesMasterService } from '../../users/clientes-master.service';
import { UserComumService } from '../../users/services/user-comum.service';
import { TreatmentsService } from './treatments.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @Inject(forwardRef(() => ClientesMasterService))
    private clientesMasterService: ClientesMasterService,
    private userComumService: UserComumService,
    @Inject(forwardRef(() => CostCategoriesService))
    private costCategoriesService: CostCategoriesService,
    private treatmentValidationService: TreatmentValidationService,
    @Inject(forwardRef(() => TreatmentsService))
    private treatmentsService: TreatmentsService,
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
   * Cria um novo produto
   */
  async create(createProductDto: CreateProductDto, userId: string, userTipo: string): Promise<Product> {
    const clienteMasterId = createProductDto.clienteMasterId;

    if (!clienteMasterId) {
      throw new BadRequestException('Cliente Master ID é obrigatório');
    }

    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    // Verificar se a categoria existe e pertence ao mesmo cliente master
    const category = await this.costCategoriesService.findOne(createProductDto.categoryId, userId, userTipo);
    if (category.clienteMasterId !== clienteMasterId) {
      throw new BadRequestException('Categoria não pertence ao mesmo Cliente Master');
    }

    const product = new Product();
    product.clienteMasterId = clienteMasterId;
    product.name = createProductDto.name;
    product.categoryId = createProductDto.categoryId;
    product.unitCost = createProductDto.unitCost;
    product.totalQuantity = createProductDto.totalQuantity || null;
    product.unitType = createProductDto.unitType || null;
    product.stockQuantity = createProductDto.stockQuantity || null;

    return this.productRepository.save(product);
  }

  /**
   * Lista todos os produtos de um cliente master
   */
  async findAll(clienteMasterId: string, userId: string, userTipo: string): Promise<Product[]> {
    if (!clienteMasterId) {
      throw new BadRequestException('Cliente Master ID é obrigatório');
    }

    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    return this.productRepository.find({
      where: { clienteMasterId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca um produto específico
   */
  async findOne(id: string, userId: string, userTipo: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    await this.verificarPermissao(userId, userTipo, product.clienteMasterId);

    return product;
  }

  /**
   * Atualiza um produto
   */
  async update(id: string, updateProductDto: UpdateProductDto, userId: string, userTipo: string): Promise<Product> {
    const product = await this.findOne(id, userId, userTipo);

    // Verificar se o unitCost foi alterado
    const unitCostMudou = updateProductDto.unitCost !== undefined && 
      updateProductDto.unitCost !== product.unitCost;

    if (updateProductDto.name !== undefined) {
      product.name = updateProductDto.name;
    }
    if (updateProductDto.categoryId !== undefined) {
      // Verificar se a nova categoria existe e pertence ao mesmo cliente master
      const category = await this.costCategoriesService.findOne(updateProductDto.categoryId, userId, userTipo);
      if (category.clienteMasterId !== product.clienteMasterId) {
        throw new BadRequestException('Categoria não pertence ao mesmo Cliente Master');
      }
      product.categoryId = updateProductDto.categoryId;
    }
    if (updateProductDto.unitCost !== undefined) {
      product.unitCost = updateProductDto.unitCost;
    }
    if (updateProductDto.totalQuantity !== undefined) {
      product.totalQuantity = updateProductDto.totalQuantity;
    }
    if (updateProductDto.unitType !== undefined) {
      product.unitType = updateProductDto.unitType;
    }
    if (updateProductDto.stockQuantity !== undefined) {
      product.stockQuantity = updateProductDto.stockQuantity;
    }

    const produtoAtualizado = await this.productRepository.save(product);

    // Se unitCost foi alterado, atualizar todos os tratamentos que usam este produto
    if (unitCostMudou) {
      try {
        console.log(`🔄 Preço do produto ${id} alterado para R$ ${updateProductDto.unitCost}. Atualizando custos dos tratamentos...`);
        const resultado = await this.treatmentsService.atualizarCustosPorProduto(id);
        console.log(`✅ ${resultado.atualizados} tratamentos atualizados com sucesso`);
      } catch (error: any) {
        console.error('❌ Erro ao atualizar custos dos tratamentos:', error.message);
        // Não lança erro para não bloquear a atualização do produto
      }
    }

    return produtoAtualizado;
  }

  /**
   * Remove um produto
   */
  async remove(id: string, userId: string, userTipo: string): Promise<void> {
    const product = await this.findOne(id, userId, userTipo);
    
    // Verificar se o produto está vinculado a algum tratamento
    await this.treatmentValidationService.validateProductDelete(id);
    
    await this.productRepository.remove(product);
  }

  /**
   * Verifica vínculos do produto com tratamentos
   */
  async getTreatmentLinks(id: string, userId: string, userTipo: string): Promise<{
    isLinked: boolean;
    treatments: Array<{
      id: string;
      name: string;
      quantityUsed: number;
    }>;
  }> {
    await this.findOne(id, userId, userTipo); // Verifica permissão
    
    return this.treatmentValidationService.checkProductTreatments(id);
  }

  /**
   * Busca produtos por nome (busca parcial/similar)
   */
  async buscarPorNome(nome: string, clienteMasterId: string, userId: string, userTipo: string): Promise<Product[]> {
    if (!nome || nome.trim().length === 0) {
      throw new BadRequestException('Nome é obrigatório para busca');
    }

    if (!clienteMasterId) {
      throw new BadRequestException('Cliente Master ID é obrigatório');
    }

    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.clienteMasterId = :clienteMasterId', { clienteMasterId })
      .andWhere('product.name ILIKE :nome', { nome: `%${nome.trim()}%` })
      .orderBy('product.name', 'ASC')
      .getMany();
  }
}

