import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ai_knowledge_base')
export class AiKnowledgeBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  category: 'faq' | 'script' | 'strategy' | 'case' | 'preference';

  @Column({ length: 200 })
  title: string;

  @Column('text')
  content: string;

  @Column('text', { name: 'context', nullable: true })
  context: string;

  @Column({ name: 'usage_count', default: 0 })
  usageCount: number;

  @Column({ name: 'effectiveness_score', type: 'float', default: 0 })
  effectivenessScore: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
