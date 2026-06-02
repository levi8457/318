<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">我的客户</h2>
      <el-button type="primary" @click="showCreateDialog">新增客户</el-button>
    </div>

    <div class="table-card">
      <!-- 搜索 -->
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
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>

      <!-- 客户表格 -->
      <el-table :data="customers" stripe v-loading="loading" @row-click="goDetail">
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="电话" width="130" />
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
        <el-table-column prop="lastContactAt" label="最后联系" width="120">
          <template #default="{ row }">{{ row.lastContactAt ? new Date(row.lastContactAt).toLocaleDateString() : '-' }}</template>
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
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </div>

    <!-- 新增客户弹窗 -->
    <el-dialog title="新增客户" v-model="dialogVisible" width="400px">
      <el-form :model="form" label-width="60px">
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="来源"><el-input v-model="form.source" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import request from '@/api/request';

const router = useRouter();
const customers = ref<any[]>([]);
const loading = ref(false);
const keyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const dialogVisible = ref(false);
const form = ref({ name: '', phone: '', source: '' });

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

async function fetchData() {
  loading.value = true;
  const params: Record<string, any> = {
    page: currentPage.value,
    pageSize: pageSize.value,
  };
  if (keyword.value) params.keyword = keyword.value;

  const res: any = await request.get('/customers', { params });
  if (res) {
    customers.value = res.items || [];
    total.value = res.total || 0;
  }
  loading.value = false;
}

function handleSearch() {
  currentPage.value = 1;
  fetchData();
}

async function handleCreate() {
  if (!form.value.name || !form.value.phone) {
    ElMessage.warning('请填写姓名和电话');
    return;
  }
  await request.post('/customers', form.value);
  ElMessage.success('客户创建成功');
  dialogVisible.value = false;
  fetchData();
}

function showCreateDialog() {
  form.value = { name: '', phone: '', source: '' };
  dialogVisible.value = true;
}

function goDetail(rowOrId: any) {
  const id = typeof rowOrId === 'string' ? rowOrId : rowOrId?.id;
  if (id) {
    router.push(`/customers/${id}`);
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

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
