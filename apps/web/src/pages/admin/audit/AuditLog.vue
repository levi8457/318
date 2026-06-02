<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">操作日志</h2>
    </div>

    <div class="table-card">
      <div class="filter-bar">
        <el-select v-model="resourceTypeFilter" placeholder="资源类型" clearable style="width: 140px" @change="fetchData">
          <el-option label="客户" value="customer" />
          <el-option label="会话" value="session" />
          <el-option label="任务" value="task" />
          <el-option label="用户" value="user" />
          <el-option label="话术" value="script" />
          <el-option label="营销" value="campaign" />
        </el-select>
        <el-select v-model="actionFilter" placeholder="操作类型" clearable style="width: 140px" @change="fetchData">
          <el-option label="创建" value="create" />
          <el-option label="更新" value="update" />
          <el-option label="删除" value="delete" />
          <el-option label="查看" value="view" />
          <el-option label="登录" value="login" />
        </el-select>
        <el-button type="primary" @click="fetchData">搜索</el-button>
      </div>

      <el-table :data="logs" stripe v-loading="loading">
        <el-table-column label="操作人" width="120">
          <template #default="{ row }">{{ row.user?.realName || row.user?.username || '-' }}</template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="actionType[row.action] || 'info'">
              {{ actionMap[row.action] || row.action }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resourceType" label="资源类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ resourceTypeMap[row.resourceType] || row.resourceType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resourceId" label="资源ID" width="120" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="130" />
        <el-table-column prop="createdAt" label="操作时间" width="180">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import request from '@/api/request';

const logs = ref<any[]>([]);
const loading = ref(false);
const resourceTypeFilter = ref('');
const actionFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

const actionMap: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  view: '查看',
  login: '登录',
  logout: '登出',
};

const actionType: Record<string, string> = {
  create: 'success',
  update: 'warning',
  delete: 'danger',
  view: 'info',
  login: '',
};

const resourceTypeMap: Record<string, string> = {
  customer: '客户',
  session: '会话',
  task: '任务',
  user: '用户',
  script: '话术',
  campaign: '营销',
  strategy_template: '策略模板',
  sop_template: 'SOP模板',
};

async function fetchData() {
  loading.value = true;
  const params: Record<string, any> = {
    page: currentPage.value,
    pageSize: pageSize.value,
  };
  if (resourceTypeFilter.value) params.resourceType = resourceTypeFilter.value;
  if (actionFilter.value) params.action = actionFilter.value;

  const res: any = await request.get('/admin/audit-logs', { params });
  if (res) {
    logs.value = res.items || [];
    total.value = res.total || 0;
  }
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

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
