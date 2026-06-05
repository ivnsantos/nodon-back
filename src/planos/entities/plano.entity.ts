import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('planos')
export class Plano {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nome', type: 'varchar', nullable: false })
  nome: string;

  @Column({ name: 'valor_original', type: 'decimal', nullable: true })
  valorOriginal: number;

  @Column({ name: 'valor_promocional', type: 'decimal', precision: 10, scale: 2, nullable: true })
  valorPromocional: number;

  @Column({ name: 'limite_analises', nullable: true })
  limiteAnalises: number;

  @Column({ name: 'token_chat', type: 'bigint', default: 1500000 })
  tokenChat: number;

  @Column({ name: 'ativo', type: 'boolean', default: true })
  ativo: boolean;

  @Column({ name: 'descricao', type: 'varchar', nullable: true })
  descricao: string;

  /** Intervalo de cobrança em meses: 1 = mensal, 3 = trimestral */
  @Column({ name: 'ciclo', type: 'int', default: 1 })
  ciclo: number;

  // Temporariamente comentado até a coluna ser criada no banco
  // @Column({ name: 'acesso', type: 'varchar', nullable: true, default: 'all' })
  // acesso: string; // 'all' ou 'calendario,chat' (separado por vírgula)
  
  // Propriedade virtual para compatibilidade
  acesso?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

