/**
 * 安全解析日期，避免 Invalid Date
 */
export function safeParseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

/**
 * 格式化日期为本地日期字符串
 * @param dateStr 日期字符串
 * @param fallback 空值时的回退文本
 */
export function formatDate(dateStr: string | null | undefined, fallback = '-'): string {
  const date = safeParseDate(dateStr);
  if (!date) return fallback;
  return date.toLocaleDateString('zh-CN');
}

/**
 * 格式化日期为 "今天" / "明天" 或月/日
 */
export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = safeParseDate(dateStr);
  if (!date) return '-';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return '今天';
  if (date.toDateString() === tomorrow.toDateString()) return '明天';
  if (date.toDateString() === yesterday.toDateString()) return '昨天';
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

/**
 * 格式化日期时间为本地日期时间字符串
 */
export function formatDateTime(dateStr: string | null | undefined, fallback = '-'): string {
  const date = safeParseDate(dateStr);
  if (!date) return fallback;
  return date.toLocaleString('zh-CN');
}

/**
 * 判断日期是否已过期
 */
export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const date = safeParseDate(dateStr);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * 计算逾期天数
 */
export function getOverdueDays(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const date = safeParseDate(dateStr);
  if (!date) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}
