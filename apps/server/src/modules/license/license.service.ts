import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { License } from './entities/license.entity';

export type PlanType = 'basic' | 'professional' | 'enterprise';

export interface PlanFeatures {
  customerManagement: boolean;
  taskReminder: boolean;
  basicReports: boolean;
  sessionTranscription: boolean;
  aiAnalysis: boolean;
  aiStrategy: boolean;
  scriptLibrary: boolean;
  strategyTemplates: boolean;
  precisionMarketing: boolean;
  advancedReports: boolean;
  apiIntegration: boolean;
  multiOrganization: boolean;
}

const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  basic: {
    customerManagement: true,
    taskReminder: true,
    basicReports: true,
    sessionTranscription: false,
    aiAnalysis: false,
    aiStrategy: false,
    scriptLibrary: false,
    strategyTemplates: false,
    precisionMarketing: false,
    advancedReports: false,
    apiIntegration: false,
    multiOrganization: false,
  },
  professional: {
    customerManagement: true,
    taskReminder: true,
    basicReports: true,
    sessionTranscription: true,
    aiAnalysis: true,
    aiStrategy: true,
    scriptLibrary: true,
    strategyTemplates: true,
    precisionMarketing: false,
    advancedReports: false,
    apiIntegration: false,
    multiOrganization: false,
  },
  enterprise: {
    customerManagement: true,
    taskReminder: true,
    basicReports: true,
    sessionTranscription: true,
    aiAnalysis: true,
    aiStrategy: true,
    scriptLibrary: true,
    strategyTemplates: true,
    precisionMarketing: true,
    advancedReports: true,
    apiIntegration: true,
    multiOrganization: true,
  },
};

const PLAN_LIMITS: Record<PlanType, { maxConsultants: number; price: number }> = {
  basic: { maxConsultants: 3, price: 2980 },
  professional: { maxConsultants: 10, price: 5980 },
  enterprise: { maxConsultants: 999, price: 9980 },
};

@Injectable()
export class LicenseService {
  private readonly logger = new Logger(LicenseService.name);

  constructor(
    @InjectRepository(License)
    private licenseRepo: Repository<License>,
  ) {}

  /** 获取当前 License */
  async getLicense(): Promise<License> {
    let license = await this.licenseRepo.findOne({ where: {} });
    if (!license) {
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + 14);

      const newLicense = await this.licenseRepo.save({
        plan: 'professional',
        maxConsultants: PLAN_LIMITS.professional.maxConsultants,
        isTrial: true,
        trialEndsAt: trialEnds,
        subscriptionStartsAt: new Date(),
        status: 'trial',
        featuresEnabled: PLAN_FEATURES.professional as any,
      } as any);
      this.logger.log('[License] 创建默认试用 License，14天专业版');
      return newLicense;
    }

    // 检查试用是否过期
    if (license.isTrial && license.trialEndsAt && new Date() > license.trialEndsAt) {
      license.status = 'expired';
      license.plan = 'basic';
      license.maxConsultants = PLAN_LIMITS.basic.maxConsultants;
      license.featuresEnabled = PLAN_FEATURES.basic as any;
      await this.licenseRepo.save(license);
      this.logger.warn('[License] 试用期已过期，降级为基础版');
    }

    // 检查订阅是否过期
    if (!license.isTrial && license.subscriptionEndsAt && new Date() > license.subscriptionEndsAt) {
      license.status = 'expired';
      await this.licenseRepo.save(license);
      this.logger.warn('[License] 订阅已过期');
    }

    return license;
  }

  /** 获取当前版本的功能列表 */
  async getFeatures(): Promise<PlanFeatures> {
    const license = await this.getLicense();
    return license.featuresEnabled as unknown as PlanFeatures;
  }

  /** 检查功能是否可用 */
  async isFeatureEnabled(feature: keyof PlanFeatures): Promise<boolean> {
    const features = await this.getFeatures();
    return features[feature] === true;
  }

  /** 检查功能，不可用则抛出异常 */
  async checkFeature(feature: keyof PlanFeatures): Promise<void> {
    const enabled = await this.isFeatureEnabled(feature);
    if (!enabled) {
      const license = await this.getLicense();
      throw new ForbiddenException(
        `此功能需要专业版或旗舰版。当前版本：${this.getPlanName(license.plan)}`,
      );
    }
  }

  /** 检查咨询师数量是否超限 */
  async checkConsultantLimit(currentCount: number): Promise<void> {
    const license = await this.getLicense();
    if (currentCount >= license.maxConsultants) {
      throw new ForbiddenException(
        `当前版本最多支持 ${license.maxConsultants} 名咨询师。请升级版本以添加更多。`,
      );
    }
  }

  /** 升级版本 */
  async upgradePlan(plan: PlanType, billingCycle: 'monthly' | 'yearly' = 'monthly'): Promise<License> {
    const license = await this.getLicense();
    const now = new Date();
    const endDate = new Date(now);
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    license.plan = plan;
    license.maxConsultants = PLAN_LIMITS[plan].maxConsultants;
    license.featuresEnabled = PLAN_FEATURES[plan] as any;
    license.isTrial = false;
    license.trialEndsAt = null as any;
    license.subscriptionStartsAt = now;
    license.subscriptionEndsAt = endDate;
    license.billingCycle = billingCycle;
    license.status = 'active';

    await this.licenseRepo.save(license);
    this.logger.log(`[License] 版本升级为 ${this.getPlanName(plan)}`);
    return license;
  }

  /** 获取版本信息摘要 */
  async getLicenseInfo() {
    const license = await this.getLicense();
    const features = license.featuresEnabled as unknown as PlanFeatures;
    const enabledFeatures = Object.entries(features)
      .filter(([_, v]) => v)
      .map(([k]) => k);

    return {
      plan: license.plan,
      planName: this.getPlanName(license.plan),
      status: license.status,
      isTrial: license.isTrial,
      trialEndsAt: license.trialEndsAt,
      subscriptionStartsAt: license.subscriptionStartsAt,
      subscriptionEndsAt: license.subscriptionEndsAt,
      billingCycle: license.billingCycle,
      maxConsultants: license.maxConsultants,
      price: PLAN_LIMITS[license.plan as PlanType]?.price || 0,
      enabledFeatures,
      allPlans: [
        {
          id: 'basic',
          name: '基础版',
          price: PLAN_LIMITS.basic.price,
          maxConsultants: PLAN_LIMITS.basic.maxConsultants,
          features: PLAN_FEATURES.basic,
        },
        {
          id: 'professional',
          name: '专业版',
          price: PLAN_LIMITS.professional.price,
          maxConsultants: PLAN_LIMITS.professional.maxConsultants,
          features: PLAN_FEATURES.professional,
        },
        {
          id: 'enterprise',
          name: '旗舰版',
          price: PLAN_LIMITS.enterprise.price,
          maxConsultants: PLAN_LIMITS.enterprise.maxConsultants,
          features: PLAN_FEATURES.enterprise,
        },
      ],
    };
  }

  private getPlanName(plan: string): string {
    const names: Record<string, string> = {
      basic: '基础版',
      professional: '专业版',
      enterprise: '旗舰版',
    };
    return names[plan] || plan;
  }
}
