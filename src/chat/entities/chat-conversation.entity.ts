import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChatMessageEntity } from './chat-message.entity';

@Entity('chat_conversations')
export class ChatConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'cliente_master_id', type: 'uuid', nullable: true })
  clienteMasterId: string | null;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ name: 'total_tokens', type: 'int', default: 0 })
  totalTokens: number;

  @OneToMany(() => ChatMessageEntity, (message) => message.conversation)
  messages: ChatMessageEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
