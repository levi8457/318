import { Controller, Get, Put, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('通知')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '获取当前用户通知列表' })
  @ApiQuery({ name: 'isRead', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  findAll(
    @CurrentUser('userId') userId: string,
    @Query('isRead') isRead?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.notificationService.findByUser(userId, {
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读通知数量' })
  getUnreadCount(@CurrentUser('userId') userId: string) {
    return this.notificationService.getUnreadCount(userId).then(count => ({ count }));
  }

  @Put(':id/read')
  @ApiOperation({ summary: '标记通知为已读' })
  markAsRead(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.notificationService.markAsRead(id, userId);
  }

  @Put('read-all')
  @ApiOperation({ summary: '标记所有通知为已读' })
  markAllAsRead(@CurrentUser('userId') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }
}
