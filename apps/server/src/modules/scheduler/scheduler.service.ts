import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FollowUpPlanService } from '../follow-up-plan/follow-up-plan.service';
import { CareReminderService } from '../care-reminder/care-reminder.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private followUpPlanService: FollowUpPlanService,
    private careReminderService: CareReminderService,
  ) {}

  /** 每天早上 9 点检查今日跟进提醒 */
  @Cron('0 9 * * *')
  async checkTodayReminders() {
    this.logger.log('[Scheduler] 开始检查今日跟进提醒');
    try {
      await this.followUpPlanService.checkTodayReminders();
      this.logger.log('[Scheduler] 今日跟进提醒检查完成');
    } catch (error: any) {
      this.logger.error(`[Scheduler] 今日跟进提醒检查失败: ${error.message}`);
    }
  }

  /** 每天早上 10 点检查逾期策略 */
  @Cron('0 10 * * *')
  async checkOverdueStrategies() {
    this.logger.log('[Scheduler] 开始检查逾期策略');
    try {
      await this.followUpPlanService.checkOverdueStrategies();
      this.logger.log('[Scheduler] 逾期策略检查完成');
    } catch (error: any) {
      this.logger.error(`[Scheduler] 逾期策略检查失败: ${error.message}`);
    }
  }

  /** 每天早上 8 点检查生日/纪念日关怀 */
  @Cron('0 8 * * *')
  async checkCareReminders() {
    this.logger.log('[Scheduler] 开始检查关怀提醒');
    try {
      await this.careReminderService.checkAndGenerateReminders();
      this.logger.log('[Scheduler] 关怀提醒检查完成');
    } catch (error: any) {
      this.logger.error(`[Scheduler] 关怀提醒检查失败: ${error.message}`);
    }
  }
}
