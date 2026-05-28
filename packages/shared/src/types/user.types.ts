import { UserRole } from '../constants/roles';

/** 用户基本信息 */
export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  realName: string;
  phone: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 登录请求 */
export interface LoginRequest {
  username: string;
  password: string;
}

/** 登录响应 */
export interface LoginResponse {
  accessToken: string;
  user: Omit<User, 'password'>;
}

/** 咨询师扩展信息 */
export interface ConsultantProfile {
  id: string;
  userId: string;
  user?: Omit<User, 'password'>;
  employeeNo?: string;
  speciality: string[];
  customerCount: number;
  isActive: boolean;
  joinedAt: string;
  leftAt?: string;
  notes?: string;
}

/** 咨询师绩效概览 */
export interface ConsultantMetrics {
  consultantId: string;
  consultantName: string;
  totalCustomers: number;
  newCustomersThisMonth: number;
  sessionsThisMonth: number;
  taskCompletionRate: number;
  followUpRate: number;
  conversionRate: number;
}

/** 创建咨询师请求 */
export interface CreateConsultantRequest {
  username: string;
  password: string;
  realName: string;
  phone: string;
  employeeNo?: string;
  speciality?: string[];
  notes?: string;
}

/** 修改密码请求 */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
