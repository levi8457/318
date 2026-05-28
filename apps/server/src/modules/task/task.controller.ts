import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class UpdateTaskDto {
  @ApiProperty({ example: 'completed' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  result?: string;
}

class GenerateTasksDto {
  @ApiProperty({ example: 'customer-uuid' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiPropertyOptional({ example: '抗衰' })
  @IsOptional()
  @IsString()
  projectType?: string;
}

@ApiTags('任务管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: '任务列表（admin 看全部，consultant 看自己的）' })
  findAll(@CurrentUser('role') role: string, @CurrentUser('userId') userId: string) {
    return this.taskService.findAll(role, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新任务状态' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.taskService.updateStatus(id, dto.status, dto.result);
  }

  @Post('generate')
  @ApiOperation({ summary: '根据项目自动生成 SOP 任务' })
  generateTasks(@Body() dto: GenerateTasksDto, @CurrentUser('userId') userId: string) {
    return this.taskService.generateTasks(dto.customerId, userId, dto.projectType);
  }

  @Get('calendar')
  @ApiOperation({ summary: '日历视图数据' })
  getCalendar(
    @CurrentUser('role') role: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.taskService.getCalendarSimple(role, userId);
  }
}
