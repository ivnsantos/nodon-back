import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Assinatura } from './assinatura.entity';

@Entity('recorrencias')
export class Recorrencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'assinatura_id' })
  assinaturaId: string;

  @ManyToOne(() => Assinatura, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assinatura_id' })
  assinatura: Assinatura;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'next_due_date', type: 'date' })
  nextDueDate: Date;

  @Column({ name: 'valor', type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

