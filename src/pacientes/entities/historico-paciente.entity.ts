import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Paciente } from './paciente.entity';
import { UserBase } from '../../users/entities/user-base.entity';
import { ClienteMaster } from '../../users/entities/cliente-master.entity';

@Entity('historico_pacientes')
export class HistoricoPaciente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'paciente_id' })
  pacienteId: string;

  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @ManyToOne(() => UserBase, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: UserBase | null;

  @Column({ name: 'cliente_master_id', nullable: true })
  clienteMasterId: string | null;

  @ManyToOne(() => ClienteMaster, { nullable: true })
  @JoinColumn({ name: 'cliente_master_id' })
  clienteMaster: ClienteMaster | null;

  @Column({ name: 'campo_alterado' })
  campoAlterado: string; // Nome do campo que foi alterado (ex: "nomePaciente", "status", "email")

  @Column({ name: 'valor_anterior', type: 'text', nullable: true })
  valorAnterior: string | null;

  @Column({ name: 'valor_novo', type: 'text', nullable: true })
  valorNovo: string | null;

  @Column({ name: 'descricao_alteracao', type: 'text', nullable: true })
  descricaoAlteracao: string | null; // Descrição amigável da alteração (ex: "Status alterado para Em Andamento")

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
