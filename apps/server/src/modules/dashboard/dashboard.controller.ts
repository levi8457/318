import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('仪表盘')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin/dashboard/metrics')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '管理员 — 全局业务指标' })
  getAdminMetrics() {
    return this.dashboardService.getAdminMetrics();
  }

  @Get('admin/dashboard/ranking')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '管理员 — 咨询师业绩排行' })
  getAdminRanking() {
    return this.dashboardService.getAdminRanking();
  }

  @Get('admin/dashboard/trends')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '管理员 — 趋势图表数据' })
  getAdminTrends() {
    return this.dashboardService.getAdminTrends();
  }

  @Get('admin/dashboard/alerts')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '管理员 — 待处理事项' })
  getAdminAlerts() {
    return this.dashboardService.getAdminAlerts();
  }

  @Get('admin/dashboard/funnel')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '管理员 — 客户生命周期漏斗' })
  getCustomerFunnel() {
    return this.dashboardService.getCustomerFunnel();
  }

  @Get('consultant/dashboard/metrics')
  @Roles('consultant')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '咨询师 — 个人指标' })
  getConsultantMetrics(@CurrentUser('userId') userId: string) {
    return this.dashboardService.getConsultantMetrics(userId);
  }

  @Get('consultant/dashboard/today-tasks')
  @Roles('consultant')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '咨询师 — 今日待办' })
  getConsultantTodayTasks(@CurrentUser('userId') userId: string) {
    return this.dashboardService.getConsultantTodayTasks(userId);
  }

  @Get('consultant/dashboard/recent-customers')
  @Roles('consultant')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '咨询师 — 最近活跃客户' })
  getConsultantRecentCustomers(@CurrentUser('userId') userId: string) {
    return this.dashboardService.getConsultantRecentCustomers(userId);
  }
}
