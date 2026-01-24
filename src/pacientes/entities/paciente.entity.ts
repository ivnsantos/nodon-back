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
import { Radiografia } from '../../radiografias/entities/radiografia.entity';

@Entity('pacientes')
export class Paciente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_master_id', type: 'uuid' })
  clienteMasterId: string;

  @ManyToOne(() => ClienteMaster)
  @JoinColumn({ name: 'cliente_master_id' })
  masterClient: ClienteMaster;

  @OneToMany(() => Radiografia, (radiografia) => radiografia.paciente)
  radiografias: Radiografia[];

  // Dados pessoais
  @Column({ name: 'nome', type: 'varchar', nullable: true })
  nome: string | null;

  @Column({ name: 'cpf', type: 'varchar', nullable: true })
  cpf: string | null;

  @Column({ name: 'data_nascimento', type: 'date', nullable: true })
  dataNascimento: Date | null;

  @Column({ name: 'email', type: 'varchar', nullable: true })
  email: string | null;

  @Column({ name: 'telefone', type: 'varchar', nullable: true })
  telefone: string | null;

  @Column({ name: 'status', type: 'varchar', nullable: true })
  status: string | null;

  // Endereço
  @Column({ name: 'cep', type: 'varchar', nullable: true })
  cep: string | null;

  @Column({ name: 'rua', type: 'varchar', nullable: true })
  rua: string | null;

  @Column({ name: 'numero', type: 'varchar', nullable: true })
  numero: string | null;

  @Column({ name: 'complemento', type: 'varchar', nullable: true })
  complemento: string | null;

  @Column({ name: 'bairro', type: 'varchar', nullable: true })
  bairro: string | null;

  @Column({ name: 'cidade', type: 'varchar', nullable: true })
  cidade: string | null;

  @Column({ name: 'estado', type: 'varchar', nullable: true })
  estado: string | null;

  // Informações clínicas
  @Column({ name: 'necessidades', type: 'jsonb', nullable: true })
  necessidades: string[] | null;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
