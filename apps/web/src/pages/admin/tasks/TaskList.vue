<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">全部任务</h2>
    </div>

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
        <el-select v-model="priorityFilter" placeholder="优先级" clearable style="width:100px" @change="fetchData">
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
      </div>

      <el-table :data="filteredTasks" stripe v-loading="loading">
        <el-table-column prop="title" label="任务" min-width="200" />
        <el-table-column label="客户" width="120">
          <template #default="{ row }">{{ row.customer?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="咨询师" width="120">
          <template #default="{ row }">{{ row.consultant?.realName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="taskType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ taskTypeMap[row.taskType] || row.taskType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status] || 'info'">
              {{ statusMap[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="priorityType[row.priority] || 'info'" size="small">
              {{ priorityMap[row.priority] || row.priority }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="triggerDate" label="到期日" width="120">
          <template #default="{ row }">{{ formatDate(row.triggerDate) }}</template>
        </el-table-column>
      </el-table>

      <!-- 统计信息 -->
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
import request from '@/api/request';
import { formatDate } from '@/utils/date';

const tasks = ref<any[]>([]);
const loading = ref(false);
const statusFilter = ref('');
const typeFilter = ref('');
const priorityFilter = ref('');

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

const priorityMap: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const priorityType: Record<string, string> = {
  high: 'danger',
  medium: 'warning',
  low: 'info',
};

const filteredTasks = computed(() => {
  return tasks.value.filter(task => {
    if (statusFilter.value && task.status !== statusFilter.value) return false;
    if (typeFilter.value && task.taskType !== typeFilter.value) return false;
    if (priorityFilter.value && task.priority !== priorityFilter.value) return false;
    return true;
  });
});

async function fetchData() {
  loading.value = true;
  const res: any = await request.get('/tasks');
  tasks.value = Array.isArray(res) ? res : [];
  loading.value = false;
}

onMounted(fetchData);
</script>

<style scoped>
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
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  color: #606266;
  font-size: 14px;
}
</style>
