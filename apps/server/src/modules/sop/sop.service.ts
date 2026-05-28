import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SOPTemplate } from './entities/sop.entity';

@Injectable()
export class SopService {
  constructor(
    @InjectRepository(SOPTemplate)
    private sopRepo: Repository<SOPTemplate>,
  ) {}

  async findAll() {
    return this.sopRepo.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: Partial<SOPTemplate>, userId: string) {
    return this.sopRepo.save({ ...dto, createdBy: userId });
  }

  async findOne(id: string) {
    const tpl = await this.sopRepo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException('SOP模板不存在');
    return tpl;
  }

  async update(id: string, dto: Partial<SOPTemplate>) {
    await this.findOne(id);
    await this.sopRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.sopRepo.softDelete(id);
    return { message: 'SOP模板已删除' };
  }
}
