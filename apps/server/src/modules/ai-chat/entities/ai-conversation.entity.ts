import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('ai_conversations')
@Index(['userId', 'sessionId'])
export class AiConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @Column({ length: 20 })
  role: 'user' | 'assistant' | 'system';

  @Column('text')
  content: string;

  @Column({ name: 'context_type', nullable: true, length: 50 })
  contextType: string;

  @Column('jsonb', { name: 'metadata', default: '{}' })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
