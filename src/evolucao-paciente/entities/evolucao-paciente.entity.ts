import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Consulta } from '../../calendario/entities/consulta.entity';
import { UserBase } from '../../users/entities/user-base.entity';

@Entity('evolucao_paciente')
export class EvolucaoPaciente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @Column({ name: 'consulta_id', type: 'uuid', nullable: true })
  consultaId: string | null;

  @ManyToOne(() => Consulta, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'consulta_id' })
  consulta: Consulta | null;

  @Column({ name: 'profissional_id', type: 'uuid' })
  profissionalId: string;

  @ManyToOne(() => UserBase, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profissional_id' })
  profissional: UserBase;

  @Column({ type: 'varchar', length: 100 })
  titulo: string;

  @Column({ type: 'text' })
  observacao: string;

  @Column({ name: 'tipo_evolucao', type: 'varchar', length: 50, default: 'observacao' })
  tipoEvolucao: string; // observacao, procedimento, diagnostico, anamnese, retorno, etc.

  @Column({ type: 'text', nullable: true })
  anexos: string | null; // JSON com URLs de imagens/arquivos

  @Column({ type: 'text', nullable: true })
  tags: string | null; // JSON com tags para filtros

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
