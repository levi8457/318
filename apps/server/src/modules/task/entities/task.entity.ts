import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { CustomerProfile } from '../../customer/entities/customer.entity';

@Entity('task_reminders')
export class TaskReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'consultant_id' })
  consultantId: string;

  @Column({ name: 'project_id', nullable: true })
  projectId: string;

  @Column({ name: 'task_type', length: 20 })
  taskType: 'follow_up' | 'recheck' | 'care' | 'promotion';

  @Column({ length: 255 })
  title: string;

  @Column('text', { default: '' })
  description: string;

  @Column({ name: 'trigger_date' })
  triggerDate: Date;

  @Column({ name: 'trigger_rule', nullable: true })
  triggerRule: string;

  @Column({ default: 'pending', length: 20 })
  status: 'pending' | 'completed' | 'cancelled' | 'overdue';

  @Column({ default: 'medium', length: 10 })
  priority: 'low' | 'medium' | 'high';

  @Column({ name: 'care_message', nullable: true })
  careMessage: string;

  @Column({ default: 'system', length: 20 })
  channel: 'system' | 'wecom' | 'sms';

  @Column({ name: 'reminder_sent', default: false })
  reminderSent: boolean;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  result: string;

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
