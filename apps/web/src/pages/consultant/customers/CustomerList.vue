<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">我的客户</h2>
      <el-button type="primary" @click="showCreateDialog">新增客户</el-button>
    </div>
    <div class="table-card">
      <el-input v-model="searchKeyword" placeholder="搜索姓名/电话" style="width:240px; margin-bottom:12px" clearable />
      <el-table :data="filteredCustomers" stripe v-loading="loading" @row-click="goDetail">
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="source" label="来源" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : row.status === 'lost' ? 'danger' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="budgetSensitivity" label="预算" width="80" />
        <el-table-column prop="lastContactAt" label="最后联系" width="120">
          <template #default="{ row }">{{ row.lastContactAt ? new Date(row.lastContactAt).toLocaleDateString() : '-' }}</template>
        </el-table-column>
      </el-table>
    </div>

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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const router = useRouter();
const customers = ref<any[]>([]);
const loading = ref(false);
const searchKeyword = ref('');
const dialogVisible = ref(false);
const form = ref({ name: '', phone: '', source: '' });

const filteredCustomers = computed(() => {
  if (!searchKeyword.value) return customers.value;
  const kw = searchKeyword.value.toLowerCase();
  return customers.value.filter((c: any) => c.name.includes(kw) || c.phone.includes(kw));
});

async function fetchData() { loading.value = true; customers.value = (await request.get('/customers')) as any[]; loading.value = false; }

async function handleCreate() {
  await request.post('/customers', form.value);
  ElMessage.success('客户创建成功');
  dialogVisible.value = false; fetchData();
}

function showCreateDialog() { form.value = { name: '', phone: '', source: '' }; dialogVisible.value = true; }
function goDetail(row: any) { router.push(`/customers/${row.id}`); }

onMounted(fetchData);
</script>
