import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('全局搜索')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: '全局搜索（客户/会话/话术/任务）' })
  @ApiQuery({ name: 'keyword', required: true })
  search(
    @Query('keyword') keyword: string,
    @CurrentUser('role') role: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.searchService.globalSearch(keyword, role, userId);
  }
}
