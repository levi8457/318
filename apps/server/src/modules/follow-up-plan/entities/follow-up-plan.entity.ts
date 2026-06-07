import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { CustomerProfile } from '../../customer/entities/customer.entity';
import { ConsultationSession } from '../../session/entities/session.entity';

/**
 * 跟进计划实体
 * 
 * 设计逻辑：
 * - 一个会话对应一个跟进计划
 * - 一个跟进计划包含多个项目策略（projectStrategies）
 * - 每个项目策略包含多个跟进步骤（strategies）
 * - 每个跟进步骤有独立的执行时间
 * - 确认后自动创建任务到咨询师任务列表
 */
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

  /**
   * 项目策略列表（核心字段）
   * JSON 结构：
   * [
   *   {
   *     projectId: "热玛吉",
   *     projectType: "抗衰",
   *     strategies: [
   *       {
   *         id: "uuid",
   *         title: "发送怕疼客户案例",
   *         talkingPoint: "话术内容...",
   *         executeAt: "2026-06-07T10:00:00Z",
   *         status: "pending",
   *         taskId: "关联的任务ID"
   *       }
   *     ]
   *   }
   * ]
   */
  @Column('jsonb', { name: 'project_strategies', default: '[]' })
  projectStrategies: ProjectStrategy[];

  @Column('text', { name: 'consultant_notes', nullable: true })
  consultantNotes: string;

  @Column('jsonb', { name: 'blockers', default: '[]' })
  blockers: Array<{ type: string; detail: string; response: string }>;

  @Column('jsonb', { name: 'follow_up_records', default: '[]' })
  followUpRecords: Array<{
    strategyId: string;
    contactedAt: string;
    method: string;
    result: string;
    notes: string;
  }>;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export interface ProjectStrategy {
  projectId: string;
  projectType: string;
  strategies: FollowUpStrategyItem[];
}

export interface FollowUpStrategyItem {
  id: string;
  title: string;
  talkingPoint: string;
  executeAt: string;
  status: 'pending' | 'executing' | 'completed' | 'cancelled';
  taskId?: string;
}
