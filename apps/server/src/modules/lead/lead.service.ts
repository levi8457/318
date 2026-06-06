import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);

  constructor(
    @InjectRepository(Lead)
    private leadRepo: Repository<Lead>,
  ) {}

  async create(data: { name: string; phone: string; company?: string; teamSize?: string }): Promise<Lead> {
    const lead = await this.leadRepo.save({
      name: data.name,
      phone: data.phone,
      company: data.company,
      teamSize: data.teamSize,
      status: 'new',
    });

    this.logger.log(`[Lead] 新留资: ${data.name} - ${data.phone}`);
    return lead;
  }

  async findAll(query?: { status?: string; page?: number; pageSize?: number }) {
    const { status, page = 1, pageSize = 20 } = query || {};

    const qb = this.leadRepo.createQueryBuilder('lead');

    if (status) {
      qb.andWhere('lead.status = :status', { status });
    }

    qb.orderBy('lead.created_at', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async updateStatus(id: string, status: string, notes?: string) {
    await this.leadRepo.update(id, { status: status as any, notes });
    return this.leadRepo.findOne({ where: { id } });
  }
}
