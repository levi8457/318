import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowUpStrategyTemplate } from './entities/strategy.entity';

@Injectable()
export class StrategyService {
  constructor(
    @InjectRepository(FollowUpStrategyTemplate)
    private strategyRepo: Repository<FollowUpStrategyTemplate>,
  ) {}

  async findAll(query?: { keyword?: string; category?: string; isActive?: boolean }) {
    const qb = this.strategyRepo.createQueryBuilder('s');

    if (query?.keyword) {
      qb.andWhere('(s.name ILIKE :keyword OR s.category ILIKE :keyword)', {
        keyword: `%${query.keyword}%`,
      });
    }

    if (query?.category) {
      qb.andWhere('s.category = :category', { category: query.category });
    }

    if (query?.isActive !== undefined) {
      qb.andWhere('s.is_active = :isActive', { isActive: query.isActive });
    }

    qb.orderBy('s.created_at', 'DESC');
    return qb.getMany();
  }

  async findActive() {
    return this.strategyRepo.find({ where: { isActive: true } });
  }

  async create(dto: Partial<FollowUpStrategyTemplate>, userId: string) {
    return this.strategyRepo.save({ ...dto, createdBy: userId });
  }

  async findOne(id: string) {
    const tpl = await this.strategyRepo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException('策略模板不存在');
    return tpl;
  }

  async update(id: string, dto: Partial<FollowUpStrategyTemplate>) {
    await this.findOne(id);
    await this.strategyRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.strategyRepo.softDelete(id);
    return { message: '策略模板已删除' };
  }

  async toggleStatus(id: string) {
    const tpl = await this.findOne(id);
    await this.strategyRepo.update(id, { isActive: !tpl.isActive });
    return this.findOne(id);
  }

  async getCategories() {
    const result = await this.strategyRepo
      .createQueryBuilder('s')
      .select('DISTINCT s.category', 'category')
      .getRawMany();
    return result.map(r => r.category).filter(Boolean);
  }
}
