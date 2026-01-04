import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClienteMaster } from './cliente-master.entity';

export enum UserType {
  MASTER = 'master',
  ADMIN = 'admin',
  USER = 'usuario',
}

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'varchar',
    default: UserType.USER,
  })
  tipo: UserType;

  @Column({ name: 'cliente_master_id', nullable: true })
  clienteMasterId: string;

  @ManyToOne(() => ClienteMaster, (clienteMaster) => clienteMaster.usuarios, {
    nullable: true,
  })
  @JoinColumn({ name: 'cliente_master_id' })
  clienteMaster: ClienteMaster;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

