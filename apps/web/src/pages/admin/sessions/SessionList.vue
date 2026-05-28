<template>
  <div class="page-container">
    <div class="page-header"><h2 class="page-title">全部会话</h2></div>
    <div class="table-card">
      <el-table :data="sessions" stripe v-loading="loading">
        <el-table-column prop="customer" label="客户" width="100">
          <template #default="{ row }">{{ row.customer?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status === 'completed' ? 'success' : 'warning'">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="summary" label="摘要" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import request from '@/api/request';
const sessions = ref<any[]>([]);
const loading = ref(false);
onMounted(async () => { loading.value = true; sessions.value = (await request.get('/sessions')) as any[]; loading.value = false; });
</script>
