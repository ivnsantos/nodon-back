import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('planos')
export class Plano {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column('decimal', { precision: 10, scale: 2 })
  valorOriginal: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  valorPromocional: number;

  @Column()
  limiteAnalises: number;

  @Column({ name: 'token_chat', type: 'bigint', default: 1500000 })
  tokenChat: number;

  @Column({ default: true })
  ativo: boolean;

  @Column({ nullable: true })
  descricao: string;

  @Column({ nullable: true, default: 'all' })
  acesso: string; // 'all' ou 'calendario,chat' (separado por vírgula)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

