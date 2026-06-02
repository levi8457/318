import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('notifications')
@Index(['userId', 'isRead'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 50 })
  type: 'task_reminder' | 'overdue_alert' | 'system' | 'customer_update';

  @Column({ length: 200 })
  title: string;

  @Column('text')
  content: string;

  @Column({ name: 'related_type', nullable: true, length: 50 })
  relatedType: string;

  @Column({ name: 'related_id', nullable: true })
  relatedId: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', nullable: true })
  readAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
