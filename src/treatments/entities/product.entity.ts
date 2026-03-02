import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ClienteMaster } from '../../users/entities/cliente-master.entity';
import { CostCategory } from './cost-category.entity';
import { TreatmentProduct } from './treatment-product.entity';
import { UnitType } from '../enums/unit-type.enum';

/**
 * Entidade que representa um produto/material usado nos tratamentos
 */
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_master_id', type: 'uuid' })
  clienteMasterId: string;

  @ManyToOne(() => ClienteMaster)
  @JoinColumn({ name: 'cliente_master_id' })
  clienteMaster: ClienteMaster;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => CostCategory, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: CostCategory;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 10, scale: 2 })
  unitCost: number; // Custo total do produto (ex: 80 reais para 200g)

  @Column({ name: 'total_quantity', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalQuantity: number | null; // Quantidade total de referência (ex: 200g, 1 litro, etc)

  @Column({ 
    name: 'unit_type', 
    type: 'varchar', 
    length: 50, 
    nullable: true,
    comment: 'Tipo de unidade: Grama, Quilograma, Miligrama, Litro, Mililitro, Centímetro, Milímetro, Unitário'
  })
  unitType: UnitType | null; // Apenas unidades válidas definidas no enum

  @Column({ name: 'stock_quantity', type: 'decimal', precision: 10, scale: 2, nullable: true })
  stockQuantity: number | null;

  @OneToMany(() => TreatmentProduct, (treatmentProduct) => treatmentProduct.product)
  treatmentProducts: TreatmentProduct[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

