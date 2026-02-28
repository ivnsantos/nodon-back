import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Radiografia } from '../../radiografias/entities/radiografia.entity';
import { ClienteMaster } from '../../users/entities/cliente-master.entity';

export type StatusNecessidade = 'analisado_ia' | 'validado' | 'em_andamento' | 'concluido';

@Entity('necessidades')
export class Necessidade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_master_id', type: 'uuid' })
  clienteMasterId: string;

  @ManyToOne(() => ClienteMaster)
  @JoinColumn({ name: 'cliente_master_id' })
  clienteMaster: ClienteMaster;

  /** Preenchido quando a necessidade está vinculada a um paciente. */
  @Column({ name: 'paciente_id', type: 'uuid', nullable: true })
  pacienteId: string | null;

  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente | null;

  /** Preenchido quando a necessidade veio da análise de uma radiografia. */
  @Column({ name: 'radiografia_id', type: 'uuid', nullable: true })
  radiografiaId: string | null;

  @ManyToOne(() => Radiografia)
  @JoinColumn({ name: 'radiografia_id' })
  radiografia: Radiografia | null;

  /** Preenchido quando a necessidade veio de um desenho profissional. Sempre vem junto com radiografia_id. */
  @Column({ name: 'desenho_profissional_id', type: 'uuid', nullable: true })
  desenhoProfissionalId: string | null;

  @Column({ type: 'text' })
  descricao: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'validado',
  })
  status: StatusNecessidade;

  @Column({ type: 'text', nullable: true })
  observacao: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
