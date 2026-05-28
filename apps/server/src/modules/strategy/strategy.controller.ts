import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StrategyService } from './strategy.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('管理员 - 策略模板管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/strategy-templates')
export class StrategyController {
  constructor(private readonly strategyService: StrategyService) {}

  @Get()
  @ApiOperation({ summary: '策略模板列表' })
  @Roles('admin', 'consultant')
  findAll() {
    return this.strategyService.findAll();
  }

  @Post()
  @ApiOperation({ summary: '创建策略模板' })
  @Roles('admin')
  create(@Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.strategyService.create(dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '策略模板详情' })
  @Roles('admin', 'consultant')
  findOne(@Param('id') id: string) {
    return this.strategyService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑策略模板' })
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.strategyService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除策略模板' })
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.strategyService.remove(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '启用/停用模板' })
  @Roles('admin')
  toggleStatus(@Param('id') id: string) {
    return this.strategyService.toggleStatus(id);
  }
}
