import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultantProfile } from './entities/consultant-profile.entity';
import { User } from '../auth/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { LicenseService } from '../license/license.service';
import { CreateConsultantDto, UpdateConsultantDto } from './dto/consultant.dto';

@Injectable()
export class ConsultantService {
  constructor(
    @InjectRepository(ConsultantProfile)
    private consultantRepo: Repository<ConsultantProfile>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private authService: AuthService,
    private licenseService: LicenseService,
  ) {}

  /** 获取所有咨询师列表（含绩效指标） */
  async findAll() {
    const consultants = await this.consultantRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return consultants.map((c) => ({
      id: c.id,
      userId: c.userId,
      username: c.user?.username,
      realName: c.user?.realName,
      phone: c.user?.phone,
      avatar: c.user?.avatar,
      employeeNo: c.employeeNo,
      speciality: c.speciality,
      customerCount: c.customerCount,
      isActive: c.user?.isActive,
      joinedAt: c.joinedAt,
      leftAt: c.leftAt,
      notes: c.notes,
    }));
  }

  /** 获取咨询师详情 */
  async findOne(id: string) {
    const consultant = await this.consultantRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!consultant) throw new NotFoundException('咨询师不存在');
    return consultant;
  }

  /** 新增咨询师 */
  async create(dto: CreateConsultantDto) {
    // 检查咨询师数量限制
    const consultantCount = await this.consultantRepo.count();
    await this.licenseService.checkConsultantLimit(consultantCount);

    // 检查用户名是否已存在
    const existingUser = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existingUser) throw new ConflictException('用户名已存在');

    // 创建用户
    const user = await this.authService.createUser({
      username: dto.username,
      password: dto.password,
      role: 'consultant',
      realName: dto.realName,
      phone: dto.phone,
    });

    // 创建咨询师档案
    const profile = await this.consultantRepo.save({
      userId: user.id,
      employeeNo: dto.employeeNo,
      speciality: dto.speciality || [],
      notes: dto.notes,
    });

    return { ...profile, user };
  }

  /** 编辑咨询师信息 */
  async update(id: string, dto: UpdateConsultantDto) {
    const consultant = await this.findOne(id);

    if (dto.realName || dto.phone) {
      await this.userRepo.update(consultant.userId, {
        realName: dto.realName || consultant.user?.realName,
        phone: dto.phone || consultant.user?.phone,
      });
    }

    if (dto.employeeNo !== undefined) consultant.employeeNo = dto.employeeNo;
    if (dto.speciality !== undefined) consultant.speciality = dto.speciality;
    if (dto.notes !== undefined) consultant.notes = dto.notes;

    await this.consultantRepo.save(consultant);
    return this.findOne(id);
  }

  /** 删除咨询师（软删除） */
  async remove(id: string) {
    const consultant = await this.findOne(id);
    await this.userRepo.softDelete(consultant.userId);
    await this.consultantRepo.softDelete(id);
    return { message: '咨询师已删除' };
  }

  /** 启用/停用咨询师 */
  async toggleStatus(id: string) {
    const consultant = await this.findOne(id);
    const newStatus = !consultant.user?.isActive;
    await this.userRepo.update(consultant.userId, { isActive: newStatus });
    return { isActive: newStatus };
  }

  /** 重置咨询师密码 */
  async resetPassword(id: string, newPassword: string) {
    const consultant = await this.findOne(id);
    return this.authService.resetPassword(consultant.userId, newPassword);
  }

  /** 获取咨询师绩效指标 */
  async getMetrics(consultantId: string) {
    const consultant = await this.consultantRepo.findOne({
      where: { id: consultantId },
      relations: ['user'],
    });
    if (!consultant) throw new NotFoundException('咨询师不存在');

    return {
      consultantId: consultant.id,
      consultantName: consultant.user?.realName,
      totalCustomers: consultant.customerCount,
      newCustomersThisMonth: 0,
      sessionsThisMonth: 0,
      taskCompletionRate: 0,
      followUpRate: 0,
      conversionRate: 0,
    };
  }
}
