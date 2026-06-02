<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">我的任务</h2>
      <div class="view-toggle">
        <el-button :type="viewMode === 'list' ? 'primary' : ''" @click="viewMode = 'list'">列表</el-button>
        <el-button :type="viewMode === 'calendar' ? 'primary' : ''" @click="viewMode = 'calendar'">日历</el-button>
      </div>
    </div>

    <!-- 列表视图 -->
    <div v-if="viewMode === 'list'" class="table-card">
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
        <el-table-column prop="title" label="任务" min-width="200" />
        <el-table-column label="客户" width="120">
          <template #default="{ row }">{{ row.customer?.name || '-' }}</template>
        </el-table-column>
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
          <template #default="{ row }">{{ new Date(row.triggerDate).toLocaleDateString() }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending' || row.status === 'overdue'" size="small" type="success" @click="completeTask(row.id)">完成</el-button>
            <el-button v-if="row.status === 'pending'" size="small" type="warning" @click="cancelTask(row.id)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 日历视图 -->
    <div v-if="viewMode === 'calendar'" class="table-card">
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
          <div v-for="task in day.tasks.slice(0, 3)" :key="task.id" class="day-task" :class="task.status">
            <span class="task-dot" :class="task.status"></span>
            <span class="task-title">{{ task.title }}</span>
          </div>
          <div v-if="day.tasks.length > 3" class="more-tasks">
            +{{ day.tasks.length - 3 }} 更多
          </div>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="table-card">
      <div class="task-stats">
        <span>总计: {{ tasks.length }}</span>
        <span>待处理: {{ tasks.filter(t => t.status === 'pending').length }}</span>
        <span>已逾期: {{ tasks.filter(t => t.status === 'overdue').length }}</span>
        <span>已完成: {{ tasks.filter(t => t.status === 'completed').length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const tasks = ref<any[]>([]);
const loading = ref(false);
const viewMode = ref<'list' | 'calendar'>('list');
const statusFilter = ref('');
const typeFilter = ref('');

const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);

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
  const days = [];

  // 上个月的日期
  const startDay = firstDay.getDay();
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, -i);
    days.push({
      date: date.getDate(),
      isCurrentMonth: false,
      isToday: false,
      tasks: [],
    });
  }

  // 本月的日期
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

  // 下个月的日期
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: i,
      isCurrentMonth: false,
      isToday: false,
      tasks: [],
    });
  }

  return days;
});

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

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

async function cancelTask(id: string) {
  await request.put(`/tasks/${id}`, { status: 'cancelled' });
  ElMessage.success('任务已取消');
  fetchData();
}

onMounted(fetchData);
</script>

<style scoped>
.view-toggle {
  display: flex;
  gap: 8px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.task-stats {
  display: flex;
  gap: 24px;
  color: #606266;
  font-size: 14px;
}

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
  vertical-align: top;
}

.calendar-day.other-month {
  background: #fafafa;
  color: #c0c4cc;
}

.calendar-day.today {
  background: #ecf5ff;
}

.calendar-day.has-tasks {
  border-left: 3px solid #409eff;
}

.day-number {
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 14px;
}

.calendar-day.today .day-number {
  color: #409eff;
}

.day-task {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  font-size: 12px;
}

.task-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.task-dot.pending {
  background: #e6a23c;
}

.task-dot.completed {
  background: #67c23a;
}

.task-dot.overdue {
  background: #f56c6c;
}

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
</style>
