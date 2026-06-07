import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { TaskReminder } from './entities/task.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(TaskReminder)
    private taskRepo: Repository<TaskReminder>,
    private notificationService: NotificationService,
  ) {}

  /** 获取任务列表 */
  async findAll(userRole: string, userId: string) {
    const where: any = {};
    if (userRole === 'consultant') {
      where.consultantId = userId;
    }
    // 自动标记逾期任务并发送通知
    const overdueTasks = await this.taskRepo.find({
      where: { ...where, status: 'pending', triggerDate: LessThanOrEqual(new Date()) },
      relations: ['customer'],
    });

    for (const task of overdueTasks) {
      await this.taskRepo.update(task.id, { status: 'overdue' });
      await this.notificationService.createOverdueAlert(
        task.consultantId,
        task.title,
        task.id,
      );
    }

    return this.taskRepo.find({
      where,
      relations: ['customer', 'consultant'],
      order: { triggerDate: 'ASC' },
    });
  }

  /** 更新任务状态 */
  async updateStatus(id: string, status: string, result?: string) {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('任务不存在');

    const update: any = { status };
    if (status === 'completed') {
      update.completedAt = new Date();
      update.result = result;
    }
    await this.taskRepo.update(id, update);
    return this.taskRepo.findOne({ where: { id } });
  }

  /** 根据项目自动生成 SOP 任务 */
  async generateTasks(customerId: string, consultantId: string, projectType?: string, procedureDate?: string) {
    const templates = this.getDefaultSOPTemplates(projectType);
    const tasks: TaskReminder[] = [];

    // 使用传入的手术日期，或默认为今天
    const baseDate = procedureDate ? new Date(procedureDate) : new Date();
    baseDate.setHours(0, 0, 0, 0);

    for (const tpl of templates) {
      const triggerDate = new Date(baseDate);
      triggerDate.setDate(triggerDate.getDate() + tpl.dayOffset);

      const task = await this.taskRepo.save({
        customerId,
        consultantId,
        taskType: tpl.taskType as any,
        title: tpl.title,
        description: tpl.description,
        triggerDate,
        triggerRule: tpl.rule,
        careMessage: tpl.careMessage,
        priority: 'medium',
      });
      tasks.push(task);

      // 为当天任务发送提醒
      if (tpl.dayOffset === 0) {
        const customer = await this.taskRepo.manager.findOne('CustomerProfile', {
          where: { id: customerId },
        });
        if (customer) {
          await this.notificationService.createTaskReminder(
            consultantId,
            tpl.title,
            task.id,
            (customer as any).name,
          );
        }
      }
    }

    return tasks;
  }

  private getDefaultSOPTemplates(projectType?: string) {
    return [
      {
        dayOffset: 0,
        taskType: 'follow_up',
        title: '术后 24 小时内跟进',
        description: '了解客户术后感受，确认恢复情况',
        rule: '术后当天自动生成',
        careMessage: '感谢您到院咨询，如有任何问题随时联系我。',
      },
      {
        dayOffset: 3,
        taskType: 'care',
        title: '术后 3 天关怀',
        description: '了解客户恢复状况，提供护理建议',
        rule: '术后 3 天自动生成',
        careMessage: '术后第3天是关键期，注意休息和护理哦。',
      },
      {
        dayOffset: 7,
        taskType: 'recheck',
        title: '术后 7 天复诊提醒',
        description: '提醒客户到院复诊，确认恢复效果',
        rule: '术后 7 天自动生成',
        careMessage: '术后第7天，建议到院复查一下恢复情况。',
      },
      {
        dayOffset: 30,
        taskType: 'care',
        title: '术后 1 个月关怀',
        description: '了解客户长期效果，提供后续护理建议',
        rule: '术后 30 天自动生成',
        careMessage: '一个月了，效果应该已经显现了，记得做好日常护理。',
      },
    ];
  }

  /** 日历视图数据（简化版） */
  async getCalendarSimple(userRole: string, userId: string) {
    const where: any = {};
    if (userRole === 'consultant') {
      where.consultantId = userId;
    }

    const tasks = await this.taskRepo.find({
      where,
      relations: ['customer'],
      order: { triggerDate: 'ASC' },
    });

    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      date: task.triggerDate,
      status: task.status,
      taskType: task.taskType,
      customerName: task.customer?.name,
    }));
  }
}
