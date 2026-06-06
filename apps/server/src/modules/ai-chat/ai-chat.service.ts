import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiKnowledgeBase } from './entities/ai-knowledge-base.entity';
import { llmService } from '@tongquetai/ai-engine';

const MEDICAL_AESTHETICS_SYSTEM_PROMPT = `你是一位资深的医美咨询顾问 AI 助手，名叫"铜雀台智囊"。

## 你的专业领域
- 医美项目知识（热玛吉、超声炮、玻尿酸、肉毒素、双眼皮、隆鼻等）
- 客户沟通技巧（如何应对价格异议、疼痛顾虑、信任问题）
- 术后护理指导（恢复期注意事项、复诊提醒）
- 营销策略（如何提升转化率、客户维护、话术优化）
- 团队管理（咨询师培训、绩效考核、流程优化）

## 你的回答原则
1. 专业：基于医美行业知识，提供准确、专业的建议
2. 实用：给出可直接执行的具体话术和行动方案
3. 温暖：体现对客户的关怀和理解
4. 简洁：回答控制在300字以内，重点突出

## 回答格式
- 使用清晰的结构（要点、步骤）
- 提供具体的话术示例
- 必要时给出注意事项

请用中文回答。`;

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    @InjectRepository(AiConversation)
    private conversationRepo: Repository<AiConversation>,
    @InjectRepository(AiKnowledgeBase)
    private knowledgeRepo: Repository<AiKnowledgeBase>,
  ) {}

  /** AI 对话 */
  async chat(userId: string, message: string, sessionId?: string): Promise<{
    response: string;
    conversationId: string;
  }> {
    try {
      // 获取相关知识
      const relevantKnowledge = await this.getRelevantKnowledge(message);

      // 获取历史对话（最近5轮）
      const history = await this.getConversationHistory(userId, sessionId, 5);

      // 构建消息
      const messages = this.buildMessages(message, history, relevantKnowledge);

      // 调用 LLM
      const response = await llmService.generate({
        prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n\n'),
        maxTokens: 1000,
        temperature: 0.7,
      });

      // 保存对话记录
      const userConversation = await this.conversationRepo.save({
        userId,
        sessionId,
        role: 'user',
        content: message,
        contextType: sessionId ? 'session' : 'general',
      });

      await this.conversationRepo.save({
        userId,
        sessionId,
        role: 'assistant',
        content: response.content,
        contextType: sessionId ? 'session' : 'general',
        metadata: { isMock: response.isMock || false },
      });

      // 更新知识库使用统计
      await this.updateKnowledgeUsage(relevantKnowledge);

      return {
        response: response.content,
        conversationId: userConversation.id,
      };
    } catch (error: any) {
      this.logger.error(`[AiChat] 对话失败: ${error.message}`);
      return {
        response: '抱歉，AI 服务暂时不可用，请稍后再试。',
        conversationId: '',
      };
    }
  }

  /** 获取相关知识 */
  private async getRelevantKnowledge(message: string): Promise<AiKnowledgeBase[]> {
    const keywords = this.extractKeywords(message);
    if (keywords.length === 0) return [];

    const qb = this.knowledgeRepo.createQueryBuilder('k');
    qb.where('k.is_active = true');

    const conditions = keywords.map((kw, i) => `(k.title ILIKE :kw${i} OR k.content ILIKE :kw${i})`).join(' OR ');
    const params: Record<string, string> = {};
    keywords.forEach((kw, i) => { params[`kw${i}`] = `%${kw}%`; });

    qb.andWhere(`(${conditions})`, params);
    qb.orderBy('k.effectiveness_score', 'DESC');
    qb.limit(3);

    return qb.getMany();
  }

  /** 提取关键词 */
  private extractKeywords(text: string): string[] {
    const medicalKeywords = [
      '热玛吉', '超声炮', '玻尿酸', '肉毒素', '双眼皮', '隆鼻', '吸脂', '光子嫩肤', '水光针',
      '疼痛', '价格', '效果', '恢复', '安全', '风险', '术后', '复诊',
      '客户', '咨询', '跟进', '话术', '转化', '营销',
    ];

    return medicalKeywords.filter(kw => text.includes(kw));
  }

  /** 获取对话历史 */
  private async getConversationHistory(userId: string, sessionId?: string, limit: number = 5): Promise<AiConversation[]> {
    const qb = this.conversationRepo.createQueryBuilder('c');
    qb.where('c.user_id = :userId', { userId });

    if (sessionId) {
      qb.andWhere('c.session_id = :sessionId', { sessionId });
    }

    qb.orderBy('c.created_at', 'DESC');
    qb.take(limit * 2); // 获取最近N轮对话（用户+助手各一条）

    const conversations = await qb.getMany();
    return conversations.reverse(); // 按时间正序
  }

  /** 构建消息 */
  private buildMessages(
    currentMessage: string,
    history: AiConversation[],
    knowledge: AiKnowledgeBase[],
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // System prompt
    let systemPrompt = MEDICAL_AESTHETICS_SYSTEM_PROMPT;

    // 添加相关知识
    if (knowledge.length > 0) {
      systemPrompt += '\n\n## 相关知识库\n';
      knowledge.forEach(k => {
        systemPrompt += `\n### ${k.title}\n${k.content}\n`;
      });
    }

    messages.push({ role: 'system', content: systemPrompt });

    // 添加历史对话
    history.forEach(conv => {
      messages.push({ role: conv.role, content: conv.content });
    });

    // 添加当前消息
    messages.push({ role: 'user', content: currentMessage });

    return messages;
  }

  /** 更新知识库使用统计 */
  private async updateKnowledgeUsage(knowledge: AiKnowledgeBase[]) {
    for (const k of knowledge) {
      await this.knowledgeRepo.update(k.id, {
        usageCount: k.usageCount + 1,
      });
    }
  }

  /** 获取对话历史列表 */
  async getConversationList(userId: string, sessionId?: string) {
    const qb = this.conversationRepo.createQueryBuilder('c');
    qb.where('c.user_id = :userId', { userId });

    if (sessionId) {
      qb.andWhere('c.session_id = :sessionId', { sessionId });
    }

    qb.orderBy('c.created_at', 'DESC');
    qb.limit(50);

    return qb.getMany();
  }

  /** 清空对话历史 */
  async clearHistory(userId: string, sessionId?: string) {
    const qb = this.conversationRepo.createQueryBuilder();
    qb.delete()
      .where('user_id = :userId', { userId });

    if (sessionId) {
      qb.andWhere('session_id = :sessionId', { sessionId });
    }

    await qb.execute();
    return { message: '对话历史已清空' };
  }

  /** 添加知识库条目（自我进化） */
  async addKnowledge(data: {
    category: 'faq' | 'script' | 'strategy' | 'case' | 'preference';
    title: string;
    content: string;
    context?: string;
  }) {
    return this.knowledgeRepo.save({
      category: data.category,
      title: data.title,
      content: data.content,
      context: data.context,
    });
  }

  /** 获取知识库列表 */
  async getKnowledgeList(category?: string) {
    const qb = this.knowledgeRepo.createQueryBuilder('k');
    qb.where('k.is_active = true');

    if (category) {
      qb.andWhere('k.category = :category', { category });
    }

    qb.orderBy('k.effectiveness_score', 'DESC');
    return qb.getMany();
  }

  /** 更新知识库条目效果评分 */
  async updateKnowledgeScore(id: string, score: number) {
    await this.knowledgeRepo.update(id, { effectivenessScore: score });
    return { message: '评分已更新' };
  }
}
