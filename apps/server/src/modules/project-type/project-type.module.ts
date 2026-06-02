import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectType } from './entities/project-type.entity';
import { ProjectTypeService } from './project-type.service';
import { ProjectTypeController } from './project-type.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectType])],
  controllers: [ProjectTypeController],
  providers: [ProjectTypeService],
  exports: [ProjectTypeService],
})
export class ProjectTypeModule {}
