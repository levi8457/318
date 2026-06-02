import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectType } from './entities/project-type.entity';

@Injectable()
export class ProjectTypeService {
  constructor(
    @InjectRepository(ProjectType)
    private projectTypeRepo: Repository<ProjectType>,
  ) {}

  async findAll(query?: { keyword?: string; isActive?: boolean }) {
    const qb = this.projectTypeRepo.createQueryBuilder('pt');

    if (query?.keyword) {
      qb.andWhere('pt.name ILIKE :keyword', { keyword: `%${query.keyword}%` });
    }

    if (query?.isActive !== undefined) {
      qb.andWhere('pt.is_active = :isActive', { isActive: query.isActive });
    }

    qb.orderBy('pt.name', 'ASC');
    return qb.getMany();
  }

  async findActive() {
    return this.projectTypeRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async create(dto: { name: string; category?: string }) {
    // 检查名称是否已存在
    const existing = await this.projectTypeRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new NotFoundException(`项目类型"${dto.name}"已存在`);
    }
    return this.projectTypeRepo.save({
      name: dto.name,
      category: dto.category,
    });
  }

  async findOne(id: string) {
    const pt = await this.projectTypeRepo.findOne({ where: { id } });
    if (!pt) throw new NotFoundException('项目类型不存在');
    return pt;
  }

  async update(id: string, dto: { name?: string; category?: string; isActive?: boolean }) {
    await this.findOne(id);
    await this.projectTypeRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.projectTypeRepo.softDelete(id);
    return { message: '项目类型已删除' };
  }

  async batchCreate(items: { name: string; category?: string }[]) {
    const results = [];
    for (const item of items) {
      const existing = await this.projectTypeRepo.findOne({ where: { name: item.name } });
      if (!existing) {
        results.push(await this.projectTypeRepo.save(item));
      }
    }
    return results;
  }
}
