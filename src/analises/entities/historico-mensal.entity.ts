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

@Entity('historico_mensal')
export class HistoricoMensal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_master_id' })
  clienteMasterId: string;

  @ManyToOne(() => ClienteMaster, { nullable: false })
  @JoinColumn({ name: 'cliente_master_id' })
  clienteMaster: ClienteMaster;

  @Column({ name: 'ano', type: 'int' })
  ano: number;

  @Column({ name: 'mes', type: 'int' })
  mes: number;

  @Column({ name: 'tokens_utilizados', type: 'bigint', default: 0 })
  tokensUtilizados: number;

  @Column({ name: 'analises_feitas', type: 'int', default: 0 })
  analisesFeitas: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

