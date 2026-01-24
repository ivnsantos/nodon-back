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
import { ClienteMaster } from '../../users/entities/cliente-master.entity';
import { DesenhoProfissional } from '../../desenhos-profissionais/entities/desenho-profissional.entity';

@Entity('radiografias')
export class Radiografia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClienteMaster)
  @JoinColumn({ name: 'cliente_master_id' })
  masterClient: ClienteMaster;

  @Column({ name: 'paciente_id', type: 'uuid', nullable: true })
  pacienteId: string | null;

  @ManyToOne('Paciente', 'radiografias')
  @JoinColumn({ name: 'paciente_id' })
  paciente: any;

  @Column({ name: 'nome_paciente', type: 'varchar' })
  nome: string;

  @Column({ name: 'email_paciente', type: 'varchar', nullable: true })
  emailPaciente: string | null;

  @Column({ type: 'varchar', nullable: true })
  radiografia: string | null;

  @Column({ type: 'date' })
  data: Date;

  @Column({ name: 'tipo_exame', type: 'varchar', nullable: true })
  tipoExame: string | null;

  @Column({ type: 'text', nullable: true })
  tratamento: string | null;

  @Column({ name: 'imagens', type: 'jsonb' })
  imagens: Array<{ url: string }>; // Array de objetos com URL

  @Column({ name: 'descricao_exame', type: 'text', nullable: true })
  descricaoExame: string | null;

  @Column({ name: 'achados_radiograficos', type: 'jsonb', nullable: true })
  achadosRadiograficos: string[] | null;

  @Column({ name: 'necessidades', type: 'jsonb', nullable: true })
  necessidades: string[] | null;

  @Column({ name: 'responsavel_id', type: 'uuid', nullable: true })
  responsavelId: string | null;

  @OneToMany(() => DesenhoProfissional, (desenho) => desenho.radiografia)
  desenhosProfissionais: DesenhoProfissional[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
