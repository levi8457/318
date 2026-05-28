<template>
  <div class="page-container">
    <div class="page-header"><h2 class="page-title">全部任务</h2></div>
    <div class="table-card">
      <el-table :data="tasks" stripe v-loading="loading">
        <el-table-column prop="title" label="任务" />
        <el-table-column prop="taskType" label="类型" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status === 'completed' ? 'success' : row.status === 'overdue' ? 'danger' : 'warning'">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" />
        <el-table-column prop="triggerDate" label="到期日" width="120">
          <template #default="{ row }">{{ new Date(row.triggerDate).toLocaleDateString() }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import request from '@/api/request';
const tasks = ref<any[]>([]);
const loading = ref(false);
onMounted(async () => { loading.value = true; tasks.value = (await request.get('/tasks')) as any[]; loading.value = false; });
</script>
