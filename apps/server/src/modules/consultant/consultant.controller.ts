import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConsultantService } from './consultant.service';
import { CreateConsultantDto, UpdateConsultantDto, ResetPasswordDto } from './dto/consultant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('管理员 - 咨询师管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/consultants')
export class ConsultantController {
  constructor(private readonly consultantService: ConsultantService) {}

  @Get()
  @ApiOperation({ summary: '咨询师列表（含绩效指标）' })
  findAll() {
    return this.consultantService.findAll();
  }

  @Post()
  @ApiOperation({ summary: '新增咨询师' })
  create(@Body() dto: CreateConsultantDto) {
    return this.consultantService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '咨询师详情' })
  findOne(@Param('id') id: string) {
    return this.consultantService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑咨询师信息' })
  update(@Param('id') id: string, @Body() dto: UpdateConsultantDto) {
    return this.consultantService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除咨询师（软删除）' })
  remove(@Param('id') id: string) {
    return this.consultantService.remove(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '启用/停用咨询师' })
  toggleStatus(@Param('id') id: string) {
    return this.consultantService.toggleStatus(id);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: '重置咨询师密码' })
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.consultantService.resetPassword(id, dto.newPassword);
  }
}
