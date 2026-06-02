import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerProfile } from '../customer/entities/customer.entity';
import { ConsultationSession } from '../session/entities/session.entity';
import { GoldenScript } from '../script/entities/script.entity';
import { TaskReminder } from '../task/entities/task.entity';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerProfile, ConsultationSession, GoldenScript, TaskReminder])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
