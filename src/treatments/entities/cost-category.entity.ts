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
import { Product } from './product.entity';

/**
 * Tipos de categoria de custo
 */
export enum CostCategoryType {
  DIRECT = 'DIRECT',
  INDIRECT = 'INDIRECT',
}

/**
 * Entidade que representa uma categoria de custo
 */
@Entity('cost_categories')
export class CostCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_master_id', type: 'uuid' })
  clienteMasterId: string;

  @ManyToOne(() => ClienteMaster)
  @JoinColumn({ name: 'cliente_master_id' })
  clienteMaster: ClienteMaster;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({
    name: 'type',
    type: 'varchar',
    length: 20,
    enum: CostCategoryType,
  })
  type: CostCategoryType;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

