import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SOPTemplate } from './entities/sop.entity';
import { SopService } from './sop.service';
import { SopController } from './sop.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SOPTemplate])],
  controllers: [SopController],
  providers: [SopService],
  exports: [SopService],
})
export class SopModule {}
