import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { TaskReminder } from './entities/task.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(TaskReminder)
    private taskRepo: Repository<TaskReminder>,
  ) {}

  /** 获取任务列表 */
  async findAll(userRole: string, userId: string) {
    const where: any = {};
    if (userRole === 'consultant') {
      where.consultantId = userId;
    }
    // 自动标记逾期任务
    await this.taskRepo.update(
      { ...where, status: 'pending', triggerDate: LessThanOrEqual(new Date()) },
      { status: 'overdue' },
    );
    return this.taskRepo.find({
      where,
      relations: ['customer'],
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
  async generateTasks(customerId: string, consultantId: string, projectType?: string) {
    const templates = this.getDefaultSOPTemplates(projectType);
    const tasks: TaskReminder[] = [];

    for (const tpl of templates) {
      const triggerDate = new Date();
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
    }

    return tasks;
  }

  /** 日历视图数据 */
  async getCalendar(userRole: string, userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const where: any = {
      triggerDate: {
        $between: [startDate, endDate],
      } as any,
    };
    if (userRole === 'consultant') {
      where.consultantId = userId;
    }

    return this.taskRepo.find({
      where,
      relations: ['customer'],
      order: { triggerDate: 'ASC' },
    });
  }

  /** 获取日历数据（简化版） */
  async getCalendarSimple(userRole: string, userId: string) {
    const where: any = {};
    if (userRole === 'consultant') {
      where.consultantId = userId;
    }
    return this.taskRepo.find({
      where,
      relations: ['customer'],
      order: { triggerDate: 'ASC' },
    });
  }

  /** 默认 SOP 模板 */
  private getDefaultSOPTemplates(projectType?: string) {
    const base = [
      {
        dayOffset: 0,
        taskType: 'follow_up',
        title: '面诊后 24 小时内跟进',
        description: '面诊结束后尽快联系客户，了解客户感受，确认意向',
        rule: '面诊结束后自动创建',
        careMessage: '感谢您今天到院咨询，如果您有任何疑问随时联系我。',
      },
      {
        dayOffset: 3,
        taskType: 'care',
        title: '术后 3 天关怀',
        description: '了解客户术后恢复情况，解答疑虑',
        rule: '术后第 3 天提醒',
        careMessage: '术后第3天是消肿关键期，注意冰敷和休息，有什么不适随时告诉我。',
      },
      {
        dayOffset: 7,
        taskType: 'recheck',
        title: '术后 7 天复诊提醒',
        description: '提醒客户到院复诊，检查恢复情况',
        rule: '术后第 7 天提醒',
        careMessage: '今天是术后第7天，建议您到院做一个恢复检查，确保效果最佳。',
      },
      {
        dayOffset: 30,
        taskType: 'care',
        title: '术后 1 个月关怀',
        description: '了解客户术后一个月效果，邀请分享体验',
        rule: '术后第 30 天提醒',
        careMessage: '一个月了，效果应该已经很明显了！方便的话可以拍张照片对比一下，也欢迎您分享体验。',
      },
    ];

    return base;
  }
}
