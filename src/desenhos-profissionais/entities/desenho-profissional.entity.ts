import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClienteMaster } from '../../users/entities/cliente-master.entity';
import { Radiografia } from '../../radiografias/entities/radiografia.entity';

@Entity('desenhos_profissionais')
export class DesenhoProfissional {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'master_client_id', type: 'uuid' })
  masterClientId: string;

  @ManyToOne(() => ClienteMaster)
  @JoinColumn({ name: 'master_client_id' })
  masterClient: ClienteMaster;

  @Column({ name: 'radiografia_id', type: 'uuid', nullable: true })
  radiografiaId: string | null;

  @ManyToOne(() => Radiografia, { nullable: true })
  @JoinColumn({ name: 'radiografia_id' })
  radiografia: Radiografia | null;

  @Column({ name: 'titulo_desenho', type: 'varchar' })
  tituloDesenho: string;

  @Column({ name: 'imagem_desenhada', type: 'jsonb' })
  imagemDesenhada: { url: string };

  @Column({ name: 'dentes_anotacoes', type: 'jsonb' })
  dentesAnotacoes: Array<{ dente: string; descricao: string }>;

  @Column({ type: 'jsonb' })
  necessidades: Array<{ procedimento: string; anotacoes: string }>;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
