<template>
  <div class="page-container">
    <div class="page-header">
      <el-button @click="$router.back()">返回</el-button>
      <h2 class="page-title" style="display:inline; margin-left:12px">{{ consultant?.realName }} - 咨询师详情</h2>
      <el-tag style="margin-left:12px" :type="consultant?.isActive ? 'success' : 'danger'">
        {{ consultant?.isActive ? '在职' : '已停用' }}
      </el-tag>
    </div>

    <div v-if="loading" style="text-align:center; padding:60px">
      <el-icon class="is-loading" style="font-size:40px"><Loading /></el-icon>
    </div>

    <template v-else-if="consultant">
      <!-- 基本信息 -->
      <div class="card-grid">
        <div class="stat-card">
          <div class="stat-label">工号</div>
          <div class="stat-value" style="font-size:18px">{{ consultant.employeeNo || '-' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">手机号</div>
          <div class="stat-value" style="font-size:18px">{{ consultant.phone || '-' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">客户数</div>
          <div class="stat-value">{{ consultant.customerCount || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">入职时间</div>
          <div class="stat-value" style="font-size:16px">{{ consultant.joinedAt ? new Date(consultant.joinedAt).toLocaleDateString() : '-' }}</div>
        </div>
      </div>

      <!-- 擅长领域 -->
      <div class="table-card">
        <h3>擅长领域</h3>
        <div style="margin-top:12px">
          <el-tag v-for="s in (consultant.speciality || [])" :key="s" style="margin:4px">{{ s }}</el-tag>
          <span v-if="!consultant.speciality?.length" style="color:#909399">暂未设置</span>
        </div>
      </div>

      <!-- 备注 -->
      <div class="table-card" v-if="consultant.notes">
        <h3>备注</h3>
        <p style="margin-top:8px; color:#606266">{{ consultant.notes }}</p>
      </div>

      <!-- 最近客户 -->
      <div class="table-card">
        <h3>最近客户</h3>
        <el-table :data="recentCustomers" stripe style="margin-top:12px" v-loading="customersLoading">
          <el-table-column prop="name" label="客户姓名" width="120" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : row.status === 'lost' ? 'danger' : 'info'" size="small">
                {{ statusMap[row.status] || row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="120">
            <template #default="{ row }">{{ new Date(row.createdAt).toLocaleDateString() }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!recentCustomers.length && !customersLoading" description="暂无客户" :image-size="60" />
      </div>

      <!-- 最近会话 -->
      <div class="table-card">
        <h3>最近会话</h3>
        <el-table :data="recentSessions" stripe style="margin-top:12px" v-loading="sessionsLoading">
          <el-table-column label="客户" width="120">
            <template #default="{ row }">{{ row.customer?.name || '-' }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="sessionStatusType[row.status] || 'info'" size="small">
                {{ sessionStatusMap[row.status] || row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="summary" label="摘要" show-overflow-tooltip />
          <el-table-column prop="createdAt" label="创建时间" width="120">
            <template #default="{ row }">{{ new Date(row.createdAt).toLocaleDateString() }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!recentSessions.length && !sessionsLoading" description="暂无会话" :image-size="60" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Loading } from '@element-plus/icons-vue';
import request from '@/api/request';

const route = useRoute();
const consultant = ref<any>(null);
const recentCustomers = ref<any[]>([]);
const recentSessions = ref<any[]>([]);
const loading = ref(true);
const customersLoading = ref(true);
const sessionsLoading = ref(true);

const statusMap: Record<string, string> = {
  active: '活跃',
  inactive: '不活跃',
  lost: '流失',
};

const sessionStatusMap: Record<string, string> = {
  pending: '待上传',
  transcribing: '转写中',
  completed: '已完成',
  failed: '失败',
};

const sessionStatusType: Record<string, string> = {
  pending: 'warning',
  transcribing: 'warning',
  completed: 'success',
  failed: 'danger',
};

async function fetchData() {
  loading.value = true;
  try {
    consultant.value = await request.get(`/admin/consultants/${route.params.id}`);
  } catch {
    // ignore
  }
  loading.value = false;

  // 获取该咨询师的客户
  customersLoading.value = true;
  try {
    const res: any = await request.get('/customers', { params: { pageSize: 10 } });
    recentCustomers.value = res?.items || [];
  } catch {
    recentCustomers.value = [];
  }
  customersLoading.value = false;

  // 获取该咨询师的会话
  sessionsLoading.value = true;
  try {
    const res: any = await request.get('/sessions');
    recentSessions.value = Array.isArray(res) ? res.slice(0, 10) : [];
  } catch {
    recentSessions.value = [];
  }
  sessionsLoading.value = false;
}

onMounted(fetchData);
</script>
