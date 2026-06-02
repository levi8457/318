import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiChatService } from './ai-chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('AI 对话')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('chat')
  @ApiOperation({ summary: 'AI 对话' })
  chat(
    @Body('message') message: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.aiChatService.chat(message, userId).then(response => ({ response }));
  }
}
