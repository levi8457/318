<template>
  <div class="page-container">
    <div class="page-header"><h2 class="page-title">话术库管理</h2></div>
    <div class="table-card">
      <el-table :data="scripts" stripe v-loading="loading">
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="scenario" label="场景" width="150" />
        <el-table-column prop="script" label="话术内容" show-overflow-tooltip />
        <el-table-column prop="isApproved" label="审核状态" width="100">
          <template #default="{ row }"><el-tag :type="row.isApproved ? 'success' : 'warning'">{{ row.isApproved ? '已审核' : '待审核' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="conversionRate" label="转化率" width="80" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button v-if="!row.isApproved" size="small" type="success" @click="approve(row.id)">审核通过</el-button>
            <el-button size="small" @click="editScript(row)">编辑</el-button>
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
const scripts = ref<any[]>([]);
const loading = ref(false);

async function fetchData() {
  loading.value = true; scripts.value = (await request.get('/scripts')) as any[]; loading.value = false;
}

async function approve(id: string) {
  await request.put(`/scripts/${id}/approve`);
  ElMessage.success('审核通过'); fetchData();
}

function editScript(row: any) { ElMessage.info('编辑功能'); }

onMounted(fetchData);
</script>
