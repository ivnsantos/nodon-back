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
import { TipoConsulta } from './tipo-consulta.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { UserComum } from '../../users/entities/user-comum.entity';
import { UserBase } from '../../users/entities/user-base.entity';

/**
 * Representa uma consulta/evento agendado no calendário.
 */
@Entity('consultas')
@Index(['clienteMasterId'])
@Index(['dataConsulta'])
@Index(['pacienteId'])
@Index(['profissionalId'])
@Index(['tipoConsultaId'])
export class Consulta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_master_id', nullable: true })
  clienteMasterId: string;

  @ManyToOne(() => ClienteMaster, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cliente_master_id' })
  clienteMaster: ClienteMaster;

  @Column({ name: 'tipo_consulta_id' })
  tipoConsultaId: string;

  @ManyToOne(() => TipoConsulta, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tipo_consulta_id' })
  tipoConsulta: TipoConsulta;

  @Column({ name: 'paciente_id', nullable: true })
  pacienteId: string | null;

  @ManyToOne(() => Paciente, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente | null;

  @Column({ name: 'profissional_id', nullable: true })
  profissionalId: string | null;

  @ManyToOne(() => UserComum, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'profissional_id' })
  profissional: UserComum | null;

  @Column({ length: 255, nullable: true })
  titulo: string;

  @Column({
    name: 'data_consulta',
    type: 'date',
    transformer: {
      // Ao ler do banco: converte string (YYYY-MM-DD) ou Date para Date em UTC
      from: (value: string | Date | null): Date | null => {
        if (!value) return null;
        
        if (typeof value === 'string') {
          const [year, month, day] = value.split('T')[0].split('-').map(Number);
          return new Date(Date.UTC(year, month - 1, day));
        }
        
        if (value instanceof Date) {
          const year = value.getUTCFullYear();
          const month = value.getUTCMonth();
          const day = value.getUTCDate();
          return new Date(Date.UTC(year, month, day));
        }
        
        return null;
      },
      // Ao salvar no banco: preserva string YYYY-MM-DD ou converte Date para string
      to: (value: string | Date | null): string | null => {
        if (!value) return null;
        
        if (typeof value === 'string') {
          return value.split('T')[0].split(' ')[0];
        }
        
        if (value instanceof Date) {
          const year = value.getUTCFullYear();
          const month = String(value.getUTCMonth() + 1).padStart(2, '0');
          const day = String(value.getUTCDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        
        return null;
      },
    },
  })
  dataConsulta: Date;

  @Column({ name: 'hora_consulta', type: 'time' })
  horaConsulta: string;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'agendada',
  })
  status: 'link' | 'agendada' | 'confirmada' | 'cancelada' | 'concluida';

  @Column({ name: 'created_by', nullable: true })
  createdBy: string | null;

  @ManyToOne(() => UserBase, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdByUser: UserBase | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

