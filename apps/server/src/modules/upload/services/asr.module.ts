import { Module } from '@nestjs/common';
import { UploadModule } from '../upload.module';
import { AsrService } from './asr.service';
import { ConsultationSession } from '../../session/entities/session.entity';
import { Tag } from '../../customer/entities/customer.entity';

@Module({
  imports: [UploadModule],
  providers: [AsrService],
  exports: [AsrService],
})
export class AsrModule {}
