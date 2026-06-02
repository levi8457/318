<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">全部客户</h2>
    </div>

    <!-- 搜索和筛选 -->
    <div class="table-card">
      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索姓名或手机号"
          clearable
          style="width: 240px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 120px" @change="handleSearch">
          <el-option label="活跃" value="active" />
          <el-option label="不活跃" value="inactive" />
          <el-option label="流失" value="lost" />
        </el-select>
        <el-select v-model="budgetFilter" placeholder="预算" clearable style="width: 120px" @change="handleSearch">
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>

      <!-- 客户表格 -->
      <el-table :data="customers" stripe v-loading="loading">
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column label="归属咨询师" width="120">
          <template #default="{ row }">{{ row.consultant?.realName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : row.status === 'lost' ? 'danger' : 'info'">
              {{ statusMap[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="budgetSensitivity" label="预算" width="80">
          <template #default="{ row }">{{ budgetMap[row.budgetSensitivity] || row.budgetSensitivity }}</template>
        </el-table-column>
        <el-table-column prop="lastContactAt" label="最后联系" width="160">
          <template #default="{ row }">{{ row.lastContactAt ? new Date(row.lastContactAt).toLocaleDateString() : '-' }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleDateString() }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToDetail(row.id)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import request from '@/api/request';

const router = useRouter();
const customers = ref<any[]>([]);
const loading = ref(false);
const keyword = ref('');
const statusFilter = ref('');
const budgetFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

const statusMap: Record<string, string> = {
  active: '活跃',
  inactive: '不活跃',
  lost: '流失',
};

const budgetMap: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

async function fetchCustomers() {
  loading.value = true;
  const params: Record<string, any> = {
    page: currentPage.value,
    pageSize: pageSize.value,
  };
  if (keyword.value) params.keyword = keyword.value;
  if (statusFilter.value) params.status = statusFilter.value;
  if (budgetFilter.value) params.budgetSensitivity = budgetFilter.value;

  const res: any = await request.get('/customers', { params });
  if (res) {
    customers.value = res.items || [];
    total.value = res.total || 0;
  }
  loading.value = false;
}

function handleSearch() {
  currentPage.value = 1;
  fetchCustomers();
}

function goToDetail(id: string) {
  router.push(`/admin/customers/${id}`);
}

onMounted(() => {
  fetchCustomers();
});
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
