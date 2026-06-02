import { Injectable } from '@nestjs/common';
import { llmService } from '@tongquetai/ai-engine';

@Injectable()
export class AiChatService {
  async chat(message: string, userId: string): Promise<string> {
    const prompt = `你是一位专业的医美咨询顾问AI助手。请根据用户的问题提供专业、有帮助的回答。

用户问题：${message}

请简洁、专业地回答，不要超过300字。`;

    try {
      const response = await llmService.generate({ prompt, maxTokens: 500 });
      return response.content;
    } catch (error: any) {
      return '抱歉，AI 服务暂时不可用，请稍后再试。';
    }
  }
}
