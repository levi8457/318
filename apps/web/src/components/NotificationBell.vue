<template>
  <div class="notification-bell" @click="togglePanel">
    <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
      <el-icon :size="20"><Bell /></el-icon>
    </el-badge>

    <el-drawer v-model="panelVisible" title="通知中心" size="360px" direction="rtl">
      <template #header>
        <div class="notification-header">
          <span>通知中心</span>
          <el-button type="primary" link @click="markAllAsRead" :disabled="unreadCount === 0">
            全部已读
          </el-button>
        </div>
      </template>

      <div v-loading="loading">
        <div v-if="notifications.length === 0" class="empty-state">
          <el-empty description="暂无通知" :image-size="80" />
        </div>

        <div v-else class="notification-list">
          <div
            v-for="item in notifications"
            :key="item.id"
            class="notification-item"
            :class="{ unread: !item.isRead }"
            @click="handleClick(item)"
          >
            <div class="notification-icon" :class="item.type">
              <el-icon v-if="item.type === 'task_reminder'"><Clock /></el-icon>
              <el-icon v-else-if="item.type === 'overdue_alert'"><WarningFilled /></el-icon>
              <el-icon v-else><InfoFilled /></el-icon>
            </div>
            <div class="notification-content">
              <div class="notification-title">{{ item.title }}</div>
              <div class="notification-text">{{ item.content }}</div>
              <div class="notification-time">{{ formatTime(item.createdAt) }}</div>
            </div>
            <div v-if="!item.isRead" class="unread-dot" />
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Bell, Clock, WarningFilled, InfoFilled } from '@element-plus/icons-vue';
import request from '@/api/request';
import { formatDateTime, safeParseDate } from '@/utils/date';

const panelVisible = ref(false);
const loading = ref(false);
const notifications = ref<any[]>([]);
const unreadCount = ref(0);
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function fetchNotifications() {
  const res: any = await request.get('/notifications');
  if (res) {
    notifications.value = res.items || [];
    unreadCount.value = res.unreadCount || 0;
  }
}

async function fetchUnreadCount() {
  const res: any = await request.get('/notifications/unread-count');
  if (res) {
    unreadCount.value = res.count || 0;
  }
}

function togglePanel() {
  panelVisible.value = !panelVisible.value;
  if (panelVisible.value) {
    loading.value = true;
    fetchNotifications().finally(() => {
      loading.value = false;
    });
  }
}

async function markAllAsRead() {
  await request.put('/notifications/read-all');
  unreadCount.value = 0;
  notifications.value.forEach(n => {
    n.isRead = true;
    n.readAt = new Date().toISOString();
  });
}

async function handleClick(item: any) {
  if (!item.isRead) {
    await request.put(`/notifications/${item.id}/read`);
    item.isRead = true;
    item.readAt = new Date().toISOString();
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  }
  panelVisible.value = false;
}

function formatTime(dateStr: string): string {
  const date = safeParseDate(dateStr);
  if (!date) return '-';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDateTime(dateStr);
}

onMounted(() => {
  fetchUnreadCount();
  pollTimer = setInterval(fetchUnreadCount, 30000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
.notification-bell {
  cursor: pointer;
  position: relative;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-list {
  padding: 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
}

.notification-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.notification-icon.task_reminder {
  background-color: #e6f7ff;
  color: #1890ff;
}

.notification-icon.overdue_alert {
  background-color: #fff2e8;
  color: #fa8c16;
}

.notification-icon.system {
  background-color: #f6ffed;
  color: #52c41a;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.notification-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #f56c6c;
  position: absolute;
  top: 16px;
  right: 16px;
}

.empty-state {
  padding: 40px 0;
}
</style>
