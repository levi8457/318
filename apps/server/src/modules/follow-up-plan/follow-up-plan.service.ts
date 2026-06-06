import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { FollowUpPlan } from './entities/follow-up-plan.entity';
import { NotificationService } from '../notification/notification.service';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class FollowUpPlanService {
  private readonly logger = new Logger(FollowUpPlanService.name);

  constructor(
    @InjectRepository(FollowUpPlan)
    private planRepo: Repository<FollowUpPlan>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  /** 获取策略列表 */
  async findAll(userRole: string, userId: string, query?: { status?: string; customerId?: string }) {
    const qb = this.planRepo.createQueryBuilder('plan');
    qb.leftJoinAndSelect('plan.customer', 'customer');
    qb.leftJoinAndSelect('plan.consultant', 'consultant');
    qb.leftJoinAndSelect('plan.session', 'session');

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
      relations: ['customer', 'consultant', 'session'],
    });

    if (!plan) throw new NotFoundException('跟进策略不存在');
    if (userRole === 'consultant' && plan.consultantId !== userId) {
      throw new ForbiddenException('无权访问此策略');
    }

    return plan;
  }

  /** 从会话 AI 分析结果创建策略草稿 */
  async createFromSession(session: any): Promise<FollowUpPlan> {
    const plan = await this.planRepo.save({
      sessionId: session.id,
      customerId: session.customerId,
      consultantId: session.consultantId,
      status: 'draft',
      aiSummary: session.summary || '',
      aiStrategy: session.followUpStrategy || {},
      talkingPoints: session.followUpStrategy?.talkingPoints || [],
      bestFollowUpTime: session.followUpStrategy?.bestFollowUpTime || '',
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
      content: `客户 ${session.customer?.name || ''} 的面诊分析已完成，AI 已生成跟进策略草稿，请查看并确认。`,
      relatedType: 'follow_up_plan',
      relatedId: plan.id,
    });

    this.logger.log(`[FollowUpPlan] 从会话 ${session.id} 创建策略草稿 ${plan.id}`);
    return plan;
  }

  /** 咨询师确认策略 */
  async confirm(id: string, userId: string, data?: {
    consultantNotes?: string;
    talkingPoints?: string[];
    bestFollowUpTime?: string;
  }) {
    const plan = await this.findOne(id, 'consultant', userId);

    if (plan.status !== 'draft') {
      throw new ForbiddenException('只能确认草稿状态的策略');
    }

    plan.status = 'confirmed';
    if (data?.consultantNotes) plan.consultantNotes = data.consultantNotes;
    if (data?.talkingPoints) plan.talkingPoints = data.talkingPoints;
    if (data?.bestFollowUpTime) plan.bestFollowUpTime = data.bestFollowUpTime;

    await this.planRepo.save(plan);

    // 通知咨询师策略已确认，提醒执行
    await this.notificationService.create({
      userId: userId,
      type: 'task_reminder',
      title: '跟进策略已确认',
      content: `客户 ${plan.customer?.name || ''} 的跟进策略已确认，请按计划执行跟进。`,
      relatedType: 'follow_up_plan',
      relatedId: id,
    });

    this.logger.log(`[FollowUpPlan] 策略 ${id} 已确认`);
    return plan;
  }

  /** 咨询师编辑策略 */
  async update(id: string, userId: string, data: {
    consultantNotes?: string;
    talkingPoints?: string[];
    bestFollowUpTime?: string;
    blockers?: Array<{ type: string; detail: string; response: string }>;
  }) {
    const plan = await this.findOne(id, 'consultant', userId);

    if (plan.status === 'completed' || plan.status === 'cancelled') {
      throw new ForbiddenException('已完成或已取消的策略不可编辑');
    }

    if (data.consultantNotes !== undefined) plan.consultantNotes = data.consultantNotes;
    if (data.talkingPoints) plan.talkingPoints = data.talkingPoints;
    if (data.bestFollowUpTime) plan.bestFollowUpTime = data.bestFollowUpTime;
    if (data.blockers) plan.blockers = data.blockers;

    await this.planRepo.save(plan);
    this.logger.log(`[FollowUpPlan] 策略 ${id} 已更新`);
    return plan;
  }

  /** 记录跟进结果 */
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

    // 如果是第一次跟进，自动将状态改为 executing
    if (plan.status === 'confirmed') {
      plan.status = 'executing';
    }

    plan.followUpRecords = [
      ...plan.followUpRecords,
      {
        contactedAt: new Date().toISOString(),
        method: record.method,
        result: record.result,
        notes: record.notes,
        nextFollowUpDate: record.nextFollowUpDate,
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

  /** 完成策略 */
  async complete(id: string, userId: string) {
    const plan = await this.findOne(id, 'consultant', userId);

    if (plan.status === 'completed' || plan.status === 'cancelled') {
      throw new ForbiddenException('策略已完成或已取消');
    }

    plan.status = 'completed';
    plan.completedAt = new Date();

    await this.planRepo.save(plan);

    // 通知管理员策略完成
    const admins = await this.userRepo.find({ where: { role: 'admin' } });
    for (const admin of admins) {
      await this.notificationService.create({
        userId: admin.id,
        type: 'customer_update',
        title: '跟进策略已完成',
        content: `咨询师 ${plan.consultant?.realName || ''} 完成了客户 ${plan.customer?.name || ''} 的跟进策略，共跟进 ${plan.followUpRecords?.length || 0} 次。`,
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

  /** 获取客户的所有策略 */
  async findByCustomer(customerId: string, userRole: string, userId: string) {
    return this.findAll(userRole, userId, { customerId });
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

  /** 检查逾期策略并发送通知 */
  async checkOverdueStrategies() {
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);

    // 查找执行中但3天内无跟进记录的策略
    const executingPlans = await this.planRepo.find({
      where: { status: 'executing' },
      relations: ['customer', 'consultant'],
    });

    for (const plan of executingPlans) {
      const lastRecord = plan.followUpRecords?.[plan.followUpRecords.length - 1];
      if (lastRecord) {
        const lastContactDate = new Date(lastRecord.contactedAt);
        if (lastContactDate < threeDaysAgo) {
          // 逾期提醒
          await this.notificationService.create({
            userId: plan.consultantId,
            type: 'overdue_alert',
            title: '跟进策略逾期提醒',
            content: `客户 ${plan.customer?.name || ''} 的跟进策略已超过3天未跟进，请及时处理。`,
            relatedType: 'follow_up_plan',
            relatedId: plan.id,
          });
        }
      }
    }

    this.logger.log(`[FollowUpPlan] 逾期检查完成`);
  }

  /** 检查今日跟进提醒 */
  async checkTodayReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // 查找所有执行中或已确认的策略
    const plans = await this.planRepo.find({
      where: [
        { status: 'executing' },
        { status: 'confirmed' },
      ],
      relations: ['customer'],
    });

    for (const plan of plans) {
      // 检查跟进记录中的下次跟进时间
      const lastRecord = plan.followUpRecords?.[plan.followUpRecords.length - 1];
      if (lastRecord?.nextFollowUpDate) {
        const nextDate = new Date(lastRecord.nextFollowUpDate);
        if (nextDate >= today && nextDate < tomorrow) {
          await this.notificationService.create({
            userId: plan.consultantId,
            type: 'task_reminder',
            title: '今日跟进提醒',
            content: `客户 ${plan.customer?.name || ''} 今天需要跟进，请及时联系。`,
            relatedType: 'follow_up_plan',
            relatedId: plan.id,
          });
        }
      }
    }

    this.logger.log(`[FollowUpPlan] 今日提醒检查完成`);
  }
}
