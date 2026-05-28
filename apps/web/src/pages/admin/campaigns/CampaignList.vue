<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">营销中心</h2>
      <el-button type="primary" @click="showCreateDialog">创建活动</el-button>
    </div>
    <div class="table-card">
      <el-table :data="campaigns" stripe v-loading="loading">
        <el-table-column prop="name" label="活动名称" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="targetProduct" label="目标产品" width="120" />
        <el-table-column prop="discount" label="优惠" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="matchCustomers(row.id)">匹配客户</el-button>
            <el-button size="small" @click="generateMessages(row.id)">生成话术</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-dialog title="创建活动" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width:100%">
            <el-option label="促销活动" value="promotion" /><el-option label="新品上市" value="new_product" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" /></el-form-item>
        <el-form-item label="目标产品"><el-input v-model="form.targetProduct" /></el-form-item>
        <el-form-item label="优惠"><el-input v-model="form.discount" placeholder="如：8折" /></el-form-item>
        <el-form-item label="开始日期"><el-date-picker v-model="form.startDate" type="date" style="width:100%" /></el-form-item>
        <el-form-item label="结束日期"><el-date-picker v-model="form.endDate" type="date" style="width:100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';
const campaigns = ref<any[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const form = ref({ name: '', type: 'promotion', description: '', targetProduct: '', discount: '', startDate: '', endDate: '', relatedProducts: [] });

async function fetchData() { loading.value = true; campaigns.value = (await request.get('/campaigns')) as any[]; loading.value = false; }

function showCreateDialog() { dialogVisible.value = true; }

async function handleSubmit() {
  const payload: any = { ...form.value };
  if (payload.startDate && payload.endDate) {
    payload.startDate = new Date(payload.startDate).toISOString();
    payload.endDate = new Date(payload.endDate).toISOString();
  } else {
    ElMessage.warning('请选择活动日期');
    return;
  }
  const result = await request.post('/campaigns', payload);
  if (result) {
    ElMessage.success('创建成功');
    dialogVisible.value = false;
    form.value = { name: '', type: 'promotion', description: '', targetProduct: '', discount: '', startDate: '', endDate: '', relatedProducts: [] };
    fetchData();
  }
}

async function matchCustomers(id: string) {
  await request.post(`/campaigns/${id}/match`);
  ElMessage.success('客户匹配完成');
}

async function generateMessages(id: string) {
  await request.post(`/campaigns/${id}/generate`);
  ElMessage.success('话术生成完成');
}

onMounted(fetchData);
</script>
