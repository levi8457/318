import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerProfile, Tag, Preference, ProjectTimeline } from './entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto, AddTagDto, AddPreferenceDto, AddProjectDto } from './dto/customer.dto';

export interface CustomerListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  budgetSensitivity?: string;
}

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(CustomerProfile)
    private customerRepo: Repository<CustomerProfile>,
    @InjectRepository(Tag)
    private tagRepo: Repository<Tag>,
    @InjectRepository(Preference)
    private preferenceRepo: Repository<Preference>,
    @InjectRepository(ProjectTimeline)
    private projectRepo: Repository<ProjectTimeline>,
  ) {}

  /** 验证客户是否存在，并对 consultant 角色做数据隔离检查 */
  private async checkOwnership(customerId: string, userRole: string, userId: string): Promise<CustomerProfile> {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('客户不存在');
    if (userRole === 'consultant' && customer.consultantId !== userId) {
      throw new ForbiddenException('无权操作该客户');
    }
    return customer;
  }

  /** 获取客户列表（admin 看全部，consultant 看自己的）支持搜索/分页/筛选 */
  async findAll(userRole: string, userId: string, query: CustomerListQuery = {}) {
    const { page = 1, pageSize = 20, keyword, status, budgetSensitivity } = query;

    const qb = this.customerRepo.createQueryBuilder('customer');
    qb.leftJoinAndSelect('customer.consultant', 'consultant');

    // 数据隔离：consultant 只看自己的客户
    if (userRole === 'consultant') {
      qb.where('customer.consultant_id = :userId', { userId });
    }

    // 关键词搜索（姓名、手机号）
    if (keyword) {
      qb.andWhere(
        '(customer.name ILIKE :keyword OR customer.phone ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 状态筛选
    if (status) {
      qb.andWhere('customer.status = :status', { status });
    }

    // 预算敏感度筛选
    if (budgetSensitivity) {
      qb.andWhere('customer.budget_sensitivity = :budgetSensitivity', { budgetSensitivity });
    }

    // 分页
    const skip = (page - 1) * pageSize;
    qb.orderBy('customer.createdAt', 'DESC');
    qb.skip(skip).take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** 创建客户 */
  async create(dto: CreateCustomerDto, consultantId: string) {
    return this.customerRepo.save({ ...dto, consultantId });
  }

  /** 获取客户详情（含画像） */
  async findOne(id: string, userRole: string, userId: string) {
    const customer = await this.checkOwnership(id, userRole, userId);

    const tags = await this.tagRepo.find({ where: { customerId: id } });
    const preferences = await this.preferenceRepo.find({ where: { customerId: id } });
    const projects = await this.projectRepo.find({
      where: { customerId: id },
      order: { date: 'DESC' },
    });

    return { ...customer, tags, preferences, projects };
  }

  /** 更新客户信息 */
  async update(id: string, dto: UpdateCustomerDto, userRole: string, userId: string) {
    await this.checkOwnership(id, userRole, userId);
    await this.customerRepo.update(id, dto);
    return this.customerRepo.findOne({ where: { id } });
  }

  /** 添加标签 */
  async addTag(customerId: string, dto: AddTagDto, userRole: string, userId: string) {
    await this.checkOwnership(customerId, userRole, userId);
    return this.tagRepo.save({ customerId, ...dto });
  }

  /** 删除标签 */
  async removeTag(customerId: string, tagId: string, userRole: string, userId: string) {
    await this.checkOwnership(customerId, userRole, userId);
    await this.tagRepo.delete({ id: tagId, customerId });
    return { message: '标签已删除' };
  }

  /** 添加喜好备忘 */
  async addPreference(customerId: string, dto: AddPreferenceDto, userRole: string, userId: string) {
    await this.checkOwnership(customerId, userRole, userId);
    return this.preferenceRepo.save({ customerId, importance: 'normal', ...dto });
  }

  /** 删除喜好备忘 */
  async removePreference(customerId: string, prefId: string, userRole: string, userId: string) {
    await this.checkOwnership(customerId, userRole, userId);
    await this.preferenceRepo.delete({ id: prefId, customerId });
    return { message: '备忘已删除' };
  }

  /** 添加项目时间轴 */
  async addProject(customerId: string, dto: AddProjectDto, consultantId: string) {
    const { date, ...rest } = dto as any;
    return this.projectRepo.save({
      customerId,
      consultantId,
      date: new Date(date),
      status: 'planned',
      ...rest,
    });
  }

  /** 获取项目时间轴 */
  async getTimeline(customerId: string, userRole: string, userId: string) {
    await this.checkOwnership(customerId, userRole, userId);
    return this.projectRepo.find({
      where: { customerId },
      order: { date: 'DESC' },
    });
  }
}
