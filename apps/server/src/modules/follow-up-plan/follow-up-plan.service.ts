import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowUpPlan, ProjectStrategy } from './entities/follow-up-plan.entity';
import { NotificationService } from '../notification/notification.service';
import { TaskReminder } from '../task/entities/task.entity';
import { User } from '../auth/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class FollowUpPlanService {
  private readonly logger = new Logger(FollowUpPlanService.name);

  constructor(
    @InjectRepository(FollowUpPlan)
    private planRepo: Repository<FollowUpPlan>,
    @InjectRepository(TaskReminder)
    private taskRepo: Repository<TaskReminder>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  /** 获取策略列表 */
  async findAll(userRole: string, userId: string, query?: { status?: string; customerId?: string }) {
    const qb = this.planRepo.createQueryBuilder('plan');
    qb.leftJoinAndSelect('plan.customer', 'customer');
    qb.leftJoinAndSelect('plan.consultant', 'consultant');

    if (userRole === 'consultant') {
      qb.where('plan.consultant_id = :userId', { userId });
    }

    if (query?.status) {
      qb.andWhere('plan.status = :status', { status: query.status });
    }

    if (query?.customerId) {
      qb.andWhere('plan.customer_id = :customerId', { customerId: query.customerId });
    }

    qb.orderBy('plan.createdAt', 'DESC');
    return qb.getMany();
  }

  /** 获取策略详情 */
  async findOne(id: string, userRole: string, userId: string) {
    const plan = await this.planRepo.findOne({
      where: { id },
      relations: ['customer', 'consultant'],
    });

    if (!plan) throw new NotFoundException('跟进策略不存在');
    if (userRole === 'consultant' && plan.consultantId !== userId) {
      throw new ForbiddenException('无权访问此策略');
    }

    return plan;
  }

  /** 从会话 AI 分析结果创建策略草稿 */
  async createFromSession(session: any, projectStrategies?: ProjectStrategy[]): Promise<FollowUpPlan> {
    // 如果没有传入项目策略，尝试从 session 中获取
    const strategies = projectStrategies || session.followUpStrategy || [];

    const plan = await this.planRepo.save({
      sessionId: session.id,
      customerId: session.customerId,
      consultantId: session.consultantId,
      status: 'draft',
      aiSummary: session.summary || '',
      projectStrategies: strategies,
      blockers: (session.blockers || []).map((b: any) => ({
        type: b.type,
        detail: b.detail,
        response: b.suggestedResponse,
      })),
    });

    // 通知咨询师有新策略草稿需要确认
    await this.notificationService.create({
      userId: session.consultantId,
      type: 'task_reminder',
      title: '新跟进策略待确认',
      content: `客户 ${session.customer?.name || ''} 的面诊分析已完成，AI 已生成 ${strategies.length} 个项目的跟进策略，请查看并确认。`,
      relatedType: 'follow_up_plan',
      relatedId: plan.id,
    });

    this.logger.log(`[FollowUpPlan] 从会话 ${session.id} 创建策略草稿 ${plan.id}，包含 ${strategies.length} 个项目`);
    return plan;
  }

  /** 咨询师确认策略 */
  async confirm(id: string, userId: string, data?: {
    consultantNotes?: string;
    projectStrategies?: ProjectStrategy[];
  }) {
    const plan = await this.findOne(id, 'consultant', userId);

    if (plan.status !== 'draft') {
      throw new ForbiddenException('只能确认草稿状态的策略');
    }

    plan.status = 'confirmed';
    if (data?.consultantNotes) plan.consultantNotes = data.consultantNotes;
    if (data?.projectStrategies) plan.projectStrategies = data.projectStrategies;

    await this.planRepo.save(plan);

    // 自动生成任务到咨询师任务列表
    await this.createTasksFromPlan(plan);

    // 通知咨询师策略已确认
    const totalStrategies = plan.projectStrategies.reduce((sum, ps) => sum + ps.strategies.length, 0);
    await this.notificationService.create({
      userId: userId,
      type: 'task_reminder',
      title: '跟进策略已确认',
      content: `客户 ${plan.customer?.name || ''} 的跟进策略已确认，已生成 ${totalStrategies} 个跟进任务。`,
      relatedType: 'follow_up_plan',
      relatedId: id,
    });

    this.logger.log(`[FollowUpPlan] 策略 ${id} 已确认，已生成任务`);
    return plan;
  }

  /** 从策略计划创建任务 */
  private async createTasksFromPlan(plan: FollowUpPlan) {
    const customer = await this.planRepo.manager.findOne('CustomerProfile', {
      where: { id: plan.customerId },
    });

    for (const projectStrategy of plan.projectStrategies) {
      for (const strategy of projectStrategy.strategies) {
        if (strategy.status === 'cancelled') continue;

        const task = await this.taskRepo.save({
          customerId: plan.customerId,
          consultantId: plan.consultantId,
          taskType: 'follow_up',
          title: `[${projectStrategy.projectId}] ${strategy.title}`,
          description: strategy.talkingPoint,
          triggerDate: new Date(strategy.executeAt),
          priority: 'medium',
          careMessage: strategy.talkingPoint,
          status: 'pending',
        });

        // 更新策略中的任务ID
        strategy.taskId = task.id;
        strategy.status = 'pending';

        this.logger.log(`[FollowUpPlan] 创建任务: ${task.title}`);
      }
    }

    // 更新计划中的任务ID
    await this.planRepo.save(plan);
  }

  /** 咨询师编辑策略 */
  async update(id: string, userId: string, data: {
    consultantNotes?: string;
    projectStrategies?: ProjectStrategy[];
  }) {
    const plan = await this.findOne(id, 'consultant', userId);

    if (plan.status === 'completed' || plan.status === 'cancelled') {
      throw new ForbiddenException('已完成或已取消的策略不可编辑');
    }

    if (data.consultantNotes !== undefined) plan.consultantNotes = data.consultantNotes;
    if (data.projectStrategies) plan.projectStrategies = data.projectStrategies;

    await this.planRepo.save(plan);
    this.logger.log(`[FollowUpPlan] 策略 ${id} 已更新`);
    return plan;
  }

  /** 更新单个策略状态 */
  async updateStrategyStatus(planId: string, strategyId: string, userId: string, status: string) {
    const plan = await this.findOne(planId, 'consultant', userId);

    for (const ps of plan.projectStrategies) {
      const strategy = ps.strategies.find(s => s.id === strategyId);
      if (strategy) {
        strategy.status = status as any;

        // 如果有关联的任务，同步更新任务状态
        if (strategy.taskId) {
          const taskUpdate: any = { status };
          if (status === 'completed') {
            taskUpdate.completedAt = new Date();
          }
          await this.taskRepo.update(strategy.taskId, taskUpdate);
        }

        break;
      }
    }

    await this.planRepo.save(plan);
    return plan;
  }

  /** 完成策略 */
  async complete(id: string, userId: string) {
    const plan = await this.findOne(id, 'consultant', userId);

    if (plan.status === 'completed' || plan.status === 'cancelled') {
      throw new ForbiddenException('策略已完成或已取消');
    }

    plan.status = 'completed';
    plan.completedAt = new Date();
    await this.planRepo.save(plan);

    // 通知管理员
    const admins = await this.userRepo.find({ where: { role: 'admin' } });
    for (const admin of admins) {
      await this.notificationService.create({
        userId: admin.id,
        type: 'customer_update',
        title: '跟进策略已完成',
        content: `咨询师 ${plan.consultant?.realName || ''} 完成了客户 ${plan.customer?.name || ''} 的跟进策略。`,
        relatedType: 'follow_up_plan',
        relatedId: id,
      });
    }

    this.logger.log(`[FollowUpPlan] 策略 ${id} 已完成`);
    return plan;
  }

  /** 取消策略 */
  async cancel(id: string, userId: string) {
    const plan = await this.findOne(id, 'consultant', userId);

    if (plan.status === 'completed') {
      throw new ForbiddenException('已完成的策略不可取消');
    }

    plan.status = 'cancelled';
    await this.planRepo.save(plan);
    this.logger.log(`[FollowUpPlan] 策略 ${id} 已取消`);
    return plan;
  }

  /** 获取策略统计 */
  async getStats(userRole: string, userId: string) {
    const qb = this.planRepo.createQueryBuilder('plan');

    if (userRole === 'consultant') {
      qb.where('plan.consultant_id = :userId', { userId });
    }

    const total = await qb.getCount();
    const draft = await qb.clone().andWhere('plan.status = :s', { s: 'draft' }).getCount();
    const confirmed = await qb.clone().andWhere('plan.status = :s', { s: 'confirmed' }).getCount();
    const executing = await qb.clone().andWhere('plan.status = :s', { s: 'executing' }).getCount();
    const completed = await qb.clone().andWhere('plan.status = :s', { s: 'completed' }).getCount();

    return { total, draft, confirmed, executing, completed };
  }

  /** 获取客户的所有策略 */
  async findByCustomer(customerId: string, userRole: string, userId: string) {
    return this.findAll(userRole, userId, { customerId });
  }

  /** 添加跟进记录 */
  async addFollowUpRecord(id: string, userId: string, record: {
    method: string;
    result: string;
    notes: string;
    nextFollowUpDate?: string;
  }) {
    const plan = await this.findOne(id, 'consultant', userId);

    if (plan.status === 'completed' || plan.status === 'cancelled') {
      throw new ForbiddenException('已完成或已取消的策略不可添加跟进记录');
    }

    // 更新状态为执行中
    if (plan.status === 'confirmed') {
      plan.status = 'executing';
    }

    plan.followUpRecords = [
      ...plan.followUpRecords,
      {
        strategyId: '',
        contactedAt: new Date().toISOString(),
        method: record.method,
        result: record.result,
        notes: record.notes,
      },
    ];

    await this.planRepo.save(plan);

    // 如果设置了下次跟进时间，创建提醒通知
    if (record.nextFollowUpDate) {
      await this.notificationService.create({
        userId: userId,
        type: 'task_reminder',
        title: '跟进提醒已设置',
        content: `客户 ${plan.customer?.name || ''} 的下次跟进时间：${new Date(record.nextFollowUpDate).toLocaleDateString()}`,
        relatedType: 'follow_up_plan',
        relatedId: id,
      });
    }

    this.logger.log(`[FollowUpPlan] 策略 ${id} 添加跟进记录`);
    return plan;
  }

  /** 检查今日跟进提醒 */
  async checkTodayReminders() {
    this.logger.log('[FollowUpPlan] 检查今日跟进提醒');
    // 实际实现会查询今天需要跟进的策略
    return { message: '今日跟进提醒检查完成' };
  }

  /** 检查逾期策略 */
  async checkOverdueStrategies() {
    this.logger.log('[FollowUpPlan] 检查逾期策略');
    // 实际实现会查询逾期未跟进的策略
    return { message: '逾期策略检查完成' };
  }
}
