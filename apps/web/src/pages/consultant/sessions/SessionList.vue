<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">我的会话</h2>
    </div>

    <div class="table-card">
      <div class="filter-bar">
        <el-select v-model="statusFilter" placeholder="状态" clearable style="width:120px" @change="fetchData">
          <el-option label="待上传音频" value="pending" />
          <el-option label="转写中" value="transcribing" />
          <el-option label="已完成" value="completed" />
          <el-option label="转写失败" value="failed" />
        </el-select>
      </div>

      <el-table :data="filteredSessions" stripe v-loading="loading" @row-click="goDetail">
        <el-table-column prop="customer" label="客户" width="120">
          <template #default="{ row }">{{ row.customer?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status] || 'info'">
              {{ statusMap[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="summary" label="AI 摘要" show-overflow-tooltip min-width="200" />
        <el-table-column prop="duration" label="时长" width="80">
          <template #default="{ row }">{{ row.duration ? `${row.duration}s` : '-' }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="120">
          <template #default="{ row }">{{ row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="goDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 统计信息 -->
      <div class="stats-bar">
        <span>总计: {{ sessions.length }}</span>
        <span>待上传: {{ sessions.filter(s => s.status === 'pending').length }}</span>
        <span>已完成: {{ sessions.filter(s => s.status === 'completed').length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '@/api/request';

const router = useRouter();
const sessions = ref<any[]>([]);
const loading = ref(false);
const statusFilter = ref('');

const statusMap: Record<string, string> = {
  pending: '待上传音频',
  transcribing: '转写中',
  completed: '已完成',
  failed: '转写失败',
};

const statusType: Record<string, string> = {
  pending: 'warning',
  transcribing: 'warning',
  completed: 'success',
  failed: 'danger',
};

const filteredSessions = computed(() => {
  if (!statusFilter.value) return sessions.value;
  return sessions.value.filter(s => s.status === statusFilter.value);
});

async function fetchData() {
  loading.value = true;
  const res: any = await request.get('/sessions');
  sessions.value = Array.isArray(res) ? res : [];
  loading.value = false;
}

function goDetail(rowOrId: any) {
  const id = typeof rowOrId === 'string' ? rowOrId : rowOrId?.id;
  if (id) {
    router.push(`/dashboard/sessions/${id}`);
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
