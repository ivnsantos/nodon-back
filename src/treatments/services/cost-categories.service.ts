import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CostCategory } from '../entities/cost-category.entity';
import { CreateCostCategoryDto } from '../dto/create-cost-category.dto';
import { UpdateCostCategoryDto } from '../dto/update-cost-category.dto';
import { ClienteMaster } from '../../users/entities/cliente-master.entity';
import { UserComum } from '../../users/entities/user-comum.entity';
import { TreatmentValidationService } from './treatment-validation.service';
import { ClientesMasterService } from '../../users/clientes-master.service';
import { UserComumService } from '../../users/services/user-comum.service';

@Injectable()
export class CostCategoriesService {
  constructor(
    @InjectRepository(CostCategory)
    private costCategoryRepository: Repository<CostCategory>,
    @Inject(forwardRef(() => ClientesMasterService))
    private clientesMasterService: ClientesMasterService,
    private userComumService: UserComumService,
    private treatmentValidationService: TreatmentValidationService,
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
   * Cria uma nova categoria de custo
   */
  async create(createCostCategoryDto: CreateCostCategoryDto, userId: string, userTipo: string): Promise<CostCategory> {
    const clienteMasterId = createCostCategoryDto.clienteMasterId;

    if (!clienteMasterId) {
      throw new BadRequestException('Cliente Master ID é obrigatório');
    }

    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    const clienteMaster = await this.clientesMasterService.findById(clienteMasterId);
    if (!clienteMaster) {
      throw new NotFoundException('Cliente Master não encontrado');
    }

    const costCategory = new CostCategory();
    costCategory.clienteMasterId = clienteMasterId;
    costCategory.name = createCostCategoryDto.name;
    costCategory.type = createCostCategoryDto.type;

    return this.costCategoryRepository.save(costCategory);
  }

  /**
   * Lista todas as categorias de custo de um cliente master
   */
  async findAll(clienteMasterId: string, userId: string, userTipo: string): Promise<CostCategory[]> {
    if (!clienteMasterId) {
      throw new BadRequestException('Cliente Master ID é obrigatório');
    }

    await this.verificarPermissao(userId, userTipo, clienteMasterId);

    return this.costCategoryRepository.find({
      where: { clienteMasterId },
      relations: ['products'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca uma categoria de custo específica
   */
  async findOne(id: string, userId: string, userTipo: string): Promise<CostCategory> {
    const costCategory = await this.costCategoryRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!costCategory) {
      throw new NotFoundException('Categoria de custo não encontrada');
    }

    await this.verificarPermissao(userId, userTipo, costCategory.clienteMasterId);

    return costCategory;
  }

  /**
   * Atualiza uma categoria de custo
   */
  async update(id: string, updateCostCategoryDto: UpdateCostCategoryDto, userId: string, userTipo: string): Promise<CostCategory> {
    const costCategory = await this.findOne(id, userId, userTipo);

    if (updateCostCategoryDto.name !== undefined) {
      costCategory.name = updateCostCategoryDto.name;
    }
    if (updateCostCategoryDto.type !== undefined) {
      costCategory.type = updateCostCategoryDto.type;
    }

    return this.costCategoryRepository.save(costCategory);
  }

  /**
   * Remove uma categoria de custo
   */
  async remove(id: string, userId: string, userTipo: string): Promise<void> {
    const costCategory = await this.findOne(id, userId, userTipo);
    
    // Verificar se a categoria possui produtos vinculados a tratamentos
    await this.treatmentValidationService.validateCategoryDelete(id);
    
    await this.costCategoryRepository.remove(costCategory);
  }

  /**
   * Verifica vínculos da categoria com tratamentos (via produtos)
   */
  async getTreatmentLinks(id: string, userId: string, userTipo: string): Promise<{
    isLinked: boolean;
    products: Array<{
      id: string;
      name: string;
      treatments: Array<{
        id: string;
        name: string;
        quantityUsed: number;
      }>;
    }>;
  }> {
    await this.findOne(id, userId, userTipo); // Verifica permissão
    
    return this.treatmentValidationService.checkCategoryTreatments(id);
  }
}

