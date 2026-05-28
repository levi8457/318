import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { AsrService } from './services/asr.service';
import { ConsultationSession } from '../session/entities/session.entity';
import { Tag } from '../customer/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsultationSession, Tag]),
  ],
  controllers: [UploadController],
  providers: [UploadService, AsrService],
  exports: [UploadService, AsrService],
})
export class UploadModule {}
