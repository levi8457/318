import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('marketing_campaigns')
export class MarketingCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 20 })
  type: 'upgrade' | 'promotion' | 'new_product' | 'anniversary';

  @Column('text', { default: '' })
  description: string;

  @Column({ name: 'target_product', length: 200 })
  targetProduct: string;

  @Column('text', { name: 'related_products', array: true, default: '{}' })
  relatedProducts: string[];

  @Column({ nullable: true, length: 100 })
  discount: string;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ name: 'end_date' })
  endDate: Date;

  @Column({ default: 'draft', length: 20 })
  status: 'draft' | 'active' | 'completed';

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}

@Entity('targeted_outreaches')
export class TargetedOutreach {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'campaign_id' })
  campaignId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'consultant_id' })
  consultantId: string;

  @Column({ name: 'matched_reason', nullable: true })
  matchedReason: string;

  @Column({ name: 'match_score', type: 'float', default: 0 })
  matchScore: number;

  @Column({ name: 'generated_message', nullable: true })
  generatedMessage: string;

  @Column({ default: 'pending', length: 20 })
  status: 'pending' | 'sent' | 'responded' | 'converted';

  @Column({ name: 'sent_at', nullable: true })
  sentAt: Date;

  @Column({ length: 20, default: 'system' })
  channel: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
