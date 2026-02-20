import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClienteMaster } from '../../users/entities/cliente-master.entity';

@Entity('cobrancas')
export class Cobranca {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @ManyToOne(() => ClienteMaster, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  clienteMaster: ClienteMaster | null;

  @Column({ name: 'asaas_payment_id' })
  asaasPaymentId: string;

  @Column({ name: 'asaas_customer_id' })
  asaasCustomerId: string;

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

  @Column({ type: 'text', name: 'asaas_response', nullable: true })
  asaasResponse: string;

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

