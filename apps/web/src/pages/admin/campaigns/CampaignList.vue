<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">营销中心</h2>
      <el-button type="primary" @click="showCreateDialog">创建活动</el-button>
    </div>

    <div class="table-card">
      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索活动名称..."
          clearable
          style="width: 240px"
          @clear="fetchData"
          @keyup.enter="fetchData"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 120px" @change="fetchData">
          <el-option label="草稿" value="draft" />
          <el-option label="进行中" value="active" />
          <el-option label="已完成" value="completed" />
        </el-select>
        <el-button type="primary" @click="fetchData">搜索</el-button>
      </div>

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
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="matchCustomers(row.id)" :loading="matching">匹配客户</el-button>
            <el-button size="small" type="success" @click="generateMessages(row.id)" :loading="generating">生成话术</el-button>
            <el-button size="small" @click="viewOutreaches(row)">触达记录</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 创建/编辑弹窗 -->
    <el-dialog :title="isEdit ? '编辑活动' : '创建活动'" v-model="dialogVisible" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="活动名称">
          <el-input v-model="form.name" placeholder="如：热玛吉周年庆活动" />
        </el-form-item>
        <el-form-item label="活动类型">
          <el-select v-model="form.type" style="width:100%">
            <el-option label="促销活动" value="promotion" />
            <el-option label="新品上市" value="new_product" />
            <el-option label="升单活动" value="upgrade" />
            <el-option label="周年庆" value="anniversary" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="目标产品">
          <el-input v-model="form.targetProduct" placeholder="如：热玛吉" />
        </el-form-item>
        <el-form-item label="关联产品">
          <el-select v-model="form.relatedProducts" multiple placeholder="选择关联产品" style="width:100%">
            <el-option label="热玛吉" value="热玛吉" />
            <el-option label="超声炮" value="超声炮" />
            <el-option label="玻尿酸" value="玻尿酸" />
            <el-option label="肉毒素" value="肉毒素" />
            <el-option label="光子嫩肤" value="光子嫩肤" />
          </el-select>
        </el-form-item>
        <el-form-item label="优惠信息">
          <el-input v-model="form.discount" placeholder="如：8折/立减2000" />
        </el-form-item>
        <el-form-item label="活动日期">
          <el-date-picker v-model="form.dateRange" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" style="width:100%" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 触达记录弹窗 -->
    <el-dialog title="触达记录" v-model="outreachVisible" width="800px">
      <el-table :data="outreaches" stripe v-loading="outreachLoading">
        <el-table-column label="客户" width="120">
          <template #default="{ row }">{{ row.customer?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="matchedReason" label="匹配原因" min-width="150" show-overflow-tooltip />
        <el-table-column prop="matchScore" label="匹配分" width="80">
          <template #default="{ row }">{{ (row.matchScore * 100).toFixed(0) }}%</template>
        </el-table-column>
        <el-table-column prop="generatedMessage" label="生成话术" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="outreachStatusType[row.status] || 'info'" size="small">
              {{ outreachStatusMap[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import request from '@/api/request';

const campaigns = ref<any[]>([]);
const outreaches = ref<any[]>([]);
const loading = ref(false);
const matching = ref(false);
const generating = ref(false);
const outreachLoading = ref(false);
const keyword = ref('');
const statusFilter = ref('');
const dialogVisible = ref(false);
const outreachVisible = ref(false);
const isEdit = ref(false);
const editId = ref('');
const form = ref({
  name: '',
  type: 'promotion',
  description: '',
  targetProduct: '',
  relatedProducts: [] as string[],
  discount: '',
  dateRange: null as any,
});

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

const outreachStatusMap: Record<string, string> = {
  pending: '待发送',
  sent: '已发送',
  responded: '已回复',
  converted: '已转化',
};

const outreachStatusType: Record<string, string> = {
  pending: 'info',
  sent: 'warning',
  responded: 'primary',
  converted: 'success',
};

async function fetchData() {
  loading.value = true;
  const params: Record<string, any> = {};
  if (keyword.value) params.keyword = keyword.value;
  if (statusFilter.value) params.status = statusFilter.value;

  const res: any = await request.get('/campaigns', { params });
  campaigns.value = Array.isArray(res) ? res : [];
  loading.value = false;
}

function showCreateDialog() {
  isEdit.value = false;
  form.value = {
    name: '',
    type: 'promotion',
    description: '',
    targetProduct: '',
    relatedProducts: [],
    discount: '',
    dateRange: null,
  };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.name) {
    ElMessage.warning('请输入活动名称');
    return;
  }

  const payload: any = { ...form.value };
  if (form.value.dateRange) {
    payload.startDate = new Date(form.value.dateRange[0]).toISOString();
    payload.endDate = new Date(form.value.dateRange[1]).toISOString();
  } else {
    ElMessage.warning('请选择活动日期');
    return;
  }

  if (isEdit.value) {
    await request.put(`/campaigns/${editId.value}`, payload);
  } else {
    await request.post('/campaigns', payload);
  }
  ElMessage.success('操作成功');
  dialogVisible.value = false;
  fetchData();
}

async function matchCustomers(id: string) {
  matching.value = true;
  try {
    const res: any = await request.post(`/campaigns/${id}/match`);
    ElMessage.success(`客户匹配完成，共匹配 ${(res as any[])?.length || 0} 个客户`);
  } catch {
    ElMessage.error('匹配失败');
  }
  matching.value = false;
}

async function generateMessages(id: string) {
  generating.value = true;
  try {
    await request.post(`/campaigns/${id}/generate`);
    ElMessage.success('话术生成完成');
  } catch {
    ElMessage.error('生成失败');
  }
  generating.value = false;
}

async function viewOutreaches(row: any) {
  outreachLoading.value = true;
  outreachVisible.value = true;
  try {
    const res: any = await request.get(`/campaigns/${row.id}/outreaches`);
    outreaches.value = Array.isArray(res) ? res : [];
  } catch {
    outreaches.value = [];
  }
  outreachLoading.value = false;
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
