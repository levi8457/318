import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoldenScript } from './entities/script.entity';
import { ScriptService } from './script.service';
import { ScriptController } from './script.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GoldenScript])],
  controllers: [ScriptController],
  providers: [ScriptService],
  exports: [ScriptService],
})
export class ScriptModule {}
