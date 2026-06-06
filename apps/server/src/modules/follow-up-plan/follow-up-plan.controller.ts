import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FollowUpPlanService } from './follow-up-plan.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('跟进策略')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('follow-up-plans')
export class FollowUpPlanController {
  constructor(private readonly planService: FollowUpPlanService) {}

  @Get()
  @ApiOperation({ summary: '获取策略列表' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  findAll(
    @CurrentUser('role') role: string,
    @CurrentUser('userId') userId: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.planService.findAll(role, userId, { status, customerId });
  }

  @Get('stats')
  @ApiOperation({ summary: '获取策略统计' })
  getStats(
    @CurrentUser('role') role: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.planService.getStats(role, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取策略详情' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.planService.findOne(id, role, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑策略' })
  update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() data: {
      consultantNotes?: string;
      talkingPoints?: string[];
      bestFollowUpTime?: string;
      blockers?: Array<{ type: string; detail: string; response: string }>;
    },
  ) {
    return this.planService.update(id, userId, data);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认策略' })
  confirm(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() data?: {
      consultantNotes?: string;
      talkingPoints?: string[];
      bestFollowUpTime?: string;
    },
  ) {
    return this.planService.confirm(id, userId, data);
  }

  @Post(':id/follow-up')
  @ApiOperation({ summary: '记录跟进结果' })
  addFollowUpRecord(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() record: {
      method: string;
      result: string;
      notes: string;
      nextFollowUpDate?: string;
    },
  ) {
    return this.planService.addFollowUpRecord(id, userId, record);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成策略' })
  complete(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.planService.complete(id, userId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消策略' })
  cancel(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.planService.cancel(id, userId);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: '获取客户的所有策略' })
  findByCustomer(
    @Param('customerId') customerId: string,
    @CurrentUser('role') role: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.planService.findByCustomer(customerId, role, userId);
  }
}
