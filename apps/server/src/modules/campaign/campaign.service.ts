import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingCampaign, TargetedOutreach } from './entities/campaign.entity';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(MarketingCampaign)
    private campaignRepo: Repository<MarketingCampaign>,
    @InjectRepository(TargetedOutreach)
    private outreachRepo: Repository<TargetedOutreach>,
  ) {}

  async findAll() {
    return this.campaignRepo.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: Partial<MarketingCampaign>, userId: string) {
    return this.campaignRepo.save({ ...dto, createdBy: userId });
  }

  async findOne(id: string) {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('营销活动不存在');
    return campaign;
  }

  /** AI 匹配目标客户 */
  async matchCustomers(campaignId: string) {
    const campaign = await this.findOne(campaignId);
    // Mock 匹配算法：返回模拟匹配结果
    const mockMatches = [
      {
        campaignId,
        customerId: 'mock-customer-1',
        consultantId: 'mock-consultant-1',
        matchedReason: `该客户历史购买过${campaign.relatedProducts.join('、')}相关产品，与本次活动高度匹配`,
        matchScore: 0.92,
        generatedMessage: '',
        status: 'pending',
      },
      {
        campaignId,
        customerId: 'mock-customer-2',
        consultantId: 'mock-consultant-2',
        matchedReason: `该客户咨询过${campaign.targetProduct}但因价格流失，本次优惠活动可能激活`,
        matchScore: 0.85,
        generatedMessage: '',
        status: 'pending',
      },
    ];

    for (const m of mockMatches) {
      await this.outreachRepo.save(m as any);
    }

    return mockMatches;
  }

  /** AI 生成个性化话术 */
  async generateMessages(campaignId: string) {
    const outreaches = await this.outreachRepo.find({ where: { campaignId } });
    for (const o of outreaches) {
      o.generatedMessage = `尊敬的客户您好！我院现推出${campaignId}专属优惠活动，根据您的历史消费记录，我们为您准备了专属特权，欢迎到院体验！`;
      o.status = 'pending';
      await this.outreachRepo.save(o);
    }
    return outreaches;
  }

  /** 获取触达记录 */
  async getOutreaches(campaignId: string) {
    return this.outreachRepo.find({ where: { campaignId } });
  }
}
