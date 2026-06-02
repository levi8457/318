import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('数据导入')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('customers')
  @Roles('admin')
  @ApiOperation({ summary: '从 CSV 导入客户（管理员）' })
  async importCustomers(
    @Body('csv') csvContent: string,
    @CurrentUser('userId') userId: string,
  ) {
    if (!csvContent) {
      throw new BadRequestException('请提供 CSV 内容');
    }
    return this.importService.importCustomers(csvContent, userId);
  }
}
