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

  async findAll() {
    return this.strategyRepo.find({ order: { createdAt: 'DESC' } });
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
    return { isActive: !tpl.isActive };
  }
}
