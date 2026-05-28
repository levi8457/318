<template>
  <div class="page-container">
    <div class="page-header"><h2 class="page-title">全部客户</h2></div>
    <div class="table-card">
      <el-table :data="customers" stripe v-loading="loading">
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="source" label="来源" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : row.status === 'lost' ? 'danger' : 'info'">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="budgetSensitivity" label="预算" width="80" />
        <el-table-column prop="lastContactAt" label="最后联系" width="160">
          <template #default="{ row }">{{ row.lastContactAt ? new Date(row.lastContactAt).toLocaleDateString() : '-' }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import request from '@/api/request';
const customers = ref<any[]>([]);
const loading = ref(false);
onMounted(async () => { loading.value = true; customers.value = (await request.get('/customers')) as any[]; loading.value = false; });
</script>
