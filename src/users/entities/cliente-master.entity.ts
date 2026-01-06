import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserBase } from './user-base.entity';
import { UserComum } from './user-comum.entity';
import { Assinatura } from '../../assinaturas/entities/assinatura.entity';

/**
 * Representa um Cliente Master (empresa/cliente que pode ter assinatura).
 * Um User pode ter múltiplos ClienteMaster (diferentes empresas/contextos).
 * Contém informações da empresa: logo, cor, nome da empresa, CNPJ, etc.
 */
@Entity('clientes_master')
export class ClienteMaster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserBase, (user) => user.clientesMaster)
  @JoinColumn({ name: 'user_id' })
  user: UserBase;

  @Column({ name: 'nome_empresa', default: 'Empresa' })
  nomeEmpresa: string; // Nome da empresa/clínica

  @Column({ nullable: true })
  cnpj: string;

  @Column({ nullable: true })
  logo: string; // URL ou caminho do logo

  @Column({ nullable: true })
  cor: string; // Cor principal da empresa (hexadecimal ou nome)

  @Column({ name: 'telefone_empresa', nullable: true })
  telefoneEmpresa: string; // Telefone da empresa (pode ser diferente do telefone pessoal)

  @Column({ name: 'site', nullable: true })
  site: string; // Site da empresa

  @Column({ name: 'descricao', type: 'text', nullable: true })
  descricao: string; // Descrição da empresa

  @Column({ name: 'outras_informacoes', type: 'text', nullable: true })
  outrasInformacoes: string; // Outras informações da empresa (JSON ou texto)

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UserComum, (userComum) => userComum.clienteMaster)
  usuarios: UserComum[];

  @OneToMany(() => Assinatura, (assinatura) => assinatura.clienteMaster)
  assinaturas: Assinatura[];
}

