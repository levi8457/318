import { NotificationChannel } from '../constants/roles';

/** SOP 节点 */
export interface SOPNode {
  dayOffset: number;
  taskType: string;
  messageTemplate: string;
  channel: NotificationChannel;
}

/** SOP 模板 */
export interface SOPTemplate {
  id: string;
  name: string;
  projectType: string;
  nodes: SOPNode[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** 创建/更新 SOP 模板请求 */
export interface CreateSOPTemplateRequest {
  name: string;
  projectType: string;
  nodes: SOPNode[];
}

export interface UpdateSOPTemplateRequest {
  name?: string;
  projectType?: string;
  nodes?: SOPNode[];
  isActive?: boolean;
}
