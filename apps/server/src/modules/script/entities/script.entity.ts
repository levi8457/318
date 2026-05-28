import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('golden_scripts')
export class GoldenScript {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  category: string;

  @Column({ length: 255 })
  scenario: string;

  @Column('text')
  script: string;

  @Column({ name: 'conversion_rate', type: 'float', default: 0 })
  conversionRate: number;

  @Column({ name: 'usage_count', default: 0 })
  usageCount: number;

  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  @Column({ name: 'source_session_id', nullable: true })
  sourceSessionId: string;

  @Column({ name: 'is_approved', default: false })
  isApproved: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
