import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiKnowledgeBase } from './entities/ai-knowledge-base.entity';
import { AiChatService } from './ai-chat.service';
import { AiChatController } from './ai-chat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AiConversation, AiKnowledgeBase])],
  controllers: [AiChatController],
  providers: [AiChatService],
})
export class AiChatModule {}
