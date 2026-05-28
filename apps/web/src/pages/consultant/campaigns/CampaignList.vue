<template>
  <div class="page-container">
    <div class="page-header"><h2 class="page-title">营销执行</h2></div>
    <div class="table-card">
      <el-table :data="campaigns" stripe v-loading="loading">
        <el-table-column prop="name" label="活动名称" />
        <el-table-column prop="targetProduct" label="目标产品" width="120" />
        <el-table-column prop="discount" label="优惠" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" @click="viewOutreaches(row.id)">查看触达</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import request from '@/api/request';
const campaigns = ref<any[]>([]);
const loading = ref(false);
function viewOutreaches(id: string) { /* 查看触达记录 */ }
onMounted(async () => { loading.value = true; campaigns.value = (await request.get('/campaigns')) as any[]; loading.value = false; });
</script>
