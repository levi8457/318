import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultationSession } from './entities/session.entity';
import { Tag, CustomerProfile, Preference } from '../customer/entities/customer.entity';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { FollowUpPlanModule } from '../follow-up-plan/follow-up-plan.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsultationSession, Tag, CustomerProfile, Preference]),
    forwardRef(() => FollowUpPlanModule),
  ],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
