import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto, AddTagDto, AddPreferenceDto, AddProjectDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('客户管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @ApiOperation({ summary: '客户列表（admin 看全部，consultant 看自己的）' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词搜索（姓名/手机号）' })
  @ApiQuery({ name: 'status', required: false, description: '状态筛选' })
  @ApiQuery({ name: 'budgetSensitivity', required: false, description: '预算敏感度筛选' })
  findAll(
    @CurrentUser('role') role: string,
    @CurrentUser('userId') userId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('budgetSensitivity') budgetSensitivity?: string,
  ) {
    return this.customerService.findAll(role, userId, {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      keyword,
      status,
      budgetSensitivity,
    });
  }

  @Post()
  @ApiOperation({ summary: '创建客户' })
  create(@Body() dto: CreateCustomerDto, @CurrentUser('userId') userId: string) {
    return this.customerService.create(dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '客户详情（含全息画像）' })
  findOne(@Param('id') id: string, @CurrentUser('role') role: string, @CurrentUser('userId') userId: string) {
    return this.customerService.findOne(id, role, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新客户信息' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto,
    @CurrentUser('role') role: string, @CurrentUser('userId') userId: string) {
    return this.customerService.update(id, dto, role, userId);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: '添加标签' })
  addTag(@Param('id') id: string, @Body() dto: AddTagDto,
    @CurrentUser('role') role: string, @CurrentUser('userId') userId: string) {
    return this.customerService.addTag(id, dto, role, userId);
  }

  @Delete(':id/tags/:tagId')
  @ApiOperation({ summary: '删除标签' })
  removeTag(@Param('id') id: string, @Param('tagId') tagId: string,
    @CurrentUser('role') role: string, @CurrentUser('userId') userId: string) {
    return this.customerService.removeTag(id, tagId, role, userId);
  }

  @Post(':id/preferences')
  @ApiOperation({ summary: '添加喜好备忘' })
  addPreference(@Param('id') id: string, @Body() dto: AddPreferenceDto,
    @CurrentUser('role') role: string, @CurrentUser('userId') userId: string) {
    return this.customerService.addPreference(id, dto, role, userId);
  }

  @Delete(':id/preferences/:prefId')
  @ApiOperation({ summary: '删除喜好备忘' })
  removePreference(@Param('id') id: string, @Param('prefId') prefId: string,
    @CurrentUser('role') role: string, @CurrentUser('userId') userId: string) {
    return this.customerService.removePreference(id, prefId, role, userId);
  }

  @Post(':id/projects')
  @ApiOperation({ summary: '添加项目时间轴' })
  addProject(@Param('id') id: string, @Body() dto: AddProjectDto,
    @CurrentUser('userId') userId: string) {
    return this.customerService.addProject(id, dto, userId);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: '获取项目时间轴' })
  getTimeline(@Param('id') id: string,
    @CurrentUser('role') role: string, @CurrentUser('userId') userId: string) {
    return this.customerService.getTimeline(id, role, userId);
  }
}
