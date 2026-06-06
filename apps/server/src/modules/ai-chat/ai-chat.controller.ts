import { Controller, Get, Post, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiChatService } from './ai-chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('AI 助手')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('chat')
  @ApiOperation({ summary: 'AI 对话' })
  chat(
    @CurrentUser('userId') userId: string,
    @Body('message') message: string,
    @Body('sessionId') sessionId?: string,
  ) {
    return this.aiChatService.chat(userId, message, sessionId);
  }

  @Get('history')
  @ApiOperation({ summary: '获取对话历史' })
  getHistory(
    @CurrentUser('userId') userId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.aiChatService.getConversationList(userId, sessionId);
  }

  @Delete('history')
  @ApiOperation({ summary: '清空对话历史' })
  clearHistory(
    @CurrentUser('userId') userId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.aiChatService.clearHistory(userId, sessionId);
  }

  @Get('knowledge')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '获取知识库列表（管理员）' })
  getKnowledge(@Query('category') category?: string) {
    return this.aiChatService.getKnowledgeList(category);
  }

  @Post('knowledge')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '添加知识库条目（管理员）' })
  addKnowledge(
    @Body() data: { category: 'faq' | 'script' | 'strategy' | 'case' | 'preference'; title: string; content: string; context?: string },
  ) {
    return this.aiChatService.addKnowledge(data);
  }

  @Post('knowledge/:id/score')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '更新知识库效果评分（管理员）' })
  updateKnowledgeScore(
    @Param('id') id: string,
    @Body('score') score: number,
  ) {
    return this.aiChatService.updateKnowledgeScore(id, score);
  }
}
