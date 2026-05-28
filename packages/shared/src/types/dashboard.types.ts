/** 管理员仪表盘 — 全局业务指标 */
export interface AdminDashboardMetrics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeRate: number;
  conversionRate: number;
  totalSessions: number;
  sessionsThisMonth: number;
  taskCompletionRate: number;
  followUpRate: number;
}

/** 咨询师业绩排行 */
export interface ConsultantRanking {
  consultantId: string;
  consultantName: string;
  avatar?: string;
  totalCustomers: number;
  newCustomersThisMonth: number;
  sessionsThisMonth: number;
  taskCompletionRate: number;
  followUpRate: number;
  conversionRate: number;
  totalTasks: number;
  completedTasks: number;
}

/** 趋势数据点 */
export interface TrendDataPoint {
  date: string;
  value: number;
}

/** 管理员仪表盘 — 趋势图表数据 */
export interface AdminTrends {
  customerGrowth: TrendDataPoint[];
  monthlySessions: TrendDataPoint[];
  conversionTrend: TrendDataPoint[];
  projectDistribution: { projectType: string; count: number }[];
}

/** 管理员仪表盘 — 待处理事项 */
export interface AdminAlerts {
  pendingScripts: number;
  overdueTasks: number;
  pendingCampaigns: number;
  inactiveConsultants: number;
}

/** 咨询师仪表盘 — 个人指标 */
export interface ConsultantDashboardMetrics {
  totalCustomers: number;
  newCustomersThisWeek: number;
  pendingCustomers: number;
  todayTasks: number;
  completedTasksThisMonth: number;
  sessionsThisMonth: number;
  taskCompletionRate: number;
  followUpRate: number;
  conversionRate: number;
}

/** 咨询师仪表盘 — 今日待办 */
export interface TodayTask {
  taskId: string;
  customerId: string;
  customerName: string;
  taskType: string;
  title: string;
  dueDate: string;
  priority: string;
}

/** 咨询师仪表盘 — 最近活跃客户 */
export interface RecentActiveCustomer {
  customerId: string;
  customerName: string;
  avatar?: string;
  tags: string[];
  lastActivity: string;
  lastActivityType: string;
}
