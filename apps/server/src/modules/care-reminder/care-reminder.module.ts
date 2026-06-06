import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerProfile } from '../customer/entities/customer.entity';
import { NotificationModule } from '../notification/notification.module';
import { CareReminderService } from './care-reminder.service';
import { CareReminderController } from './care-reminder.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerProfile]),
    NotificationModule,
  ],
  controllers: [CareReminderController],
  providers: [CareReminderService],
  exports: [CareReminderService],
})
export class CareReminderModule {}
