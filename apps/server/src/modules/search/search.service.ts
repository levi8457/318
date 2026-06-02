import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CustomerProfile } from '../customer/entities/customer.entity';
import { ConsultationSession } from '../session/entities/session.entity';
import { GoldenScript } from '../script/entities/script.entity';
import { TaskReminder } from '../task/entities/task.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(CustomerProfile)
    private customerRepo: Repository<CustomerProfile>,
    @InjectRepository(ConsultationSession)
    private sessionRepo: Repository<ConsultationSession>,
    @InjectRepository(GoldenScript)
    private scriptRepo: Repository<GoldenScript>,
    @InjectRepository(TaskReminder)
    private taskRepo: Repository<TaskReminder>,
  ) {}

  async globalSearch(keyword: string, userRole: string, userId: string) {
    if (!keyword || keyword.trim().length === 0) {
      return { customers: [], sessions: [], scripts: [], tasks: [] };
    }

    const kw = `%${keyword.trim()}%`;

    // 搜索客户
    const customerQb = this.customerRepo.createQueryBuilder('c');
    customerQb.where('(c.name ILIKE :kw OR c.phone ILIKE :kw)', { kw });
    if (userRole === 'consultant') {
      customerQb.andWhere('c.consultant_id = :userId', { userId });
    }
    customerQb.orderBy('c.updated_at', 'DESC').take(10);
    const customers = await customerQb.getMany();

    // 搜索会话
    const sessionQb = this.sessionRepo.createQueryBuilder('s');
    sessionQb.leftJoinAndSelect('s.customer', 'customer');
    sessionQb.where('(s.summary ILIKE :kw OR s.transcript ILIKE :kw)', { kw });
    if (userRole === 'consultant') {
      sessionQb.andWhere('s.consultant_id = :userId', { userId });
    }
    sessionQb.orderBy('s.created_at', 'DESC').take(10);
    const sessions = await sessionQb.getMany();

    // 搜索话术
    const scriptQb = this.scriptRepo.createQueryBuilder('s');
    scriptQb.where('(s.script ILIKE :kw OR s.scenario ILIKE :kw OR s.category ILIKE :kw)', { kw });
    scriptQb.orderBy('s.created_at', 'DESC').take(10);
    const scripts = await scriptQb.getMany();

    // 搜索任务
    const taskQb = this.taskRepo.createQueryBuilder('t');
    taskQb.leftJoinAndSelect('t.customer', 'customer');
    taskQb.where('(t.title ILIKE :kw OR t.description ILIKE :kw)', { kw });
    if (userRole === 'consultant') {
      taskQb.andWhere('t.consultant_id = :userId', { userId });
    }
    taskQb.orderBy('t.trigger_date', 'ASC').take(10);
    const tasks = await taskQb.getMany();

    return {
      customers: customers.map(c => ({ id: c.id, name: c.name, phone: c.phone, type: 'customer' })),
      sessions: sessions.map(s => ({ id: s.id, summary: s.summary?.substring(0, 50), customerName: s.customer?.name, type: 'session' })),
      scripts: scripts.map(s => ({ id: s.id, scenario: s.scenario, category: s.category, script: s.script?.substring(0, 50), type: 'script' })),
      tasks: tasks.map(t => ({ id: t.id, title: t.title, customerName: t.customer?.name, status: t.status, type: 'task' })),
    };
  }
}
