import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserBase } from './user-base.entity';
import { ClienteMaster } from './cliente-master.entity';

/**
 * Representa um usuário comum associado a um Cliente Master.
 * Um User pode ter múltiplos UserComum (diferentes acessos como usuário comum).
 */
@Entity('usuarios')
export class UserComum {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserBase, (user) => user.usuariosComuns)
  @JoinColumn({ name: 'user_id' })
  user: UserBase;

  @Column({ name: 'cliente_master_id' })
  clienteMasterId: string;

  @ManyToOne(() => ClienteMaster, (clienteMaster) => clienteMaster.usuarios)
  @JoinColumn({ name: 'cliente_master_id' })
  clienteMaster: ClienteMaster;

  @Column({ default: true })
  ativo: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'ativo',
  })
  status: 'ativo' | 'inativo';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

