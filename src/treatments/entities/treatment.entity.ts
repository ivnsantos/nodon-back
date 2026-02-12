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
import { TreatmentProduct } from './treatment-product.entity';

/**
 * Entidade que representa um tratamento oferecido pela clínica
 */
@Entity('treatments')
export class Treatment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_master_id', type: 'uuid' })
  clienteMasterId: string;

  @ManyToOne(() => ClienteMaster)
  @JoinColumn({ name: 'cliente_master_id' })
  clienteMaster: ClienteMaster;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'average_duration_minutes', type: 'int' })
  averageDurationMinutes: number;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'custo', type: 'decimal', precision: 10, scale: 2, default: 0 })
  custo: number;

  @Column({ name: 'lucro', type: 'decimal', precision: 10, scale: 2, default: 0 })
  lucro: number;

  @OneToMany(() => TreatmentProduct, (treatmentProduct) => treatmentProduct.treatment, {
    cascade: true,
    eager: false,
  })
  treatmentProducts: TreatmentProduct[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

