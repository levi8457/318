import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowUpPlan } from './entities/follow-up-plan.entity';
import { FollowUpPlanService } from './follow-up-plan.service';
import { FollowUpPlanController } from './follow-up-plan.controller';
import { NotificationModule } from '../notification/notification.module';
import { TaskReminder } from '../task/entities/task.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FollowUpPlan, TaskReminder, User]),
    forwardRef(() => NotificationModule),
  ],
  controllers: [FollowUpPlanController],
  providers: [FollowUpPlanService],
  exports: [FollowUpPlanService],
})
export class FollowUpPlanModule {}
