import { BudgetSensitivity, CustomerStatus, ImportanceLevel, ProjectStatus } from '../constants/roles';

/** 标签 */
export interface Tag {
  id: string;
  category: string;
  value: string;
}

/** 私人喜好备忘录 */
export interface Preference {
  id: string;
  category: string;
  content: string;
  importance: ImportanceLevel;
}

/** 项目时间轴条目 */
export interface ProjectTimeline {
  id: string;
  projectName: string;
  projectType: string;
  date: string;
  status: ProjectStatus;
  notes: string;
  consultantId: string;
}

/** 客户画像 */
export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  consultantId: string;
  tags: Tag[];
  preferences: Preference[];
  projects: ProjectTimeline[];
  budgetSensitivity: BudgetSensitivity;
  source: string;
  status: CustomerStatus;
  lastContactAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** 创建/更新客户请求 */
export interface CreateCustomerRequest {
  name: string;
  phone: string;
  source?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  source?: string;
  status?: CustomerStatus;
  notes?: string;
  budgetSensitivity?: BudgetSensitivity;
}

export interface AddTagRequest {
  category: string;
  value: string;
}

export interface AddPreferenceRequest {
  category: string;
  content: string;
  importance?: ImportanceLevel;
}
