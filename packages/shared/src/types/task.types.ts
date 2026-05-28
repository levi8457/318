import { TaskStatus, TaskType, TaskPriority, NotificationChannel } from '../constants/roles';

/** 任务提醒 */
export interface TaskReminder {
  id: string;
  customerId: string;
  consultantId: string;
  projectId?: string;
  taskType: TaskType;
  title: string;
  description: string;
  triggerDate: string;
  triggerRule: string;
  status: TaskStatus;
  priority: TaskPriority;
  careMessage?: string;
  channel: NotificationChannel;
  reminderSent: boolean;
  completedAt?: string;
  result?: string;
  createdAt: string;
  updatedAt: string;
}

/** 更新任务状态请求 */
export interface UpdateTaskRequest {
  status?: TaskStatus;
  result?: string;
}

/** 生成任务请求 */
export interface GenerateTasksRequest {
  customerId: string;
  projectId?: string;
  projectType?: string;
}
