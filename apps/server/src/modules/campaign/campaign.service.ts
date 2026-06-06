import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingCampaign, TargetedOutreach } from './entities/campaign.entity';
import { CustomerProfile } from '../customer/entities/customer.entity';
import { llmService } from '@tongquetai/ai-engine';
import { LicenseService } from '../license/license.service';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(MarketingCampaign)
    private campaignRepo: Repository<MarketingCampaign>,
    @InjectRepository(TargetedOutreach)
    private outreachRepo: Repository<TargetedOutreach>,
    @InjectRepository(CustomerProfile)
    private customerRepo: Repository<CustomerProfile>,
    private licenseService: LicenseService,
  ) {}

  async findAll(query?: { keyword?: string; status?: string }) {
    const qb = this.campaignRepo.createQueryBuilder('c');

    if (query?.keyword) {
      qb.andWhere('c.name ILIKE :keyword', { keyword: `%${query.keyword}%` });
    }

    if (query?.status) {
      qb.andWhere('c.status = :status', { status: query.status });
    }

    qb.orderBy('c.created_at', 'DESC');
    return qb.getMany();
  }

  async create(dto: Partial<MarketingCampaign>, userId: string) {
    return this.campaignRepo.save({ ...dto, createdBy: userId });
  }

  async findOne(id: string) {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('营销活动不存在');
    return campaign;
  }

  async update(id: string, dto: Partial<MarketingCampaign>) {
    await this.findOne(id);
    await this.campaignRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.campaignRepo.softDelete(id);
    return { message: '营销活动已删除' };
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    await this.campaignRepo.update(id, { status: status as any });
    return this.findOne(id);
  }

  /** AI 匹配目标客户 */
  async matchCustomers(campaignId: string) {
    // 检查精准营销功能
    await this.licenseService.checkFeature('precisionMarketing');

    const campaign = await this.findOne(campaignId);

    // 查询所有活跃客户
    const customers = await this.customerRepo.find({
      where: { status: 'active' },
      relations: ['tags'],
    });

    const matches: Partial<TargetedOutreach>[] = [];

    for (const customer of customers) {
      let matchScore = 0;
      let matchedReason = '';

      // 检查客户标签是否与活动相关产品匹配
      const customerTags = (customer.tags || []).map((t: any) => t.value.toLowerCase());
      const relatedProducts = campaign.relatedProducts || [];

      for (const product of relatedProducts) {
        if (customerTags.some((tag: string) => tag.includes(product.toLowerCase()) || product.toLowerCase().includes(tag))) {
          matchScore += 0.3;
          matchedReason += `历史标签与"${product}"匹配；`;
        }
      }

      // 检查目标产品
      if (campaign.targetProduct) {
        if (customerTags.some((tag: string) => tag.includes(campaign.targetProduct.toLowerCase()))) {
          matchScore += 0.4;
          matchedReason += `咨询过"${campaign.targetProduct}"；`;
        }
      }

      // 基础匹配分
      if (matchScore === 0 && customer.budgetSensitivity !== 'high') {
        matchScore = 0.3;
        matchedReason = '活跃客户，预算适中';
      }

      if (matchScore > 0.2) {
        matches.push({
          campaignId,
          customerId: customer.id,
          consultantId: customer.consultantId,
          matchedReason: matchedReason || '活跃客户',
          matchScore: Math.min(matchScore, 1),
          status: 'pending',
        });
      }
    }

    // 保存匹配结果
    for (const match of matches) {
      await this.outreachRepo.save(match as any);
    }

    return matches;
  }

  /** AI 生成个性化话术 */
  async generateMessages(campaignId: string) {
    const campaign = await this.findOne(campaignId);
    const outreaches = await this.outreachRepo.find({
      where: { campaignId },
      relations: ['customer'],
    });

    for (const outreach of outreaches) {
      try {
        const prompt = `你是一位医美营销专家。请为以下客户生成个性化邀约话术：

## 活动信息
- 活动名称：${campaign.name}
- 目标产品：${campaign.targetProduct}
- 优惠信息：${campaign.discount || '专属优惠'}

## 客户信息
- 匹配原因：${outreach.matchedReason}

## 要求
- 话术自然、亲切、专业
- 体现个性化（基于匹配原因）
- 包含具体行动引导
- 50-100字以内

请直接输出话术内容，不要包含其他说明。`;

        const response = await llmService.generate({ prompt, maxTokens: 200 });
        outreach.generatedMessage = response.content;
      } catch {
        outreach.generatedMessage = `尊敬的客户您好！我院现推出"${campaign.name}"活动，针对${campaign.targetProduct}有特别优惠。根据您的情况，我们为您准备了专属特权，欢迎到院咨询体验！`;
      }

      outreach.status = 'pending';
      await this.outreachRepo.save(outreach);
    }

    return outreaches;
  }

  /** 获取触达记录 */
  async getOutreaches(campaignId: string) {
    return this.outreachRepo.find({
      where: { campaignId },
      relations: ['customer'],
    });
  }

  /** 更新触达状态 */
  async updateOutreachStatus(outreachId: string, status: string) {
    const outreach = await this.outreachRepo.findOne({ where: { id: outreachId } });
    if (!outreach) throw new NotFoundException('触达记录不存在');

    outreach.status = status as any;
    if (status === 'sent') {
      outreach.sentAt = new Date();
    }
    return this.outreachRepo.save(outreach);
  }
}
