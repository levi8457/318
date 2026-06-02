import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultationSession } from './entities/session.entity';
import { Tag } from '../customer/entities/customer.entity';
import { llmService } from '@tongquetai/ai-engine';
import { SESSION_ANALYSIS_PROMPT } from '@tongquetai/ai-engine';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(ConsultationSession)
    private sessionRepo: Repository<ConsultationSession>,
    @InjectRepository(Tag)
    private tagRepo: Repository<Tag>,
  ) {}

  async findAll(userRole: string, userId: string) {
    const where: any = {};
    if (userRole === 'consultant') {
      where.consultantId = userId;
    }
    return this.sessionRepo.find({
      where,
      relations: ['customer', 'consultant'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(customerId: string, consultantId: string, transcript?: string) {
    // 如果有转写文本，直接进入转写中状态；否则为待处理状态
    const hasTranscript = !!transcript && transcript.trim().length > 0;

    const session = await this.sessionRepo.save({
      customerId,
      consultantId,
      transcript: transcript || '',
      status: hasTranscript ? 'transcribing' : 'pending',
    });

    // 如果有转写文本，直接进行 AI 分析
    if (hasTranscript) {
      await this.analyzeWithLLM(session.id);
    }

    return this.sessionRepo.findOne({ where: { id: session.id } });
  }

  async createWithAudio(customerId: string, consultantId: string, audioUrl: string, transcript: string) {
    const session = await this.sessionRepo.save({
      customerId,
      consultantId,
      audioUrl,
      transcript,
      status: 'completed',
    });

    // 有转写文本，直接进行 AI 分析
    await this.analyzeWithLLM(session.id);

    return this.sessionRepo.findOne({ where: { id: session.id } });
  }

  async updateTranscript(sessionId: string, transcript: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('会话不存在');

    await this.sessionRepo.update(sessionId, { transcript });
    return this.sessionRepo.findOne({ where: { id: sessionId } });
  }

  async findOne(id: string, userRole: string, userId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id },
      relations: ['customer', 'consultant'],
    });
    if (!session) throw new NotFoundException('会话不存在');

    if (userRole === 'consultant' && session.consultantId !== userId) {
      throw new NotFoundException('会话不存在');
    }
    return session;
  }

  async analyze(id: string) {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) throw new NotFoundException('会话不存在');
    return this.analyzeWithLLM(id);
  }

  async reanalyze(sessionId: string, newTranscript: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('会话不存在');

    await this.sessionRepo.update(sessionId, {
      transcript: newTranscript,
      status: 'transcribing',
    });

    return this.analyzeWithLLM(sessionId);
  }

  /**
   * 使用 LLM 分析会话
   */
  private async analyzeWithLLM(sessionId: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('会话不存在');

    if (!session.transcript) {
      await this.sessionRepo.update(sessionId, { status: 'completed' });
      return this.sessionRepo.findOne({ where: { id: sessionId } });
    }

    try {
      // 构建 prompt
      const prompt = SESSION_ANALYSIS_PROMPT.replace('{{transcript}}', session.transcript);

      // 调用 LLM
      const response = await llmService.generate({ prompt });

      // 解析 LLM 返回的 JSON
      const analysis = this.parseAnalysisResponse(response.content);

      // 提取并保存标签
      if (analysis.tags?.length) {
        await this.extractAndSaveTags(analysis.tags, session.customerId);
      }

      // 更新会话
      await this.sessionRepo.update(sessionId, {
        status: 'completed',
        summary: analysis.summary || '',
        keyPoints: analysis.keyPoints || [],
        blockers: analysis.blockers || [],
        decisionMakers: analysis.decisionMakers || [],
        followUpStrategy: analysis.followUpStrategy || {},
      } as any);

      return this.sessionRepo.findOne({ where: { id: sessionId } });
    } catch (error: any) {
      console.error('[Session] LLM 分析失败:', error.message);
      // 降级为关键词提取
      await this.fallbackAnalysis(sessionId, session);
      return this.sessionRepo.findOne({ where: { id: sessionId } });
    }
  }

  /**
   * 解析 LLM 返回的分析结果
   */
  private parseAnalysisResponse(content: string): any {
    try {
      // 尝试直接解析 JSON
      return JSON.parse(content);
    } catch {
      // 尝试从 markdown 代码块中提取 JSON
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1].trim());
        } catch {
          // 忽略
        }
      }

      // 尝试从内容中查找 JSON 对象
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch {
          // 忽略
        }
      }

      // 解析失败，返回默认结构
      return {
        summary: content.substring(0, 200),
        keyPoints: [],
        blockers: [],
        decisionMakers: [],
        tags: [],
        followUpStrategy: {
          summary: content.substring(0, 200),
          talkingPoints: [],
          bestFollowUpTime: '面诊后24小时内',
          caseReferences: [],
        },
      };
    }
  }

  /**
   * 保存 LLM 提取的标签
   */
  private async extractAndSaveTags(tags: { category: string; value: string }[], customerId: string) {
    for (const tag of tags) {
      // 检查是否已存在相同标签
      const existing = await this.tagRepo.findOne({
        where: { customerId, category: tag.category, value: tag.value },
      });
      if (!existing) {
        const newTag = this.tagRepo.create({ customerId, ...tag });
        await this.tagRepo.save(newTag);
      }
    }
  }

  /**
   * 降级分析：使用关键词提取
   */
  private async fallbackAnalysis(sessionId: string, session: any) {
    await this.extractTagsFromTranscript(session.transcript, session.customerId);

    await this.sessionRepo.update(sessionId, {
      status: 'completed',
      summary: '（离线模式）客户面诊记录已保存，AI 分析暂时不可用。',
      keyPoints: [],
      blockers: [],
      decisionMakers: [],
      followUpStrategy: {
        summary: '（离线模式）建议参考管理员配置的策略模板进行跟进。',
        talkingPoints: [],
        bestFollowUpTime: '面诊后24小时内',
        caseReferences: [],
      },
    } as any);
  }

  /**
   * 关键词提取标签（降级方案）
   */
  private async extractTagsFromTranscript(transcript: string, customerId: string): Promise<Tag[]> {
    const tags: { category: string; value: string }[] = [];
    const lowerTranscript = transcript.toLowerCase();

    if (lowerTranscript.includes('热玛吉') || lowerTranscript.includes('thermage')) {
      tags.push({ category: '项目意向', value: '热玛吉' });
    }
    if (lowerTranscript.includes('超声炮') || lowerTranscript.includes('超声')) {
      tags.push({ category: '项目意向', value: '超声炮' });
    }
    if (lowerTranscript.includes('隆鼻') || lowerTranscript.includes('鼻')) {
      tags.push({ category: '项目意向', value: '鼻部整形' });
    }
    if (lowerTranscript.includes('双眼皮') || lowerTranscript.includes('眼')) {
      tags.push({ category: '项目意向', value: '眼部整形' });
    }
    if (lowerTranscript.includes('填充') || lowerTranscript.includes('玻尿酸')) {
      tags.push({ category: '项目意向', value: '填充注射' });
    }
    if (lowerTranscript.includes('抗衰') || lowerTranscript.includes('紧致') || lowerTranscript.includes('松弛')) {
      tags.push({ category: '项目意向', value: '面部抗衰' });
    }

    if (lowerTranscript.includes('贵') || lowerTranscript.includes('便宜') || lowerTranscript.includes('多少钱')) {
      tags.push({ category: '预算敏感度', value: '高敏感' });
    }

    if (lowerTranscript.includes('疼') || lowerTranscript.includes('痛')) {
      tags.push({ category: '核心顾虑', value: '怕疼' });
    }
    if (lowerTranscript.includes('效果') || lowerTranscript.includes('有用吗')) {
      tags.push({ category: '核心顾虑', value: '效果顾虑' });
    }

    if (lowerTranscript.includes('老公') || lowerTranscript.includes('老公同意')) {
      tags.push({ category: '决策人', value: '需配偶确认' });
    }

    const savedTags: Tag[] = [];
    for (const tag of tags) {
      const existing = await this.tagRepo.findOne({
        where: { customerId, category: tag.category, value: tag.value },
      });
      if (!existing) {
        const newTag = this.tagRepo.create({ customerId, ...tag });
        savedTags.push(await this.tagRepo.save(newTag));
      }
    }

    return savedTags;
  }
}
