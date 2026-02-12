import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Treatment } from './treatment.entity';
import { Product } from './product.entity';

/**
 * Entidade de relacionamento many-to-many entre Treatment e Product
 * Representa quais produtos são usados em cada tratamento e em que quantidade
 */
@Entity('treatment_products')
@Unique(['treatmentId', 'productId'])
export class TreatmentProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'treatment_id', type: 'uuid' })
  treatmentId: string;

  @ManyToOne(() => Treatment, (treatment) => treatment.treatmentProducts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'treatment_id' })
  treatment: Treatment;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.treatmentProducts)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'quantity_used', type: 'decimal', precision: 10, scale: 2 })
  quantityUsed: number;
}

