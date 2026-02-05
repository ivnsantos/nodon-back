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
import { PerguntaAnamnese } from './pergunta-anamnese.entity';
import { RespostaAnamnese } from './resposta-anamnese.entity';

/**
 * Entidade que representa uma anamnese odontológica.
 * Um ClienteMaster pode ter várias anamneses cadastradas.
 * Cada anamnese contém várias perguntas.
 */
@Entity('anamneses')
export class Anamnese {
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

  @OneToMany(() => PerguntaAnamnese, (pergunta) => pergunta.anamnese, {
    cascade: true,
    eager: false,
  })
  perguntas: PerguntaAnamnese[];

  @OneToMany(() => RespostaAnamnese, (resposta) => resposta.anamnese)
  respostas: RespostaAnamnese[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

