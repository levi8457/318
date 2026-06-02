import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('营销中心')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  @ApiOperation({ summary: '活动列表' })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.campaignService.findAll({ keyword, status });
  }

  @Post()
  @ApiOperation({ summary: '创建活动（管理员）' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(@Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.campaignService.create(dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '活动详情' })
  findOne(@Param('id') id: string) {
    return this.campaignService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑活动（管理员）' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.campaignService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除活动（管理员）' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.campaignService.remove(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新活动状态（管理员）' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.campaignService.updateStatus(id, status);
  }

  @Post(':id/match')
  @ApiOperation({ summary: 'AI 匹配目标客户' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  matchCustomers(@Param('id') id: string) {
    return this.campaignService.matchCustomers(id);
  }

  @Post(':id/generate')
  @ApiOperation({ summary: 'AI 生成个性化话术' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  generateMessages(@Param('id') id: string) {
    return this.campaignService.generateMessages(id);
  }

  @Get(':id/outreaches')
  @ApiOperation({ summary: '触达记录' })
  getOutreaches(@Param('id') id: string) {
    return this.campaignService.getOutreaches(id);
  }

  @Put('outreaches/:outreachId/status')
  @ApiOperation({ summary: '更新触达状态' })
  updateOutreachStatus(
    @Param('outreachId') outreachId: string,
    @Body('status') status: string,
  ) {
    return this.campaignService.updateOutreachStatus(outreachId, status);
  }
}
