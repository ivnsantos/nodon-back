import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PerguntaAnamnese } from './pergunta-anamnese.entity';
import { RespostaAnamnese } from './resposta-anamnese.entity';

/**
 * Entidade que representa a resposta de um paciente para uma pergunta específica.
 * Cada resposta pertence a uma RespostaAnamnese e a uma PerguntaAnamnese.
 */
@Entity('respostas_pergunta')
export class RespostaPergunta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'resposta_anamnese_id', type: 'uuid' })
  respostaAnamneseId: string;

  @ManyToOne(() => RespostaAnamnese, (resposta) => resposta.respostasPerguntas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'resposta_anamnese_id' })
  respostaAnamnese: RespostaAnamnese;

  @Column({ name: 'pergunta_id', type: 'uuid' })
  perguntaId: string;

  @ManyToOne(() => PerguntaAnamnese, (pergunta) => pergunta.respostas)
  @JoinColumn({ name: 'pergunta_id' })
  pergunta: PerguntaAnamnese;

  @Column({ name: 'valor', type: 'text', nullable: true })
  valor: string | null; // Armazena a resposta como texto (pode ser JSON para múltipla escolha)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

