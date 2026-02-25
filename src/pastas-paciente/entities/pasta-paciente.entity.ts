import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { ClienteMaster } from '../../users/entities/cliente-master.entity';
import { ArquivoPasta } from './arquivo-pasta.entity';

@Entity('pastas_paciente')
export class PastaPaciente {
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

  @Column({ name: 'titulo', type: 'varchar', length: 255 })
  titulo: string;

  @OneToMany(() => ArquivoPasta, (arquivo) => arquivo.pasta)
  arquivos: ArquivoPasta[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
