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
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ClientesMasterService } from '../../users/clientes-master.service';
import { UserComumService } from '../../users/services/user-comum.service';
import { CostCategoriesService } from './cost-categories.service';

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

    return this.productRepository.save(product);
  }

  /**
   * Remove um produto
   */
  async remove(id: string, userId: string, userTipo: string): Promise<void> {
    const product = await this.findOne(id, userId, userTipo);
    await this.productRepository.remove(product);
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

