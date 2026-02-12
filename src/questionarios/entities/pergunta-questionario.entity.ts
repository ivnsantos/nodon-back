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
import { Questionario } from './questionario.entity';
import { RespostaPerguntaQuestionario } from './resposta-pergunta-questionario.entity';

/**
 * Tipos de resposta possíveis para uma pergunta de questionário
 */
export enum TipoRespostaQuestionario {
  TEXTO = 'texto',
  NUMERO = 'numero',
  BOOLEANO = 'booleano',
  MULTIPLA_ESCOLHA = 'multipla_escolha',
  DATA = 'data',
  ESCALA = 'escala', // Escala de 1 a 5, 1 a 10, etc
}

/**
 * Entidade que representa uma pergunta dentro de um questionário.
 * Cada pergunta pertence a um questionário e pode ter várias respostas.
 */
@Entity('perguntas_questionario')
export class PerguntaQuestionario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'questionario_id', type: 'uuid' })
  questionarioId: string;

  @ManyToOne(() => Questionario, (questionario) => questionario.perguntas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'questionario_id' })
  questionario: Questionario;

  @Column({ name: 'texto', type: 'text' })
  texto: string;

  @Column({
    name: 'tipo_resposta',
    type: 'enum',
    enum: TipoRespostaQuestionario,
    default: TipoRespostaQuestionario.TEXTO,
  })
  tipoResposta: TipoRespostaQuestionario;

  @Column({ name: 'opcoes', type: 'jsonb', nullable: true })
  opcoes: string[] | null; // Para múltipla escolha

  @Column({ name: 'obrigatoria', type: 'boolean', default: false })
  obrigatoria: boolean;

  @Column({ name: 'ordem', type: 'integer', default: 0 })
  ordem: number;

  @OneToMany(() => RespostaPerguntaQuestionario, (resposta) => resposta.pergunta)
  respostas: RespostaPerguntaQuestionario[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

