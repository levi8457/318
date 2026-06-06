import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LicenseService } from './license.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('订阅管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('license')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Get()
  @ApiOperation({ summary: '获取当前订阅信息' })
  getLicense() {
    return this.licenseService.getLicenseInfo();
  }

  @Post('upgrade')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '升级版本（管理员）' })
  upgrade(
    @Body('plan') plan: 'basic' | 'professional' | 'enterprise',
    @Body('billingCycle') billingCycle: 'monthly' | 'yearly' = 'monthly',
  ) {
    return this.licenseService.upgradePlan(plan, billingCycle);
  }
}
