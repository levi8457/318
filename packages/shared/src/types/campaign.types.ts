import { CampaignStatus, OutreachStatus } from '../constants/roles';

/** 营销活动 */
export interface MarketingCampaign {
  id: string;
  name: string;
  type: 'upgrade' | 'promotion' | 'new_product' | 'anniversary';
  description: string;
  targetProduct: string;
  relatedProducts: string[];
  discount?: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** 精准触达记录 */
export interface TargetedOutreach {
  id: string;
  campaignId: string;
  customerId: string;
  consultantId: string;
  matchedReason: string;
  matchScore: number;
  generatedMessage: string;
  status: OutreachStatus;
  sentAt?: string;
  channel?: string;
}

/** 创建营销活动请求 */
export interface CreateCampaignRequest {
  name: string;
  type: 'upgrade' | 'promotion' | 'new_product' | 'anniversary';
  description: string;
  targetProduct: string;
  relatedProducts: string[];
  discount?: string;
  startDate: string;
  endDate: string;
}

/** 匹配客户响应 */
export interface CustomerMatchResult {
  customerId: string;
  customerName: string;
  consultantId: string;
  consultantName: string;
  matchedReason: string;
  matchScore: number;
}
