import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { CustomerProfile } from '../customer/entities/customer.entity';
import { ConsultationSession } from '../session/entities/session.entity';
import { TaskReminder } from '../task/entities/task.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerProfile, ConsultationSession, TaskReminder, User])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
