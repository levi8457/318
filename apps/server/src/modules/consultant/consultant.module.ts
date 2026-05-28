import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultantProfile } from './entities/consultant-profile.entity';
import { User } from '../auth/entities/user.entity';
import { ConsultantService } from './consultant.service';
import { ConsultantController } from './consultant.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConsultantProfile, User])],
  controllers: [ConsultantController],
  providers: [ConsultantService],
  exports: [ConsultantService],
})
export class ConsultantModule {}
