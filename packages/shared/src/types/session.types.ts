import { BlockerType, IntentLevel, SessionStatus } from '../constants/roles';

/** 核心诉求关键点 */
export interface KeyPoint {
  topic: string;
  description: string;
  intent: IntentLevel;
}

/** 客户卡点 */
export interface Blocker {
  type: BlockerType;
  detail: string;
  suggestedResponse: string;
}

/** 跟进策略 */
export interface FollowUpStrategy {
  summary: string;
  talkingPoints: string[];
  bestFollowUpTime: string;
  caseReferences: string[];
  templateId?: string;
  templateName?: string;
}

/** 面诊会话记录 */
export interface ConsultationSession {
  id: string;
  customerId: string;
  consultantId: string;
  audioUrl?: string;
  transcript: string;
  summary: string;
  keyPoints: KeyPoint[];
  blockers: Blocker[];
  decisionMakers: string[];
  followUpStrategy: FollowUpStrategy;
  status: SessionStatus;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

/** 创建会话请求 */
export interface CreateSessionRequest {
  customerId: string;
  transcript?: string;
}
