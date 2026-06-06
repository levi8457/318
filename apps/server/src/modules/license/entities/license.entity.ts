import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('license')
export class License {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'professional', length: 20 })
  plan: 'basic' | 'professional' | 'enterprise';

  @Column({ name: 'max_consultants', default: 10 })
  maxConsultants: number;

  @Column({ name: 'is_trial', default: false })
  isTrial: boolean;

  @Column({ name: 'trial_ends_at', nullable: true })
  trialEndsAt: Date;

  @Column({ name: 'subscription_starts_at', nullable: true })
  subscriptionStartsAt: Date;

  @Column({ name: 'subscription_ends_at', nullable: true })
  subscriptionEndsAt: Date;

  @Column({ name: 'billing_cycle', default: 'monthly', length: 20 })
  billingCycle: 'monthly' | 'yearly';

  @Column({ default: 'active', length: 20 })
  status: 'active' | 'expired' | 'suspended' | 'trial';

  @Column({ name: 'features_enabled', type: 'jsonb', default: '{}' })
  featuresEnabled: Record<string, boolean>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
