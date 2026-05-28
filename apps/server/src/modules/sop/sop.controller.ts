import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SopService } from './sop.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('管理员 - SOP模板管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/sop-templates')
export class SopController {
  constructor(private readonly sopService: SopService) {}

  @Get()
  @ApiOperation({ summary: 'SOP模板列表' })
  findAll() {
    return this.sopService.findAll();
  }

  @Post()
  @ApiOperation({ summary: '创建SOP模板' })
  create(@Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.sopService.create(dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'SOP模板详情' })
  findOne(@Param('id') id: string) {
    return this.sopService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑SOP模板' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.sopService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除SOP模板' })
  remove(@Param('id') id: string) {
    return this.sopService.remove(id);
  }
}
