<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">跟进策略</h2>
    </div>

    <div class="table-card">
      <div class="filter-bar">
        <el-select v-model="statusFilter" placeholder="状态" clearable style="width:120px" @change="fetchData">
          <el-option label="草稿" value="draft" />
          <el-option label="已确认" value="confirmed" />
          <el-option label="执行中" value="executing" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
      </div>

      <el-table :data="plans" stripe v-loading="loading" @row-click="goDetail">
        <el-table-column label="客户" width="120">
          <template #default="{ row }">{{ row.customer?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status] || 'info'">
              {{ statusMap[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="AI摘要" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.aiSummary?.substring(0, 80) || '-' }}...</template>
        </el-table-column>
        <el-table-column label="跟进次数" width="100">
          <template #default="{ row }">{{ row.followUpRecords?.length || 0 }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="goDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div style="padding:40px; text-align:center">
            <p style="color:#909399; font-size:16px">暂无跟进策略</p>
            <p style="color:#c0c4cc; font-size:13px; margin-top:8px">创建会话并完成 AI 分析后，系统会自动生成跟进策略草稿</p>
          </div>
        </template>
      </el-table>

      <!-- 统计信息 -->
      <div class="stats-bar">
        <span>总计: {{ plans.length }}</span>
        <span>草稿: {{ plans.filter(p => p.status === 'draft').length }}</span>
        <span>执行中: {{ plans.filter(p => p.status === 'executing').length }}</span>
        <span>已完成: {{ plans.filter(p => p.status === 'completed').length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '@/api/request';

const router = useRouter();
const plans = ref<any[]>([]);
const loading = ref(false);
const statusFilter = ref('');

const statusMap: Record<string, string> = {
  draft: '草稿',
  confirmed: '已确认',
  executing: '执行中',
  completed: '已完成',
  cancelled: '已取消',
};

const statusType: Record<string, string> = {
  draft: 'warning',
  confirmed: 'primary',
  executing: '',
  completed: 'success',
  cancelled: 'info',
};

async function fetchData() {
  loading.value = true;
  const params: Record<string, any> = {};
  if (statusFilter.value) params.status = statusFilter.value;

  const res: any = await request.get('/follow-up-plans', { params });
  plans.value = Array.isArray(res) ? res : [];
  loading.value = false;
}

function goDetail(rowOrId: any) {
  const id = typeof rowOrId === 'string' ? rowOrId : rowOrId?.id;
  if (id) {
    router.push(`/dashboard/follow-up-plans/${id}`);
  }
}

onMounted(fetchData);
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.stats-bar {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  color: #606266;
  font-size: 14px;
}
</style>
