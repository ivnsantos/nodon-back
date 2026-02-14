import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { ClienteMaster } from '../../users/entities/cliente-master.entity';
import { ItemOrcamento } from './item-orcamento.entity';

export enum StatusOrcamento {
  RASCUNHO = 'RASCUNHO',
  ENVIADO = 'ENVIADO',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  ACEITO = 'ACEITO',
  RECUSADO = 'RECUSADO',
  CANCELADO = 'CANCELADO',
  FINALIZADO = 'FINALIZADO',
}

@Entity('orcamentos')
export class Orcamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @Column({ name: 'cliente_master_id', type: 'uuid' })
  clienteMasterId: string;

  @ManyToOne(() => ClienteMaster)
  @JoinColumn({ name: 'cliente_master_id' })
  clienteMaster: ClienteMaster;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: StatusOrcamento.RASCUNHO,
  })
  status: StatusOrcamento;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string | null;

  @Column({ name: 'valor_total', type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorTotal: number;

  @OneToMany(() => ItemOrcamento, (item) => item.orcamento, {
    cascade: true,
    eager: false,
  })
  itens: ItemOrcamento[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

