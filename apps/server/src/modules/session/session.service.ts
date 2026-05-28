import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultationSession } from './entities/session.entity';
import { Tag } from '../customer/entities/customer.entity';

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
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(customerId: string, consultantId: string, transcript?: string) {
    const session = await this.sessionRepo.save({
      customerId,
      consultantId,
      transcript: transcript || '',
      status: 'transcribing',
    });

    await this.mockAIAnalysis(session.id);

    return this.sessionRepo.findOne({ where: { id: session.id } });
  }

  async createWithAudio(customerId: string, consultantId: string, audioUrl: string, transcript: string) {
    const session = await this.sessionRepo.save({
      customerId,
      consultantId,
      audioUrl,
      transcript,
      status: 'transcribing',
    });

    await this.mockAIAnalysis(session.id);

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
      relations: ['customer'],
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
    return this.mockAIAnalysis(id);
  }

  async reanalyze(sessionId: string, newTranscript: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('会话不存在');

    await this.sessionRepo.update(sessionId, {
      transcript: newTranscript,
      status: 'transcribing',
    });

    return this.mockAIAnalysis(sessionId);
  }

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
    if (lowerTranscript.includes(' liposuction ') || lowerTranscript.includes('抽脂')) {
      tags.push({ category: '项目意向', value: ' liposuction 塑形' });
    }
    if (lowerTranscript.includes('抗衰') || lowerTranscript.includes('紧致') || lowerTranscript.includes('松弛')) {
      tags.push({ category: '项目意向', value: '面部抗衰' });
    }

    if (lowerTranscript.includes('贵') || lowerTranscript.includes('便宜') || lowerTranscript.includes('多少钱')) {
      tags.push({ category: '预算敏感度', value: '高敏感' });
    } else if (lowerTranscript.includes('预算') && lowerTranscript.includes('没问题') || lowerTranscript.includes('钱不是问题')) {
      tags.push({ category: '预算敏感度', value: '低敏感' });
    }

    if (lowerTranscript.includes('疼') || lowerTranscript.includes('痛')) {
      tags.push({ category: '核心顾虑', value: '怕疼' });
    }
    if (lowerTranscript.includes('效果') || lowerTranscript.includes('有用吗')) {
      tags.push({ category: '核心顾虑', value: '效果顾虑' });
    }
    if (lowerTranscript.includes('安全') || lowerTranscript.includes('风险')) {
      tags.push({ category: '核心顾虑', value: '安全顾虑' });
    }
    if (lowerTranscript.includes('恢复') || lowerTranscript.includes('恢复期')) {
      tags.push({ category: '核心顾虑', value: '恢复期顾虑' });
    }

    if (lowerTranscript.includes('老公') || lowerTranscript.includes('老公同意') || lowerTranscript.includes('和老公')) {
      tags.push({ category: '决策人', value: '需配偶确认' });
    }

    if (lowerTranscript.includes('朋友') || lowerTranscript.includes('介绍')) {
      tags.push({ category: '客户来源', value: '朋友推荐' });
    }
    if (lowerTranscript.includes('抖音') || lowerTranscript.includes('小红书')) {
      tags.push({ category: '客户来源', value: '社交媒体' });
    }

    const savedTags: Tag[] = [];
    for (const tag of tags) {
      const newTag = this.tagRepo.create({ customerId, ...tag });
      savedTags.push(await this.tagRepo.save(newTag));
    }

    return savedTags;
  }

  private async mockAIAnalysis(sessionId: string) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('会话不存在');

    if (session.transcript) {
      await this.extractTagsFromTranscript(session.transcript, session.customerId);
    }

    await this.sessionRepo.update(sessionId, {
      status: 'completed',
      summary: '客户对面部抗衰项目有明确意向，主要关注热玛吉和超声炮的效果对比。客户预算充足但担心疼痛感，需要重点展示舒适化治疗方案和成功案例。',
      keyPoints: [
        { topic: '面部抗衰', description: '客户希望改善面部松弛和法令纹', intent: 'high' },
        { topic: '热玛吉', description: '对热玛吉有初步了解，关注效果持续时间', intent: 'high' },
        { topic: '疼痛顾虑', description: '担心治疗过程的疼痛感', intent: 'medium' },
      ],
      blockers: [
        { type: 'pain', detail: '担心治疗疼痛', suggestedResponse: '我院采用舒适化无痛打法，配合表麻，90%客户反馈无痛感' },
        { type: 'trust', detail: '担心效果不明显', suggestedResponse: '展示我院热玛吉前后对比案例，突出真实效果' },
      ],
      decisionMakers: ['本人'],
      followUpStrategy: {
        summary: '客户对面部抗衰有明确需求，预算充足。核心卡点是疼痛顾虑和效果信任。建议重点推送舒适化治疗方案和真实案例，建立信任后促成到院体验。',
        talkingPoints: [
          '王姐，关于您担心的疼痛问题，我院采用的是舒适化无痛打法，配合表麻几乎感觉不到疼痛，很多怕疼的客户都能轻松完成治疗。',
          '我这边有几个和您情况类似的客户案例，做完热玛吉后法令纹明显变浅，效果非常自然，我发给您看看？',
          '建议您先到院做一个面部检测，医生会根据您的具体情况制定个性化方案，检测是完全免费的。',
        ],
        bestFollowUpTime: '面诊后24小时内，建议上午10点联系',
        caseReferences: ['热玛吉面部抗衰成功案例1', '怕疼客户舒适化治疗案例', '法令纹改善对比案例'],
        templateId: 'default-hotmagic-strategy',
        templateName: '热玛吉术后跟进策略',
      },
    } as any);

    return this.sessionRepo.findOne({ where: { id: sessionId } });
  }
}
