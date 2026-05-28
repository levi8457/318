/** 金牌话术 */
export interface GoldenScript {
  id: string;
  category: string;
  scenario: string;
  script: string;
  conversionRate: number;
  usageCount: number;
  likeCount: number;
  sourceSessionId: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 创建话术请求 */
export interface CreateScriptRequest {
  category: string;
  scenario: string;
  script: string;
  sourceSessionId?: string;
}

/** 更新话术请求 */
export interface UpdateScriptRequest {
  category?: string;
  scenario?: string;
  script?: string;
}
