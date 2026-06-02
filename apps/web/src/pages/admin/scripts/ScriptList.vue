<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">话术库管理</h2>
    </div>

    <div class="table-card">
      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索话术..."
          clearable
          style="width: 300px"
          @clear="fetchData"
          @keyup.enter="fetchData"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="categoryFilter" placeholder="分类" clearable style="width: 120px" @change="fetchData">
          <el-option label="抗衰" value="抗衰" />
          <el-option label="塑形" value="塑形" />
          <el-option label="皮肤" value="皮肤" />
          <el-option label="微整" value="微整" />
        </el-select>
        <el-select v-model="approvedFilter" placeholder="审核状态" clearable style="width: 120px" @change="fetchData">
          <el-option label="已审核" value="true" />
          <el-option label="待审核" value="false" />
        </el-select>
      </div>

      <el-table :data="scripts" stripe v-loading="loading">
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="scenario" label="场景" width="150" />
        <el-table-column prop="script" label="话术内容" show-overflow-tooltip min-width="200" />
        <el-table-column prop="isApproved" label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isApproved ? 'success' : 'warning'">
              {{ row.isApproved ? '已审核' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="usageCount" label="使用次数" width="80" />
        <el-table-column prop="likeCount" label="点赞" width="60" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="!row.isApproved" size="small" type="success" @click="approve(row.id)">审核通过</el-button>
            <el-button size="small" @click="viewDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog title="话术详情" v-model="detailVisible" width="600px">
      <div v-if="currentScript">
        <p><strong>分类：</strong>{{ currentScript.category }}</p>
        <p><strong>场景：</strong>{{ currentScript.scenario }}</p>
        <p style="margin-top:12px; line-height:1.8">{{ currentScript.script }}</p>
        <div style="margin-top:12px; color:#909399">
          <span>使用次数：{{ currentScript.usageCount }}</span>
          <span style="margin-left:16px">点赞：{{ currentScript.likeCount }}</span>
          <span style="margin-left:16px">转化率：{{ (currentScript.conversionRate * 100).toFixed(1) }}%</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import request from '@/api/request';

const scripts = ref<any[]>([]);
const loading = ref(false);
const keyword = ref('');
const categoryFilter = ref('');
const approvedFilter = ref('');
const detailVisible = ref(false);
const currentScript = ref<any>(null);

async function fetchData() {
  loading.value = true;
  const params: Record<string, any> = {};
  if (keyword.value) params.keyword = keyword.value;
  if (categoryFilter.value) params.category = categoryFilter.value;
  if (approvedFilter.value) params.isApproved = approvedFilter.value;

  const res: any = await request.get('/scripts', { params });
  scripts.value = Array.isArray(res) ? res : [];
  loading.value = false;
}

async function approve(id: string) {
  await request.put(`/scripts/${id}/approve`);
  ElMessage.success('审核通过');
  fetchData();
}

function viewDetail(row: any) {
  currentScript.value = row;
  detailVisible.value = true;
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
</style>
