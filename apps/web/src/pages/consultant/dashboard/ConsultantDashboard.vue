<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">我的仪表盘</h2>
    </div>

    <div class="card-grid">
      <div class="stat-card">
        <div class="stat-label">我的客户</div>
        <div class="stat-value">{{ metrics.totalCustomers }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">今日待办</div>
        <div class="stat-value" style="color:#e6a23c">{{ metrics.todayTasks }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">本月面诊</div>
        <div class="stat-value">{{ metrics.sessionsThisMonth }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">转化率</div>
        <div class="stat-value">{{ (metrics.conversionRate * 100).toFixed(1) }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">任务完成率</div>
        <div class="stat-value">{{ (metrics.taskCompletionRate * 100).toFixed(1) }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">跟进率</div>
        <div class="stat-value">{{ (metrics.followUpRate * 100).toFixed(1) }}%</div>
      </div>
    </div>

    <!-- 今日待办 -->
    <div class="table-card">
      <h3>今日待办任务</h3>
      <el-table :data="todayTasks" stripe style="margin-top: 12px">
        <el-table-column prop="title" label="任务" min-width="200" />
        <el-table-column label="客户" width="120">
          <template #default="{ row }">{{ row.customer?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="taskType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ taskTypeMap[row.taskType] || row.taskType }}</el-tag>
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
          <template #default="{ row }">{{ new Date(row.triggerDate).toLocaleDateString() }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="completeTask(row.id)">完成</el-button>
            <el-button size="small" type="warning" @click="cancelTask(row.id)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!todayTasks.length" description="今日无待办任务" />
    </div>

    <!-- 最近活跃客户 -->
    <div class="table-card">
      <h3>最近活跃客户</h3>
      <el-row :gutter="16" style="margin-top: 12px">
        <el-col v-for="c in recentCustomers" :key="c.customerId" :xs="12" :sm="8" :md="6" style="margin-bottom:12px">
          <el-card shadow="hover" @click="$router.push(`/customers/${c.customerId}`)" style="cursor:pointer">
            <div style="font-weight:600; margin-bottom:4px">{{ c.customerName }}</div>
            <div style="font-size:12px; color:#909399">{{ c.lastActivityType }} · {{ new Date(c.lastActivity).toLocaleDateString() }}</div>
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-if="!recentCustomers.length" description="暂无活跃客户" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const metrics = ref({ totalCustomers: 0, todayTasks: 0, sessionsThisMonth: 0, conversionRate: 0, taskCompletionRate: 0, followUpRate: 0 });
const todayTasks = ref<any[]>([]);
const recentCustomers = ref<any[]>([]);

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

async function fetchData() {
  const [m, t, c] = await Promise.all([
    request.get('/consultant/dashboard/metrics'),
    request.get('/consultant/dashboard/today-tasks'),
    request.get('/consultant/dashboard/recent-customers'),
  ]);
  metrics.value = m as unknown as any;
  todayTasks.value = t as unknown as any[];
  recentCustomers.value = c as unknown as any[];
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
