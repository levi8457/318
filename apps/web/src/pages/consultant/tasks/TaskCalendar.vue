<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">我的工作台</h2>
      <div class="header-actions">
        <el-button :type="viewMode === 'workbench' ? 'primary' : ''" @click="viewMode = 'workbench'">工作台</el-button>
        <el-button :type="viewMode === 'list' ? 'primary' : ''" @click="viewMode = 'list'">列表</el-button>
        <el-button :type="viewMode === 'calendar' ? 'primary' : ''" @click="viewMode = 'calendar'">日历</el-button>
      </div>
    </div>

    <!-- ========== 工作台视图 ========== -->
    <template v-if="viewMode === 'workbench'">
      <!-- 今日概览卡片 -->
      <div class="overview-cards">
        <div class="overview-card overdue" v-if="overdueTasks.length">
          <div class="card-icon">⚠️</div>
          <div class="card-info">
            <div class="card-number">{{ overdueTasks.length }}</div>
            <div class="card-label">逾期任务</div>
          </div>
        </div>
        <div class="overview-card today">
          <div class="card-icon">📋</div>
          <div class="card-info">
            <div class="card-number">{{ todayTasks.length }}</div>
            <div class="card-label">今日待办</div>
          </div>
        </div>
        <div class="overview-card week">
          <div class="card-icon">📅</div>
          <div class="card-info">
            <div class="card-number">{{ weekTasks.length }}</div>
            <div class="card-label">本周待办</div>
          </div>
        </div>
        <div class="overview-card completed">
          <div class="card-icon">✅</div>
          <div class="card-info">
            <div class="card-number">{{ completedThisWeek }}</div>
            <div class="card-label">本周已完成</div>
          </div>
        </div>
      </div>

      <!-- 逾期任务（紧急） -->
      <div class="table-card" v-if="overdueTasks.length">
        <div class="section-header urgent">
          <h3>⚠️ 逾期任务（需要立即处理）</h3>
        </div>
        <div v-for="task in overdueTasks" :key="task.id" class="task-card urgent">
          <div class="task-left">
            <div class="task-customer" @click="goToCustomer(task.customerId)">
              <span class="customer-name">{{ task.customer?.name || '未知客户' }}</span>
              <span class="customer-phone">{{ task.customer?.phone || '' }}</span>
            </div>
            <div class="task-title">{{ task.title }}</div>
            <div class="task-meta">
              <el-tag size="small" type="danger">逾期 {{ getOverdueDays(task.triggerDate) }} 天</el-tag>
              <el-tag size="small">{{ taskTypeMap[task.taskType] || task.taskType }}</el-tag>
            </div>
            <div class="task-message" v-if="task.careMessage">
              <p>{{ task.careMessage }}</p>
              <el-button size="small" type="primary" link @click="copyText(task.careMessage)">复制话术</el-button>
            </div>
          </div>
          <div class="task-actions">
            <el-button type="success" @click="completeTask(task.id)">完成</el-button>
            <el-button @click="showRescheduleDialog(task)">改期</el-button>
          </div>
        </div>
      </div>

      <!-- 今日待办 -->
      <div class="table-card">
        <div class="section-header">
          <h3>📋 今日待办</h3>
          <span class="section-count">{{ todayTasks.length }} 项</span>
        </div>
        <div v-if="todayTasks.length === 0" class="empty-state">
          <p>今日无待办任务，可以休息一下 🎉</p>
        </div>
        <div v-for="task in todayTasks" :key="task.id" class="task-card">
          <div class="task-left">
            <div class="task-customer" @click="goToCustomer(task.customerId)">
              <span class="customer-name">{{ task.customer?.name || '未知客户' }}</span>
            </div>
            <div class="task-title">{{ task.title }}</div>
            <div class="task-meta">
              <el-tag size="small">{{ taskTypeMap[task.taskType] || task.taskType }}</el-tag>
            </div>
            <div class="task-message" v-if="task.careMessage">
              <p>{{ task.careMessage }}</p>
              <el-button size="small" type="primary" link @click="copyText(task.careMessage)">复制话术</el-button>
            </div>
          </div>
          <div class="task-actions">
            <el-button type="success" size="small" @click="completeTask(task.id)">完成</el-button>
            <el-button size="small" @click="showRescheduleDialog(task)">改期</el-button>
          </div>
        </div>
      </div>

      <!-- 本周待办 -->
      <div class="table-card" v-if="weekTasks.length > 0">
        <div class="section-header">
          <h3>📅 本周待办</h3>
          <span class="section-count">{{ weekTasks.length }} 项</span>
        </div>
        <div v-for="task in weekTasks" :key="task.id" class="task-card compact">
          <div class="task-left">
            <span class="customer-name-small" @click="goToCustomer(task.customerId)">{{ task.customer?.name || '未知' }}</span>
            <span class="task-title-small">{{ task.title }}</span>
          </div>
          <div class="task-right">
            <span class="task-date">{{ formatDate(task.triggerDate) }}</span>
            <el-button size="small" type="success" @click="completeTask(task.id)">完成</el-button>
          </div>
        </div>
      </div>
    </template>

    <!-- ========== 列表视图 ========== -->
    <template v-if="viewMode === 'list'">
      <div class="table-card">
        <div class="filter-bar">
          <el-select v-model="statusFilter" placeholder="状态" clearable style="width:120px" @change="fetchData">
            <el-option label="待处理" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已逾期" value="overdue" />
          </el-select>
          <el-select v-model="typeFilter" placeholder="类型" clearable style="width:120px" @change="fetchData">
            <el-option label="跟进" value="follow_up" />
            <el-option label="复诊" value="recheck" />
            <el-option label="关怀" value="care" />
            <el-option label="营销" value="promotion" />
          </el-select>
        </div>

        <el-table :data="filteredTasks" stripe v-loading="loading">
          <el-table-column label="客户" width="120">
            <template #default="{ row }">
              <span class="link-text" @click="goToCustomer(row.customerId)">{{ row.customer?.name || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="任务" min-width="200" />
          <el-table-column prop="taskType" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ taskTypeMap[row.taskType] || row.taskType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType[row.status] || 'info'">{{ statusMap[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="triggerDate" label="到期日" width="120">
            <template #default="{ row }">{{ formatDate(row.triggerDate) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 'pending' || row.status === 'overdue'" size="small" type="success" @click="completeTask(row.id)">完成</el-button>
              <el-button v-if="row.status === 'pending'" size="small" @click="showRescheduleDialog(row)">改期</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- ========== 日历视图 ========== -->
    <template v-if="viewMode === 'calendar'">
      <div class="table-card">
        <div class="calendar-header">
          <el-button @click="prevMonth">&lt;</el-button>
          <h3>{{ currentYear }}年{{ currentMonth }}月</h3>
          <el-button @click="nextMonth">&gt;</el-button>
        </div>

        <div class="calendar-grid">
          <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="calendar-weekday">
            {{ day }}
          </div>
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="calendar-day"
            :class="{
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'has-tasks': day.tasks.length > 0
            }"
          >
            <div class="day-number">{{ day.date }}</div>
            <div v-for="task in day.tasks.slice(0, 3)" :key="task.id" class="day-task" :class="task.status" @click="goToCustomer(task.customerId)">
              <span class="task-dot" :class="task.status"></span>
              <span class="task-title">{{ task.customer?.name || '' }} {{ task.title }}</span>
            </div>
            <div v-if="day.tasks.length > 3" class="more-tasks">
              +{{ day.tasks.length - 3 }} 更多
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 改期弹窗 -->
    <el-dialog title="任务改期" v-model="rescheduleDialogVisible" width="400px">
      <el-form label-width="80px">
        <el-form-item label="新日期">
          <el-date-picker v-model="newDate" type="datetime" style="width:100%" placeholder="选择新的执行时间" value-format="YYYY-MM-DDTHH:mm:ss.sssZ" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rescheduleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="rescheduleTask">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const router = useRouter();
const tasks = ref<any[]>([]);
const loading = ref(false);
const viewMode = ref<'workbench' | 'list' | 'calendar'>('workbench');
const statusFilter = ref('');
const typeFilter = ref('');

const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);

// 改期弹窗
const rescheduleDialogVisible = ref(false);
const rescheduleTaskId = ref('');
const newDate = ref<Date | null>(null);

const statusMap: Record<string, string> = {
  pending: '待处理',
  completed: '已完成',
  cancelled: '已取消',
  overdue: '已逾期',
};

const statusType: Record<string, string> = {
  pending: 'warning',
  completed: 'success',
  cancelled: 'info',
  overdue: 'danger',
};

const taskTypeMap: Record<string, string> = {
  follow_up: '跟进',
  recheck: '复诊',
  care: '关怀',
  promotion: '营销',
};

// 计算属性
const overdueTasks = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return tasks.value.filter(t => {
    if (t.status !== 'pending' && t.status !== 'overdue') return false;
    return new Date(t.triggerDate) < today;
  });
});

const todayTasks = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return tasks.value.filter(t => {
    if (t.status !== 'pending') return false;
    const date = new Date(t.triggerDate);
    return date >= today && date < tomorrow;
  });
});

const weekTasks = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  return tasks.value.filter(t => {
    if (t.status !== 'pending') return false;
    const date = new Date(t.triggerDate);
    return date >= today && date < nextWeek;
  }).filter(t => !todayTasks.value.includes(t));
});

const completedThisWeek = computed(() => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return tasks.value.filter(t => {
    if (t.status !== 'completed') return false;
    return new Date(t.updatedAt) >= weekStart;
  }).length;
});

const filteredTasks = computed(() => {
  return tasks.value.filter(task => {
    if (statusFilter.value && task.status !== statusFilter.value) return false;
    if (typeFilter.value && task.taskType !== typeFilter.value) return false;
    return true;
  });
});

const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const days: any[] = [];

  const startDay = firstDay.getDay();
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, -i);
    days.push({ date: date.getDate(), isCurrentMonth: false, isToday: false, tasks: [] });
  }

  const today = new Date();
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month - 1, i);
    const dayTasks = tasks.value.filter(t => {
      const taskDate = new Date(t.triggerDate);
      return taskDate.getFullYear() === year && taskDate.getMonth() === month - 1 && taskDate.getDate() === i;
    });
    days.push({
      date: i,
      isCurrentMonth: true,
      isToday: date.toDateString() === today.toDateString(),
      tasks: dayTasks,
    });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: i, isCurrentMonth: false, isToday: false, tasks: [] });
  }

  return days;
});

// 方法
async function fetchData() {
  loading.value = true;
  const res: any = await request.get('/tasks');
  tasks.value = Array.isArray(res) ? res : [];
  loading.value = false;
}

async function completeTask(id: string) {
  await request.put(`/tasks/${id}`, { status: 'completed' });
  ElMessage.success('任务已完成');
  fetchData();
}

function showRescheduleDialog(task: any) {
  rescheduleTaskId.value = task.id;
  newDate.value = new Date(task.triggerDate);
  rescheduleDialogVisible.value = true;
}

async function rescheduleTask() {
  if (!newDate.value) {
    ElMessage.warning('请选择新日期');
    return;
  }
  await request.put(`/tasks/${rescheduleTaskId.value}`, {
    triggerDate: newDate.value.toISOString(),
  });
  ElMessage.success('任务已改期');
  rescheduleDialogVisible.value = false;
  fetchData();
}

function goToCustomer(customerId: string) {
  if (customerId) {
    router.push(`/dashboard/customers/${customerId}`);
  }
}

function getOverdueDays(triggerDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(triggerDate);
  taskDate.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return '今天';
  if (date.toDateString() === tomorrow.toDateString()) return '明天';
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function copyText(text: string) {
  navigator.clipboard.writeText(text);
  ElMessage.success('已复制');
}

function prevMonth() {
  if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value--; }
  else currentMonth.value--;
}

function nextMonth() {
  if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++; }
  else currentMonth.value++;
}

onMounted(fetchData);
</script>

<style scoped>
.header-actions {
  display: flex;
  gap: 8px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.overview-card.overdue { border-left: 4px solid #f56c6c; }
.overview-card.today { border-left: 4px solid #409eff; }
.overview-card.week { border-left: 4px solid #e6a23c; }
.overview-card.completed { border-left: 4px solid #67c23a; }

.card-icon { font-size: 32px; }
.card-number { font-size: 28px; font-weight: 700; }
.card-label { font-size: 14px; color: #909399; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header.urgent h3 { color: #f56c6c; }
.section-count { color: #909399; font-size: 14px; }

.task-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eee;
  transition: all 0.2s;
}

.task-card:hover { border-color: #409eff; box-shadow: 0 2px 8px rgba(64,158,255,0.1); }
.task-card.urgent { border-left: 4px solid #f56c6c; }
.task-card.compact { padding: 12px; }

.task-left { flex: 1; }
.task-actions { display: flex; gap: 8px; margin-left: 16px; }

.task-customer { cursor: pointer; margin-bottom: 4px; }
.customer-name { font-weight: 600; color: #409eff; font-size: 15px; }
.customer-name:hover { text-decoration: underline; }
.customer-phone { color: #909399; font-size: 13px; margin-left: 8px; }
.customer-name-small { font-weight: 600; color: #409eff; font-size: 13px; cursor: pointer; }

.task-title { font-size: 14px; color: #303133; margin-bottom: 6px; }
.task-title-small { font-size: 13px; color: #606266; }

.task-meta { display: flex; gap: 6px; margin-bottom: 8px; }

.task-message {
  background: #f5f7fa;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.task-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-date {
  color: #909399;
  font-size: 13px;
  white-space: nowrap;
}

.link-text { color: #409eff; cursor: pointer; }
.link-text:hover { text-decoration: underline; }

.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

/* 日历样式 */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e4e7ed;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.calendar-weekday {
  background: #f5f7fa;
  padding: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  color: #606266;
}

.calendar-day {
  background: #fff;
  padding: 8px;
  min-height: 100px;
}

.calendar-day.other-month { background: #fafafa; color: #c0c4cc; }
.calendar-day.today { background: #ecf5ff; }
.calendar-day.has-tasks { border-left: 3px solid #409eff; }

.day-number { font-weight: 600; margin-bottom: 4px; font-size: 14px; }
.calendar-day.today .day-number { color: #409eff; }

.day-task {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  font-size: 12px;
  cursor: pointer;
}

.task-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.task-dot.pending { background: #e6a23c; }
.task-dot.completed { background: #67c23a; }
.task-dot.overdue { background: #f56c6c; }

.task-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-tasks {
  font-size: 11px;
  color: #909399;
  padding-top: 2px;
}

@media (max-width: 768px) {
  .overview-cards { grid-template-columns: repeat(2, 1fr); }
}
</style>
