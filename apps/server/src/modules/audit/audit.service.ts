import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditLogData {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.auditRepo.save({
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        details: data.details || {},
        ip: data.ip,
        userAgent: data.userAgent,
      });
    } catch (error) {
      console.error('[AuditService] 日志记录失败:', error);
    }
  }

  async findAll(query: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { userId, action, resourceType, startDate, endDate, page = 1, pageSize = 20 } = query;

    const qb = this.auditRepo.createQueryBuilder('log');
    qb.leftJoinAndSelect('log.user', 'user');

    if (userId) qb.andWhere('log.user_id = :userId', { userId });
    if (action) qb.andWhere('log.action = :action', { action });
    if (resourceType) qb.andWhere('log.resource_type = :resourceType', { resourceType });
    if (startDate) qb.andWhere('log.created_at >= :startDate', { startDate });
    if (endDate) qb.andWhere('log.created_at <= :endDate', { endDate });

    qb.orderBy('log.created_at', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async findByResource(resourceType: string, resourceId: string) {
    return this.auditRepo.find({
      where: { resourceType, resourceId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
