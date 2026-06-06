import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { CustomerProfile } from '../../customer/entities/customer.entity';
import { ConsultationSession } from '../../session/entities/session.entity';

@Entity('follow_up_plans')
export class FollowUpPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @ManyToOne(() => ConsultationSession, { nullable: true })
  @JoinColumn({ name: 'session_id' })
  session: ConsultationSession;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => CustomerProfile)
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerProfile;

  @Column({ name: 'consultant_id' })
  consultantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;

  @Column({ default: 'draft', length: 20 })
  status: 'draft' | 'confirmed' | 'executing' | 'completed' | 'cancelled';

  @Column('text', { name: 'ai_summary', nullable: true })
  aiSummary: string;

  @Column('jsonb', { name: 'ai_strategy', default: '{}' })
  aiStrategy: Record<string, any>;

  @Column('text', { name: 'consultant_notes', nullable: true })
  consultantNotes: string;

  @Column('jsonb', { name: 'talking_points', default: '[]' })
  talkingPoints: string[];

  @Column({ name: 'best_follow_up_time', nullable: true })
  bestFollowUpTime: string;

  @Column('jsonb', { name: 'blockers', default: '[]' })
  blockers: Array<{ type: string; detail: string; response: string }>;

  @Column('jsonb', { name: 'follow_up_records', default: '[]' })
  followUpRecords: Array<{
    contactedAt: string;
    method: string;
    result: string;
    notes: string;
    nextFollowUpDate?: string;
  }>;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
