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
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { RespostaPergunta } from './resposta-pergunta.entity';

/**
 * Entidade que representa a vinculação de uma anamnese a um paciente.
 * Quando o cliente_master vincula uma anamnese a um paciente, cria-se um registro aqui.
 * Este registro contém as respostas do paciente para todas as perguntas da anamnese.
 */
@Entity('respostas_anamnese')
export class RespostaAnamnese {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'anamnese_id', type: 'uuid' })
  anamneseId: string;

  @ManyToOne(() => Anamnese, (anamnese) => anamnese.respostas)
  @JoinColumn({ name: 'anamnese_id' })
  anamnese: Anamnese;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @Column({ name: 'concluida', type: 'boolean', default: false })
  concluida: boolean;

  @Column({ name: 'ativa', type: 'boolean', default: false })
  ativa: boolean; // Indica se esta anamnese está ativa para o paciente

  @OneToMany(() => RespostaPergunta, (resposta) => resposta.respostaAnamnese, {
    cascade: true,
    eager: false,
  })
  respostasPerguntas: RespostaPergunta[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

