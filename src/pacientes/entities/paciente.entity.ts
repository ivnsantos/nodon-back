import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserBase } from '../../users/entities/user-base.entity';
import { ClienteMaster } from '../../users/entities/cliente-master.entity';

@Entity('pacientes')
export class Paciente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'dentist_id', nullable: true })
  dentistId: string | null;

  @ManyToOne(() => UserBase, { nullable: true })
  @JoinColumn({ name: 'dentist_id' })
  dentist: UserBase | null;

  @Column({ name: 'master_client_id' })
  masterClientId: string;

  @ManyToOne(() => ClienteMaster)
  @JoinColumn({ name: 'master_client_id' })
  masterClient: ClienteMaster;

  // Dados pessoais
  @Column({ name: 'nome_paciente' })
  nomePaciente: string;

  @Column({ nullable: true })
  cpf: string;

  @Column({ name: 'data_nascimento', type: 'date', nullable: true })
  dataNascimento: Date | null;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  telefone: string;

  @Column({ default: 'ativo' })
  status: string;

  // Endereço
  @Column({ name: 'cep', nullable: true })
  cep: string;

  @Column({ name: 'rua', nullable: true })
  rua: string;

  @Column({ name: 'numero', nullable: true })
  numero: string;

  @Column({ name: 'complemento', nullable: true })
  complemento: string;

  @Column({ name: 'bairro', nullable: true })
  bairro: string;

  @Column({ name: 'cidade', nullable: true })
  cidade: string;

  @Column({ name: 'estado', nullable: true })
  estado: string;

  // Informações clínicas
  @Column({ name: 'necessidades', type: 'text', nullable: true })
  necessidades: string | null;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
