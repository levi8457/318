import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { CustomerProfile } from '../customer/entities/customer.entity';
import { ConsultationSession } from '../session/entities/session.entity';
import { TaskReminder } from '../task/entities/task.entity';
import { User } from '../auth/entities/user.entity';
import { GoldenScript } from '../script/entities/script.entity';
import { MarketingCampaign } from '../campaign/entities/campaign.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerProfile,
      ConsultationSession,
      TaskReminder,
      User,
      GoldenScript,
      MarketingCampaign,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
