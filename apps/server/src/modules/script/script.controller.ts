import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ScriptService } from './script.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('话术库')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scripts')
export class ScriptController {
  constructor(private readonly scriptService: ScriptService) {}

  @Get()
  @ApiOperation({ summary: '话术列表（咨询师只看已审核）' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  findAll(
    @CurrentUser('role') role: string,
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
  ) {
    if (role === 'admin') {
      return this.scriptService.findAllAdmin();
    }
    return this.scriptService.findAll(category, keyword);
  }

  @Post('generate')
  @ApiOperation({ summary: 'AI 生成话术' })
  generate(@Body() dto: { category: string; scenario: string }) {
    return this.scriptService.generate(dto.category, dto.scenario);
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑话术（管理员）' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.scriptService.update(id, dto);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: '审核话术（管理员）' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  approve(@Param('id') id: string) {
    return this.scriptService.approve(id);
  }
}
