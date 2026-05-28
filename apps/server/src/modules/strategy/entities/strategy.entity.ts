import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('follow_up_strategy_templates')
export class FollowUpStrategyTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100 })
  category: string;

  @Column('text', { name: 'applicable_project_types', array: true, default: '{}' })
  applicableProjectTypes: string[];

  @Column('text', { name: 'applicable_blocker_types', array: true, default: '{}' })
  applicableBlockerTypes: string[];

  @Column('jsonb', { default: '[]' })
  steps: any[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
