import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ClienteMaster } from '../../users/entities/cliente-master.entity';
import { Consulta } from './consulta.entity';

/**
 * Representa um tipo de consulta/tratamento personalizado criado pelo usuário.
 */
@Entity('tipos_consulta')
@Index(['clienteMasterId'])
export class TipoConsulta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_master_id' })
  clienteMasterId: string;

  @ManyToOne(() => ClienteMaster, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cliente_master_id' })
  clienteMaster: ClienteMaster;

  @Column({ length: 100 })
  nome: string;

  @Column({ length: 7, default: '#0ea5e9' })
  cor: string; // Código hexadecimal da cor

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Consulta, (consulta) => consulta.tipoConsulta)
  consultas: Consulta[];
}

