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
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { RespostaPerguntaQuestionario } from './resposta-pergunta-questionario.entity';

/**
 * Entidade que representa uma resposta de questionário.
 * Pode estar vinculada a um paciente ou ser uma resposta pública/anônima.
 * Quando o cliente_master envia um questionário, cria-se um registro aqui.
 * Este registro contém as respostas para todas as perguntas do questionário.
 */
@Entity('respostas_questionario')
export class RespostaQuestionario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'questionario_id', type: 'uuid' })
  questionarioId: string;

  @ManyToOne(() => Questionario, (questionario) => questionario.respostas)
  @JoinColumn({ name: 'questionario_id' })
  questionario: Questionario;

  @Column({ name: 'paciente_id', type: 'uuid', nullable: true })
  pacienteId: string | null;

  @ManyToOne(() => Paciente, { nullable: true })
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente | null;

  @Column({ name: 'concluida', type: 'boolean', default: false })
  concluida: boolean;

  @Column({ name: 'enviada', type: 'boolean', default: false })
  enviada: boolean; // Indica se o questionário foi enviado para o paciente

  @OneToMany(() => RespostaPerguntaQuestionario, (resposta) => resposta.respostaQuestionario, {
    cascade: true,
    eager: false,
  })
  respostasPerguntas: RespostaPerguntaQuestionario[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

