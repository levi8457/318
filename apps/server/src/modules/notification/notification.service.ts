import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Notification } from './entities/notification.entity';

export interface CreateNotificationData {
  userId: string;
  type: 'task_reminder' | 'overdue_alert' | 'system' | 'customer_update';
  title: string;
  content: string;
  relatedType?: string;
  relatedId?: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    return this.notificationRepo.save({
      userId: data.userId,
      type: data.type,
      title: data.title,
      content: data.content,
      relatedType: data.relatedType,
      relatedId: data.relatedId,
    });
  }

  async findByUser(userId: string, query: { isRead?: boolean; page?: number; pageSize?: number }) {
    const { isRead, page = 1, pageSize = 20 } = query;

    const qb = this.notificationRepo.createQueryBuilder('n');
    qb.where('n.user_id = :userId', { userId });

    if (isRead !== undefined) {
      qb.andWhere('n.is_read = :isRead', { isRead });
    }

    qb.orderBy('n.created_at', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    const unreadCount = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });

    return { items, total, unreadCount, page, pageSize };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });
    if (!notification) throw new Error('通知不存在');

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  async createTaskReminder(userId: string, taskTitle: string, taskId: string, customerName: string) {
    return this.create({
      userId,
      type: 'task_reminder',
      title: '任务提醒',
      content: `您有一个待办任务：${taskTitle}（客户：${customerName}）`,
      relatedType: 'task',
      relatedId: taskId,
    });
  }

  async createOverdueAlert(userId: string, taskTitle: string, taskId: string) {
    return this.create({
      userId,
      type: 'overdue_alert',
      title: '任务逾期提醒',
      content: `任务"${taskTitle}"已逾期，请尽快处理`,
      relatedType: 'task',
      relatedId: taskId,
    });
  }
}
