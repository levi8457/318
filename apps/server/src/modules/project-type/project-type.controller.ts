import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProjectTypeService } from './project-type.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('项目类型管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/project-types')
export class ProjectTypeController {
  constructor(private readonly projectTypeService: ProjectTypeService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '获取项目类型列表' })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  findAll(
    @Query('keyword') keyword?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.projectTypeService.findAll({
      keyword,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('active')
  @Roles('admin', 'consultant')
  @ApiOperation({ summary: '获取启用的项目类型列表' })
  findActive() {
    return this.projectTypeService.findActive();
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建项目类型' })
  create(@Body() dto: { name: string; category?: string }) {
    return this.projectTypeService.create(dto);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: '更新项目类型' })
  update(@Param('id') id: string, @Body() dto: { name?: string; category?: string; isActive?: boolean }) {
    return this.projectTypeService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除项目类型' })
  remove(@Param('id') id: string) {
    return this.projectTypeService.remove(id);
  }

  @Post('batch')
  @Roles('admin')
  @ApiOperation({ summary: '批量创建项目类型' })
  batchCreate(@Body() items: { name: string; category?: string }[]) {
    return this.projectTypeService.batchCreate(items);
  }
}
