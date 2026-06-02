import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerProfile } from '../customer/entities/customer.entity';
import { User } from '../auth/entities/user.entity';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerProfile, User])],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
