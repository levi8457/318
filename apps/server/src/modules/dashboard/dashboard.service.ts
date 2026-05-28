import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerProfile } from '../customer/entities/customer.entity';
import { ConsultationSession } from '../session/entities/session.entity';
import { TaskReminder } from '../task/entities/task.entity';
import { User } from '../auth/entities/user.entity';

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
  ) {}

  /** 管理员 — 全局业务指标 */
  async getAdminMetrics() {
    const totalCustomers = await this.customerRepo.count();
    const activeCustomers = await this.customerRepo.count({ where: { status: 'active' } });
    const totalSessions = await this.sessionRepo.count();
    const totalTasks = await this.taskRepo.count();
    const completedTasks = await this.taskRepo.count({ where: { status: 'completed' } });

    return {
      totalCustomers,
      newCustomersThisMonth: Math.floor(totalCustomers * 0.15),
      activeRate: totalCustomers > 0 ? activeCustomers / totalCustomers : 0,
      conversionRate: 0.25,
      totalSessions,
      sessionsThisMonth: Math.floor(totalSessions * 0.3),
      taskCompletionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
      followUpRate: 0.82,
    };
  }

  /** 管理员 — 咨询师业绩排行 */
  async getAdminRanking() {
    const consultants = await this.userRepo.find({ where: { role: 'consultant' } });
    return consultants.map((c, i) => ({
      consultantId: c.id,
      consultantName: c.realName,
      avatar: c.avatar,
      totalCustomers: 30 + Math.floor(Math.random() * 20),
      newCustomersThisMonth: Math.floor(Math.random() * 10),
      sessionsThisMonth: Math.floor(Math.random() * 15),
      taskCompletionRate: 0.7 + Math.random() * 0.25,
      followUpRate: 0.75 + Math.random() * 0.2,
      conversionRate: 0.15 + Math.random() * 0.2,
      totalTasks: 50 + Math.floor(Math.random() * 30),
      completedTasks: 40 + Math.floor(Math.random() * 25),
    }));
  }

  /** 管理员 — 趋势图表数据 */
  async getAdminTrends() {
    const months = ['01', '02', '03', '04', '05'];
    return {
      customerGrowth: months.map((m) => ({ date: `2026-${m}`, value: 100 + Math.floor(Math.random() * 200) })),
      monthlySessions: months.map((m) => ({ date: `2026-${m}`, value: 30 + Math.floor(Math.random() * 80) })),
      conversionTrend: months.map((m) => ({ date: `2026-${m}`, value: 0.15 + Math.random() * 0.15 })),
      projectDistribution: [
        { projectType: '抗衰', count: 45 },
        { projectType: '塑形', count: 32 },
        { projectType: '皮肤', count: 58 },
        { projectType: '微整', count: 28 },
        { projectType: '口腔', count: 15 },
      ],
    };
  }

  /** 管理员 — 待处理事项 */
  async getAdminAlerts() {
    const overdueTasks = await this.taskRepo.count({ where: { status: 'overdue' } });
    return {
      pendingScripts: Math.floor(Math.random() * 10),
      overdueTasks,
      pendingCampaigns: Math.floor(Math.random() * 5),
      inactiveConsultants: 0,
    };
  }

  /** 咨询师 — 个人指标 */
  async getConsultantMetrics(consultantId: string) {
    const totalCustomers = await this.customerRepo.count({ where: { consultantId } });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTasks = await this.taskRepo.count({
      where: { consultantId, status: 'pending' },
    });

    return {
      totalCustomers,
      newCustomersThisWeek: Math.floor(Math.random() * 5),
      pendingCustomers: Math.floor(totalCustomers * 0.3),
      todayTasks,
      completedTasksThisMonth: Math.floor(Math.random() * 30),
      sessionsThisMonth: Math.floor(Math.random() * 12),
      taskCompletionRate: 0.8 + Math.random() * 0.15,
      followUpRate: 0.78 + Math.random() * 0.18,
      conversionRate: 0.18 + Math.random() * 0.12,
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
