import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CareReminderService } from './care-reminder.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('关怀提醒')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('care-reminders')
export class CareReminderController {
  constructor(private readonly careReminderService: CareReminderService) {}

  @Post('check')
  @Roles('admin')
  @ApiOperation({ summary: '检查并生成关怀提醒（管理员）' })
  checkAndGenerate() {
    return this.careReminderService.checkAndGenerateReminders();
  }
}
