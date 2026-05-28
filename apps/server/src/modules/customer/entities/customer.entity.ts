import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('customer_profiles')
export class CustomerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ name: 'consultant_id' })
  consultantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consultant_id' })
  consultant: User;

  @Column({ name: 'budget_sensitivity', default: 'medium', length: 10 })
  budgetSensitivity: 'high' | 'medium' | 'low';

  @Column({ length: 100, nullable: true })
  source: string;

  @Column({ default: 'active', length: 20 })
  status: 'active' | 'inactive' | 'lost';

  @Column({ name: 'last_contact_at', nullable: true })
  lastContactAt: Date;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ length: 100 })
  category: string;

  @Column({ length: 255 })
  value: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => CustomerProfile)
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerProfile;
}

@Entity('preferences')
export class Preference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ length: 100 })
  category: string;

  @Column('text')
  content: string;

  @Column({ default: 'normal', length: 20 })
  importance: 'normal' | 'important' | 'critical';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => CustomerProfile)
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerProfile;
}

@Entity('project_timelines')
export class ProjectTimeline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'project_name', length: 200 })
  projectName: string;

  @Column({ name: 'project_type', length: 100, nullable: true })
  projectType: string;

  @Column()
  date: Date;

  @Column({ default: 'planned', length: 20 })
  status: 'planned' | 'in_progress' | 'completed' | 'follow_up';

  @Column({ nullable: true })
  notes: string;

  @Column({ name: 'consultant_id' })
  consultantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => CustomerProfile)
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerProfile;
}
