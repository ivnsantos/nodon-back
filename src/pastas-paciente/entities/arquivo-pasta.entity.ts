import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PastaPaciente } from './pasta-paciente.entity';

@Entity('arquivos_pasta')
export class ArquivoPasta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pasta_id', type: 'uuid' })
  pastaId: string;

  @ManyToOne(() => PastaPaciente, (pasta) => pasta.arquivos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pasta_id' })
  pasta: PastaPaciente;

  @Column({ name: 'url', type: 'text' })
  url: string;

  @Column({ name: 'nome_original', type: 'varchar', length: 500, nullable: true })
  nomeOriginal: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
