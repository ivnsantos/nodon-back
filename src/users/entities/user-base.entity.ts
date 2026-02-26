import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ClienteMaster } from './cliente-master.entity';
import { UserComum } from './user-comum.entity';

/**
 * Entidade base que representa todos os usuários cadastrados no sistema.
 * Contém informações pessoais, dados de endereço e CRO do dentista.
 */
@Entity('users')
export class UserBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  cpf: string;

  @Column({ nullable: true })
  telefone: string;

  @Column({ name: 'cro', nullable: true })
  cro: string; // CRO do dentista (se for dentista)

  // Dados de endereço
  @Column({ name: 'postal_code', nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'address_number', nullable: true })
  addressNumber: string;

  @Column({ nullable: true })
  complement: string;

  @Column({ nullable: true })
  province: string; // Bairro

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'verification_token', type: 'varchar', nullable: true })
  verificationToken: string | null;

  @Column({ name: 'token_expires_at', type: 'timestamp', nullable: true })
  tokenExpiresAt: Date | null;

  @Column({ name: 'google_id', type: 'varchar', nullable: true, unique: true })
  googleId: string | null;

  @Column({ name: 'facebook_id', type: 'varchar', nullable: true, unique: true })
  facebookId: string | null;

  @Column({ name: 'foto', type: 'varchar', nullable: true })
  foto: string | null;

  @Column({ name: 'password_reset_token', type: 'varchar', nullable: true })
  passwordResetToken: string | null;

  @Column({ name: 'password_reset_expires_at', type: 'timestamp', nullable: true })
  passwordResetExpiresAt: Date | null;

  @Column({ name: 'pagar_me_customer_id', type: 'varchar', nullable: true })
  pagarMeCustomerId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relacionamentos
  @OneToMany(() => ClienteMaster, (clienteMaster) => clienteMaster.user)
  clientesMaster: ClienteMaster[];

  @OneToMany(() => UserComum, (userComum) => userComum.user)
  usuariosComuns: UserComum[];
}

