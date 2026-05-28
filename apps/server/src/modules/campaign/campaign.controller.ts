import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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
  findAll() {
    return this.campaignService.findAll();
  }

  @Post()
  @ApiOperation({ summary: '创建活动（管理员）' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(@Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.campaignService.create(dto, userId);
  }

  @Post(':id/match')
  @ApiOperation({ summary: 'AI 匹配目标客户' })
  matchCustomers(@Param('id') id: string) {
    return this.campaignService.matchCustomers(id);
  }

  @Post(':id/generate')
  @ApiOperation({ summary: 'AI 生成个性化话术' })
  generateMessages(@Param('id') id: string) {
    return this.campaignService.generateMessages(id);
  }

  @Get(':id/outreaches')
  @ApiOperation({ summary: '触达记录' })
  getOutreaches(@Param('id') id: string) {
    return this.campaignService.getOutreaches(id);
  }
}
