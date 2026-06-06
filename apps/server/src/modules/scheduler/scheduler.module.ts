import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { FollowUpPlanModule } from '../follow-up-plan/follow-up-plan.module';
import { CareReminderModule } from '../care-reminder/care-reminder.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    FollowUpPlanModule,
    CareReminderModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
