import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ClienteMaster } from '../../users/entities/cliente-master.entity';

@Entity('cobrancas')
@Index('idx_unique_assinatura_due_date', ['assinaturaId', 'dueDate'], { unique: true })
export class Cobranca {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @ManyToOne(() => ClienteMaster, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  clienteMaster: ClienteMaster | null;

  @Column({ name: 'pagar_me_order_id', type: 'varchar', nullable: true })
  pagarMeOrderId: string | null;

  @Column({ name: 'pagar_me_customer_id', type: 'varchar', nullable: true })
  pagarMeCustomerId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ name: 'billing_type' })
  billingType: string;

  @Column({ nullable: true })
  status: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'payment_date', type: 'date', nullable: true })
  paymentDate: Date | null;

  @Column({ type: 'text', name: 'pagar_me_response', nullable: true })
  pagarMeResponse: string | null;

  @Column({ name: 'assinatura_id', type: 'uuid', nullable: true })
  assinaturaId: string | null;

  @Column({ name: 'plano_id', type: 'uuid', nullable: true })
  planoId: string | null;

  @Column({ name: 'coupon_id', type: 'uuid', nullable: true })
  couponId: string | null;

  @Column({ type: 'text', name: 'dados_assinatura', nullable: true })
  dadosAssinatura: string | null; // JSON com dados necessários para criar assinatura depois

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

