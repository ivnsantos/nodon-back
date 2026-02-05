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
import { Anamnese } from './anamnese.entity';
import { RespostaPergunta } from './resposta-pergunta.entity';

/**
 * Tipos de resposta possíveis para uma pergunta
 */
export enum TipoResposta {
  TEXTO = 'texto',
  NUMERO = 'numero',
  BOOLEANO = 'booleano',
  MULTIPLA_ESCOLHA = 'multipla_escolha',
  DATA = 'data',
}

/**
 * Entidade que representa uma pergunta dentro de uma anamnese.
 * Cada pergunta pertence a uma anamnese e pode ter várias respostas.
 */
@Entity('perguntas_anamnese')
export class PerguntaAnamnese {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'anamnese_id', type: 'uuid' })
  anamneseId: string;

  @ManyToOne(() => Anamnese, (anamnese) => anamnese.perguntas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'anamnese_id' })
  anamnese: Anamnese;

  @Column({ name: 'texto', type: 'text' })
  texto: string;

  @Column({
    name: 'tipo_resposta',
    type: 'enum',
    enum: TipoResposta,
    default: TipoResposta.TEXTO,
  })
  tipoResposta: TipoResposta;

  @Column({ name: 'opcoes', type: 'jsonb', nullable: true })
  opcoes: string[] | null; // Para múltipla escolha

  @Column({ name: 'obrigatoria', type: 'boolean', default: false })
  obrigatoria: boolean;

  @Column({ name: 'ordem', type: 'integer', default: 0 })
  ordem: number;

  @OneToMany(() => RespostaPergunta, (resposta) => resposta.pergunta)
  respostas: RespostaPergunta[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

