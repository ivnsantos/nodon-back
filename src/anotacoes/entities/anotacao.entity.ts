import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClienteMaster } from '../../users/entities/cliente-master.entity';
import { UserBase } from '../../users/entities/user-base.entity';

export enum CategoriaAnotacao {
  LEMBRETE = 'Lembrete',
  ESTUDO = 'Estudo',
  PACIENTE = 'Paciente',
  MATERIAL = 'Material',
  CURSO = 'Curso',
  PROTOCOLO = 'Protocolo',
  OUTRO = 'Outro',
}

/**
 * Entidade que representa uma anotação (post-it) do usuário
 */
@Entity('anotacoes')
export class Anotacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_master_id', type: 'uuid' })
  clienteMasterId: string;

  @ManyToOne(() => ClienteMaster)
  @JoinColumn({ name: 'cliente_master_id' })
  clienteMaster: ClienteMaster;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserBase)
  @JoinColumn({ name: 'user_id' })
  user: UserBase;

  @Column({ name: 'titulo', type: 'varchar', length: 255 })
  titulo: string;

  @Column({ name: 'conteudo', type: 'text' })
  conteudo: string;

  @Column({ name: 'conteudo_html', type: 'text' })
  conteudoHTML: string;

  @Column({
    name: 'categoria',
    type: 'varchar',
    length: 50,
    default: CategoriaAnotacao.LEMBRETE,
  })
  categoria: CategoriaAnotacao;

  @Column({ name: 'cor', type: 'varchar', length: 7, default: '#FFE082' })
  cor: string;

  @Column({ name: 'ativo', type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

