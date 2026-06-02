import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { CustomerProfile } from '../customer/entities/customer.entity';
import { ConsultationSession } from '../session/entities/session.entity';
import { TaskReminder } from '../task/entities/task.entity';
import { User } from '../auth/entities/user.entity';
import { GoldenScript } from '../script/entities/script.entity';
import { MarketingCampaign } from '../campaign/entities/campaign.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(CustomerProfile)
    private customerRepo: Repository<CustomerProfile>,
    @InjectRepository(ConsultationSession)
    private sessionRepo: Repository<ConsultationSession>,
    @InjectRepository(TaskReminder)
    private taskRepo: Repository<TaskReminder>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(GoldenScript)
    private scriptRepo: Repository<GoldenScript>,
    @InjectRepository(MarketingCampaign)
    private campaignRepo: Repository<MarketingCampaign>,
  ) {}

  /** 管理员 — 全局业务指标 */
  async getAdminMetrics() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalCustomers = await this.customerRepo.count();
    const activeCustomers = await this.customerRepo.count({ where: { status: 'active' } });
    const newCustomersThisMonth = await this.customerRepo.count({
      where: { createdAt: MoreThanOrEqual(monthStart) },
    });
    const totalSessions = await this.sessionRepo.count();
    const sessionsThisMonth = await this.sessionRepo.count({
      where: { createdAt: MoreThanOrEqual(monthStart) },
    });
    const totalTasks = await this.taskRepo.count();
    const completedTasks = await this.taskRepo.count({ where: { status: 'completed' } });

    return {
      totalCustomers,
      newCustomersThisMonth,
      activeRate: totalCustomers > 0 ? activeCustomers / totalCustomers : 0,
      conversionRate: totalSessions > 0 ? completedTasks / totalSessions : 0,
      totalSessions,
      sessionsThisMonth,
      taskCompletionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
      followUpRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
    };
  }

  /** 管理员 — 咨询师业绩排行 */
  async getAdminRanking() {
    const consultants = await this.userRepo.find({ where: { role: 'consultant' } });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const rankings = await Promise.all(
      consultants.map(async (c) => {
        const totalCustomers = await this.customerRepo.count({
          where: { consultantId: c.id },
        });
        const newCustomersThisMonth = await this.customerRepo.count({
          where: { consultantId: c.id, createdAt: MoreThanOrEqual(monthStart) },
        });
        const sessionsThisMonth = await this.sessionRepo.count({
          where: { consultantId: c.id, createdAt: MoreThanOrEqual(monthStart) },
        });
        const totalTasks = await this.taskRepo.count({
          where: { consultantId: c.id },
        });
        const completedTasks = await this.taskRepo.count({
          where: { consultantId: c.id, status: 'completed' },
        });

        return {
          consultantId: c.id,
          consultantName: c.realName,
          avatar: c.avatar,
          totalCustomers,
          newCustomersThisMonth,
          sessionsThisMonth,
          taskCompletionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
          followUpRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
          conversionRate: 0,
          totalTasks,
          completedTasks,
        };
      }),
    );

    return rankings;
  }

  /** 管理员 — 趋势图表数据 */
  async getAdminTrends() {
    const months = ['01', '02', '03', '04', '05'];
    const year = new Date().getFullYear();

    const customerGrowth = await Promise.all(
      months.map(async (m) => {
        const monthStart = new Date(`${year}-${m}-01`);
        const monthEnd = new Date(year, parseInt(m), 1);
        const count = await this.customerRepo
          .createQueryBuilder('c')
          .where('c.created_at >= :start', { start: monthStart })
          .andWhere('c.created_at < :end', { end: monthEnd })
          .getCount();
        return { date: `${year}-${m}`, value: count };
      }),
    );

    const monthlySessions = await Promise.all(
      months.map(async (m) => {
        const monthStart = new Date(`${year}-${m}-01`);
        const monthEnd = new Date(year, parseInt(m), 1);
        const count = await this.sessionRepo
          .createQueryBuilder('s')
          .where('s.created_at >= :start', { start: monthStart })
          .andWhere('s.created_at < :end', { end: monthEnd })
          .getCount();
        return { date: `${year}-${m}`, value: count };
      }),
    );

    const conversionTrend = await Promise.all(
      months.map(async (m) => {
        const monthStart = new Date(`${year}-${m}-01`);
        const monthEnd = new Date(year, parseInt(m), 1);
        const sessions = await this.sessionRepo
          .createQueryBuilder('s')
          .where('s.created_at >= :start', { start: monthStart })
          .andWhere('s.created_at < :end', { end: monthEnd })
          .getCount();
        const completed = await this.sessionRepo
          .createQueryBuilder('s')
          .where('s.created_at >= :start', { start: monthStart })
          .andWhere('s.created_at < :end', { end: monthEnd })
          .andWhere('s.status = :status', { status: 'completed' })
          .getCount();
        return {
          date: `${year}-${m}`,
          value: sessions > 0 ? completed / sessions : 0,
        };
      }),
    );

    return {
      customerGrowth,
      monthlySessions,
      conversionTrend,
      projectDistribution: [],
    };
  }

  /** 管理员 — 待处理事项 */
  async getAdminAlerts() {
    const overdueTasks = await this.taskRepo.count({ where: { status: 'overdue' } });
    const pendingScripts = await this.scriptRepo.count({ where: { isApproved: false } });
    const pendingCampaigns = await this.campaignRepo.count({ where: { status: 'draft' } });
    const inactiveConsultants = await this.userRepo.count({
      where: { role: 'consultant', isActive: false },
    });

    return {
      pendingScripts,
      overdueTasks,
      pendingCampaigns,
      inactiveConsultants,
    };
  }

  /** 咨询师 — 个人指标 */
  async getConsultantMetrics(consultantId: string) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalCustomers = await this.customerRepo.count({ where: { consultantId } });
    const newCustomersThisWeek = await this.customerRepo.count({
      where: { consultantId, createdAt: MoreThanOrEqual(weekStart) },
    });
    const pendingCustomers = await this.customerRepo.count({
      where: { consultantId, status: 'active' },
    });
    const todayTasks = await this.taskRepo.count({
      where: { consultantId, status: 'pending' },
    });
    const completedTasksThisMonth = await this.taskRepo.count({
      where: { consultantId, status: 'completed' },
    });
    const sessionsThisMonth = await this.sessionRepo.count({
      where: { consultantId, createdAt: MoreThanOrEqual(monthStart) },
    });
    const totalTasks = await this.taskRepo.count({ where: { consultantId } });
    const completedTasks = await this.taskRepo.count({
      where: { consultantId, status: 'completed' },
    });

    return {
      totalCustomers,
      newCustomersThisWeek,
      pendingCustomers,
      todayTasks,
      completedTasksThisMonth,
      sessionsThisMonth,
      taskCompletionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
      followUpRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
      conversionRate: 0,
    };
  }

  /** 咨询师 — 今日待办 */
  async getConsultantTodayTasks(consultantId: string) {
    return this.taskRepo.find({
      where: { consultantId, status: 'pending' },
      relations: ['customer'],
      order: { triggerDate: 'ASC' },
      take: 10,
    });
  }

  /** 咨询师 — 最近活跃客户 */
  async getConsultantRecentCustomers(consultantId: string) {
    const customers = await this.customerRepo.find({
      where: { consultantId, status: 'active' },
      order: { updatedAt: 'DESC' },
      take: 10,
    });
    return customers.map((c) => ({
      customerId: c.id,
      customerName: c.name,
      tags: [],
      lastActivity: c.updatedAt,
      lastActivityType: '面诊',
    }));
  }
}
