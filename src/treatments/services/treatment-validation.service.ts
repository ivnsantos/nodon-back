import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentProduct } from '../entities/treatment-product.entity';
import { Product } from '../entities/product.entity';
import { CostCategory } from '../entities/cost-category.entity';
import { Treatment } from '../entities/treatment.entity';

@Injectable()
export class TreatmentValidationService {
  constructor(
    @InjectRepository(TreatmentProduct)
    private treatmentProductRepository: Repository<TreatmentProduct>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(CostCategory)
    private costCategoryRepository: Repository<CostCategory>,
    @InjectRepository(Treatment)
    private treatmentRepository: Repository<Treatment>,
  ) {}

  /**
   * Verifica se um produto está vinculado a algum tratamento
   */
  async checkProductTreatments(productId: string): Promise<{
    isLinked: boolean;
    treatments: Array<{
      id: string;
      name: string;
      quantityUsed: number;
    }>;
  }> {
    const treatmentProducts = await this.treatmentProductRepository.find({
      where: { productId },
      relations: ['treatment'],
    });

    if (treatmentProducts.length === 0) {
      return { isLinked: false, treatments: [] };
    }

    const treatments = treatmentProducts.map(tp => ({
      id: tp.treatment.id,
      name: tp.treatment.name,
      quantityUsed: tp.quantityUsed,
    }));

    return { isLinked: true, treatments };
  }

  /**
   * Verifica se uma categoria possui produtos vinculados a tratamentos
   */
  async checkCategoryTreatments(categoryId: string): Promise<{
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
    // Buscar todos os produtos da categoria
    const products = await this.productRepository.find({
      where: { categoryId },
    });

    if (products.length === 0) {
      return { isLinked: false, products: [] };
    }

    const productIds = products.map(p => p.id);
    
    // Buscar todos os tratamentos vinculados a esses produtos
    const treatmentProducts = await this.treatmentProductRepository
      .createQueryBuilder('tp')
      .leftJoinAndSelect('tp.treatment', 'treatment')
      .leftJoinAndSelect('tp.product', 'product')
      .where('tp.productId IN (:...productIds)', { productIds })
      .getMany();

    if (treatmentProducts.length === 0) {
      return { isLinked: false, products: [] };
    }

    // Agrupar por produto
    const productsWithTreatments = products.map(product => {
      const linkedTreatments = treatmentProducts
        .filter(tp => tp.productId === product.id)
        .map(tp => ({
          id: tp.treatment.id,
          name: tp.treatment.name,
          quantityUsed: tp.quantityUsed,
        }));

      return {
        id: product.id,
        name: product.name,
        treatments: linkedTreatments,
      };
    }).filter(p => p.treatments.length > 0);

    return { 
      isLinked: productsWithTreatments.length > 0, 
      products: productsWithTreatments 
    };
  }

  /**
   * Valida exclusão de produto
   */
  async validateProductDelete(productId: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const { isLinked, treatments } = await this.checkProductTreatments(productId);

    if (isLinked) {
      const treatmentNames = treatments.map(t => `"${t.name}"`).join(', ');
      throw new BadRequestException(
        `Não é possível excluir o produto "${product.name}" porque está vinculado aos seguintes tratamentos: ${treatmentNames}. ` +
        `Remova o produto dos tratamentos antes de excluí-lo.`
      );
    }
  }

  /**
   * Valida exclusão de categoria
   */
  async validateCategoryDelete(categoryId: string): Promise<void> {
    const category = await this.costCategoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    const { isLinked, products } = await this.checkCategoryTreatments(categoryId);

    if (isLinked) {
      let message = `Não é possível excluir a categoria "${category.name}" porque os seguintes produtos estão vinculados a tratamentos:\n\n`;
      
      products.forEach(product => {
        const treatmentNames = product.treatments.map(t => `"${t.name}"`).join(', ');
        message += `• Produto "${product.name}" - Tratamentos: ${treatmentNames}\n`;
      });
      
      message += '\nRemova os produtos dos tratamentos ou exclua os produtos antes de excluir a categoria.';
      
      throw new BadRequestException(message);
    }
  }
}
