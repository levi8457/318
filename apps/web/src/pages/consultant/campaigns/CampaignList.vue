<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">营销执行</h2>
    </div>

    <div class="table-card">
      <el-table :data="campaigns" stripe v-loading="loading">
        <el-table-column prop="name" label="活动名称" min-width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ typeMap[row.type] || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetProduct" label="目标产品" width="120" />
        <el-table-column prop="discount" label="优惠" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status] || 'info'">
              {{ statusMap[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewOutreaches(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog title="活动详情" v-model="detailVisible" width="600px">
      <div v-if="currentCampaign">
        <p><strong>活动名称：</strong>{{ currentCampaign.name }}</p>
        <p><strong>目标产品：</strong>{{ currentCampaign.targetProduct }}</p>
        <p><strong>优惠：</strong>{{ currentCampaign.discount || '-' }}</p>
        <p style="margin-top:8px; color:#606266">{{ currentCampaign.description }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import request from '@/api/request';

const campaigns = ref<any[]>([]);
const loading = ref(false);
const detailVisible = ref(false);
const currentCampaign = ref<any>(null);

const statusMap: Record<string, string> = {
  draft: '草稿',
  active: '进行中',
  completed: '已完成',
};

const statusType: Record<string, string> = {
  draft: 'info',
  active: 'success',
  completed: '',
};

const typeMap: Record<string, string> = {
  upgrade: '升单',
  promotion: '促销',
  new_product: '新品',
  anniversary: '周年庆',
};

async function fetchData() {
  loading.value = true;
  const res: any = await request.get('/campaigns');
  campaigns.value = Array.isArray(res) ? res : [];
  loading.value = false;
}

function viewOutreaches(row: any) {
  currentCampaign.value = row;
  detailVisible.value = true;
}

onMounted(fetchData);
</script>
