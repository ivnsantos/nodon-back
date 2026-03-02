import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Orcamento } from './orcamento.entity';
import { Treatment } from '../../treatments/entities/treatment.entity';

export enum StatusItemOrcamento {
  EM_ANALISE = 'EM_ANALISE',
  PAGO = 'PAGO',
  RECUSADO = 'RECUSADO',
  PERDIDO = 'PERDIDO',
}

@Entity('itens_orcamento')
export class ItemOrcamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'orcamento_id', type: 'uuid' })
  orcamentoId: string;

  @ManyToOne(() => Orcamento, (orcamento) => orcamento.itens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orcamento_id' })
  orcamento: Orcamento;

  @Column({ name: 'tratamento_id', type: 'uuid', nullable: true })
  tratamentoId: string | null;

  @ManyToOne(() => Treatment, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tratamento_id' })
  tratamento: Treatment | null;

  @Column({ name: 'nome', type: 'varchar', length: 255 })
  nome: string;

  @Column({ name: 'descricao', type: 'text', nullable: true })
  descricao: string | null;

  @Column({ name: 'preco', type: 'decimal', precision: 10, scale: 2 })
  preco: number;

  @Column({ name: 'quantidade', type: 'int', default: 1 })
  quantidade: number;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: StatusItemOrcamento.EM_ANALISE,
  })
  status: StatusItemOrcamento;

  @Column({ name: 'ordem', type: 'int', default: 0 })
  ordem: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

