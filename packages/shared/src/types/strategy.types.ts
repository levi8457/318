/** 策略步骤 */
export interface StrategyStep {
  order: number;
  dayOffset: number;
  action: string;
  talkingPoints: string[];
  exampleScript: string;
  notes: string;
}

/** 跟进策略模板 */
export interface FollowUpStrategyTemplate {
  id: string;
  name: string;
  category: string;
  applicableProjectTypes: string[];
  applicableBlockerTypes: string[];
  steps: StrategyStep[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** 创建/更新策略模板请求 */
export interface CreateStrategyTemplateRequest {
  name: string;
  category: string;
  applicableProjectTypes: string[];
  applicableBlockerTypes: string[];
  steps: StrategyStep[];
}

export interface UpdateStrategyTemplateRequest {
  name?: string;
  category?: string;
  applicableProjectTypes?: string[];
  applicableBlockerTypes?: string[];
  steps?: StrategyStep[];
  isActive?: boolean;
}
