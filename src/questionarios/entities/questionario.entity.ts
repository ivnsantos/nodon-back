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
import { ClienteMaster } from '../../users/entities/cliente-master.entity';
import { PerguntaQuestionario } from './pergunta-questionario.entity';
import { RespostaQuestionario } from './resposta-questionario.entity';

/**
 * Entidade que representa um questionário de feedback.
 * Um ClienteMaster pode ter vários questionários cadastrados.
 * Cada questionário contém várias perguntas.
 */
@Entity('questionarios')
export class Questionario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_master_id', type: 'uuid' })
  clienteMasterId: string;

  @ManyToOne(() => ClienteMaster)
  @JoinColumn({ name: 'cliente_master_id' })
  clienteMaster: ClienteMaster;

  @Column({ name: 'titulo', type: 'varchar', length: 255 })
  titulo: string;

  @Column({ name: 'descricao', type: 'text', nullable: true })
  descricao: string | null;

  @Column({ name: 'ativa', type: 'boolean', default: true })
  ativa: boolean;

  @OneToMany(() => PerguntaQuestionario, (pergunta) => pergunta.questionario, {
    cascade: true,
    eager: false,
  })
  perguntas: PerguntaQuestionario[];

  @OneToMany(() => RespostaQuestionario, (resposta) => resposta.questionario)
  respostas: RespostaQuestionario[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

