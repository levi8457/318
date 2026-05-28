/** 用户角色枚举 */
export enum UserRole {
  ADMIN = 'admin',
  CONSULTANT = 'consultant',
}

/** 角色中文名称映射 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: '管理员',
  [UserRole.CONSULTANT]: '咨询师',
};

/** 客户状态 */
export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOST = 'lost',
}

/** 任务状态 */
export enum TaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

/** 任务类型 */
export enum TaskType {
  FOLLOW_UP = 'follow_up',
  RECHECK = 'recheck',
  CARE = 'care',
  PROMOTION = 'promotion',
}

/** 任务优先级 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/** 预算敏感度 */
export enum BudgetSensitivity {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/** 卡点类型 */
export enum BlockerType {
  PRICE = 'price',
  PAIN = 'pain',
  TRUST = 'trust',
  FAMILY = 'family',
  OTHER = 'other',
}

/** 会话状态 */
export enum SessionStatus {
  PENDING = 'pending',
  TRANSCRIBING = 'transcribing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/** 营销活动状态 */
export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

/** 触达记录状态 */
export enum OutreachStatus {
  PENDING = 'pending',
  SENT = 'sent',
  RESPONDED = 'responded',
  CONVERTED = 'converted',
}

/** 项目状态 */
export enum ProjectStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FOLLOW_UP = 'follow_up',
}

/** 偏好重要性 */
export enum ImportanceLevel {
  NORMAL = 'normal',
  IMPORTANT = 'important',
  CRITICAL = 'critical',
}

/** 意向等级 */
export enum IntentLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/** 通知渠道 */
export enum NotificationChannel {
  SYSTEM = 'system',
  WECOM = 'wecom',
  SMS = 'sms',
}
