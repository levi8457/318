import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { GoldenScript } from './entities/script.entity';

@Injectable()
export class ScriptService {
  constructor(
    @InjectRepository(GoldenScript)
    private scriptRepo: Repository<GoldenScript>,
  ) {}

  async findAll(category?: string, keyword?: string) {
    const where: any = { isApproved: true };
    if (category) where.category = category;
    if (keyword) {
      return this.scriptRepo.find({
        where: [
          { ...where, scenario: Like(`%${keyword}%`) },
          { ...where, script: Like(`%${keyword}%`) },
        ],
        order: { conversionRate: 'DESC' },
      });
    }
    return this.scriptRepo.find({ where, order: { conversionRate: 'DESC' } });
  }

  /** 管理员查看所有话术（含未审核） */
  async findAllAdmin() {
    return this.scriptRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const script = await this.scriptRepo.findOne({ where: { id } });
    if (!script) throw new NotFoundException('话术不存在');
    return script;
  }

  async create(dto: Partial<GoldenScript>) {
    return this.scriptRepo.save(dto);
  }

  async generate(category: string, scenario: string) {
    // Mock AI 话术生成
    const mockScripts = [
      {
        category,
        scenario,
        script: `关于${scenario}的问题，我们建议从专业角度出发，用数据说话。您可以告诉客户，我院在这方面有丰富的成功案例，并且采用的都是目前最先进的技术方案。`,
        isApproved: false,
      },
    ];
    return this.scriptRepo.save(mockScripts);
  }

  async update(id: string, dto: Partial<GoldenScript>) {
    await this.findOne(id);
    await this.scriptRepo.update(id, dto);
    return this.findOne(id);
  }

  async approve(id: string) {
    await this.findOne(id);
    await this.scriptRepo.update(id, { isApproved: true });
    return { message: '话术已审核通过' };
  }
}
