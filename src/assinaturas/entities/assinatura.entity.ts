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
import { Plano } from '../../planos/entities/plano.entity';
import { Cupom } from '../../cupons/entities/cupom.entity';

@Entity('subscriptions')
export class Assinatura {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => ClienteMaster, (clienteMaster) => clienteMaster.assinaturas)
  @JoinColumn({ name: 'user_id' })
  clienteMaster: ClienteMaster;

  @Column({ name: 'asaas_customer_id', nullable: true })
  asaasCustomerId: string;

  @Column({ name: 'asaas_subscription_id', nullable: true })
  asaasSubscriptionId: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  cpf: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'address_number', nullable: true })
  addressNumber: string;

  @Column({ nullable: true })
  complement: string;

  @Column({ nullable: true })
  province: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column({ name: 'billing_type', nullable: true })
  billingType: string;

  @Column({ name: 'credit_card_token', nullable: true })
  creditCardToken: string;

  @Column({ nullable: true })
  status: string;

  @Column({ type: 'text', name: 'asaas_response', nullable: true })
  asaasResponse: string;

  @Column({ name: 'next_due_date', type: 'date', nullable: true })
  nextDueDate: Date | null;

  @Column({ name: 'admin_id', nullable: true })
  adminId: string;

  @Column({ name: 'credit_card_number', nullable: true })
  creditCardNumber: string;

  @Column({ name: 'credit_card_brand', nullable: true })
  creditCardBrand: string;

  @Column({ name: 'coupon_id', type: 'uuid', nullable: true })
  couponId: string;

  @ManyToOne(() => Cupom, { nullable: true })
  @JoinColumn({ name: 'coupon_id' })
  cupom: Cupom;

  @Column({ name: 'plano_id', type: 'uuid', nullable: true })
  planoId: string;

  @ManyToOne(() => Plano, { nullable: true })
  @JoinColumn({ name: 'plano_id' })
  plano: Plano;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

