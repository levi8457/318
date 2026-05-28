<template>
  <div class="page-container">
    <div class="page-header"><h2 class="page-title">我的任务</h2></div>
    <div class="table-card">
      <el-table :data="tasks" stripe v-loading="loading">
        <el-table-column prop="title" label="任务" />
        <el-table-column prop="taskType" label="类型" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'overdue' ? 'danger' : 'warning'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="careMessage" label="关怀话术" show-overflow-tooltip />
        <el-table-column prop="triggerDate" label="到期日" width="120">
          <template #default="{ row }">{{ new Date(row.triggerDate).toLocaleDateString() }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending' || row.status === 'overdue'" size="small" type="success" @click="completeTask(row.id)">完成</el-button>
            <el-button v-if="row.status === 'pending'" size="small" type="warning" @click="cancelTask(row.id)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';
const tasks = ref<any[]>([]);
const loading = ref(false);

async function fetchData() { loading.value = true; tasks.value = (await request.get('/tasks')) as any[]; loading.value = false; }
async function completeTask(id: string) { await request.put(`/tasks/${id}`, { status: 'completed' }); ElMessage.success('已完成'); fetchData(); }
async function cancelTask(id: string) { await request.put(`/tasks/${id}`, { status: 'cancelled' }); ElMessage.success('已取消'); fetchData(); }
onMounted(fetchData);
</script>
