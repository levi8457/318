import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { CustomerProfile } from '../customer/entities/customer.entity';
import { NotificationService } from '../notification/notification.service';
import { llmService } from '@tongquetai/ai-engine';

@Injectable()
export class CareReminderService {
  private readonly logger = new Logger(CareReminderService.name);

  constructor(
    @InjectRepository(CustomerProfile)
    private customerRepo: Repository<CustomerProfile>,
    private notificationService: NotificationService,
  ) {}

  /** 检查即将到期的生日/纪念日并生成提醒 */
  async checkAndGenerateReminders() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // 查询7天内生日的客户
    const birthdayCustomers = await this.findUpcomingBirthdays(today, nextWeek);
    for (const customer of birthdayCustomers) {
      await this.generateBirthdayReminder(customer);
    }

    // 查询7天内纪念日的客户
    const anniversaryCustomers = await this.findUpcomingAnniversaries(today, nextWeek);
    for (const customer of anniversaryCustomers) {
      await this.generateAnniversaryReminder(customer);
    }

    // 查询术后关键期的客户（3天/7天/30天）
    const postOpCustomers = await this.findPostOperationCustomers(today);
    for (const customer of postOpCustomers) {
      await this.generatePostOpReminder(customer, today);
    }

    return {
      birthdayReminders: birthdayCustomers.length,
      anniversaryReminders: anniversaryCustomers.length,
      postOpReminders: postOpCustomers.length,
    };
  }

  /** 查找即将生日的客户 */
  private async findUpcomingBirthdays(from: Date, to: Date): Promise<CustomerProfile[]> {
    const customers = await this.customerRepo.find({
      where: { status: 'active' },
    });

    return customers.filter(c => {
      if (!c.birthday) return false;
      const birthday = new Date(c.birthday);
      const thisYearBirthday = new Date(from.getFullYear(), birthday.getMonth(), birthday.getDate());
      return thisYearBirthday >= from && thisYearBirthday <= to;
    });
  }

  /** 查找即将纪念日的客户 */
  private async findUpcomingAnniversaries(from: Date, to: Date): Promise<CustomerProfile[]> {
    const customers = await this.customerRepo.find({
      where: { status: 'active' },
    });

    return customers.filter(c => {
      if (!c.anniversary) return false;
      const anniversary = new Date(c.anniversary);
      const thisYearAnniversary = new Date(from.getFullYear(), anniversary.getMonth(), anniversary.getDate());
      return thisYearAnniversary >= from && thisYearAnniversary <= to;
    });
  }

  /** 查找术后关键期的客户 */
  private async findPostOperationCustomers(today: Date): Promise<any[]> {
    // 查询有项目时间轴的客户，检查术后天数
    const customers = await this.customerRepo.find({
      where: { status: 'active' },
      relations: ['tags'],
    });

    // 简化实现：返回有"术后"标签的客户
    return customers.filter(c => {
      return c.tags?.some(t => t.value.includes('术后') || t.value.includes('恢复'));
    });
  }

  /** 生成生日提醒 */
  private async generateBirthdayReminder(customer: CustomerProfile) {
    try {
      const prompt = `你是一位贴心的医美顾问。请为客户生成生日关怀话术：

## 客户信息
- 姓名：${customer.name}

## 要求
- 称呼自然亲切
- 表达生日祝福
- 可以适当提及优惠活动作为生日礼物
- 50-100字以内

请直接输出话术内容，不要包含其他说明。`;

      const response = await llmService.generate({ prompt, maxTokens: 200 });

      await this.notificationService.create({
        userId: customer.consultantId,
        type: 'customer_update',
        title: '客户生日提醒',
        content: `${customer.name}即将过生日，请及时送上关怀。${response.content}`,
        relatedType: 'customer',
        relatedId: customer.id,
      });

      this.logger.log(`[CareReminder] 已为 ${customer.name} 生成生日提醒`);
    } catch (error: any) {
      this.logger.error(`[CareReminder] 生成生日提醒失败: ${error.message}`);
    }
  }

  /** 生成纪念日提醒 */
  private async generateAnniversaryReminder(customer: CustomerProfile) {
    try {
      const prompt = `你是一位贴心的医美顾问。请为客户生成纪念日关怀话术：

## 客户信息
- 姓名：${customer.name}

## 要求
- 称呼自然亲切
- 表达纪念日祝福
- 可以适当提及优惠活动
- 50-100字以内

请直接输出话术内容，不要包含其他说明。`;

      const response = await llmService.generate({ prompt, maxTokens: 200 });

      await this.notificationService.create({
        userId: customer.consultantId,
        type: 'customer_update',
        title: '客户纪念日提醒',
        content: `${customer.name}即将迎来纪念日，请及时送上关怀。${response.content}`,
        relatedType: 'customer',
        relatedId: customer.id,
      });

      this.logger.log(`[CareReminder] 已为 ${customer.name} 生成纪念日提醒`);
    } catch (error: any) {
      this.logger.error(`[CareReminder] 生成纪念日提醒失败: ${error.message}`);
    }
  }

  /** 生成术后关怀提醒 */
  private async generatePostOpReminder(customer: CustomerProfile, today: Date) {
    try {
      const prompt = `你是一位贴心的医美术后顾问。请为客户生成术后关怀话术：

## 客户信息
- 姓名：${customer.name}

## 要求
- 称呼自然亲切
- 包含专业的恢复建议
- 表达对客户的关心
- 50-100字以内

请直接输出话术内容，不要包含其他说明。`;

      const response = await llmService.generate({ prompt, maxTokens: 200 });

      await this.notificationService.create({
        userId: customer.consultantId,
        type: 'customer_update',
        title: '术后关怀提醒',
        content: `${customer.name}处于术后恢复期，请及时跟进。${response.content}`,
        relatedType: 'customer',
        relatedId: customer.id,
      });

      this.logger.log(`[CareReminder] 已为 ${customer.name} 生成术后关怀提醒`);
    } catch (error: any) {
      this.logger.error(`[CareReminder] 生成术后关怀提醒失败: ${error.message}`);
    }
  }
}
