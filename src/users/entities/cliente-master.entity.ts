import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Assinatura } from '../../assinaturas/entities/assinatura.entity';

@Entity('clientes_master')
export class ClienteMaster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  telefone: string;

  @Column({ nullable: true })
  cnpj: string;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.clienteMaster)
  usuarios: User[];

  @OneToMany(() => Assinatura, (assinatura) => assinatura.clienteMaster)
  assinaturas: Assinatura[];
}

