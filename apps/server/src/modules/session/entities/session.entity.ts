import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { CustomerProfile } from '../../customer/entities/customer.entity';

@Entity('consultation_sessions')
export class ConsultationSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'consultant_id' })
  consultantId: string;

  @Column({ name: 'audio_url', nullable: true })
  audioUrl: string;

  @Column('text', { default: '' })
  transcript: string;

  @Column('text', { default: '' })
  summary: string;

  @Column('jsonb', { name: 'key_points', default: '[]' })
  keyPoints: any[];

  @Column('jsonb', { default: '[]' })
  blockers: any[];

  @Column('text', { name: 'decision_makers', array: true, default: '{}' })
  decisionMakers: string[];

  @Column('jsonb', { name: 'follow_up_strategy', default: '{}' })
  followUpStrategy: any;

  @Column({ default: 'pending', length: 20 })
  status: 'pending' | 'transcribing' | 'completed' | 'failed';

  @Column('int', { default: 0 })
  duration: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @ManyToOne(() => CustomerProfile)
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerProfile;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;
}
