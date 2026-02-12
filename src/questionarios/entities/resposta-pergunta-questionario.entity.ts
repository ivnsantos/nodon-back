import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PerguntaQuestionario } from './pergunta-questionario.entity';
import { RespostaQuestionario } from './resposta-questionario.entity';

/**
 * Entidade que representa a resposta de uma pergunta específica dentro de um questionário.
 * Cada registro aqui é uma resposta individual de uma pergunta.
 */
@Entity('respostas_pergunta_questionario')
export class RespostaPerguntaQuestionario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'resposta_questionario_id', type: 'uuid' })
  respostaQuestionarioId: string;

  @ManyToOne(() => RespostaQuestionario, (resposta) => resposta.respostasPerguntas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'resposta_questionario_id' })
  respostaQuestionario: RespostaQuestionario;

  @Column({ name: 'pergunta_id', type: 'uuid' })
  perguntaId: string;

  @ManyToOne(() => PerguntaQuestionario, (pergunta) => pergunta.respostas)
  @JoinColumn({ name: 'pergunta_id' })
  pergunta: PerguntaQuestionario;

  @Column({ name: 'valor', type: 'text', nullable: true })
  valor: string | null; // Valor da resposta (pode ser texto, número, etc)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

