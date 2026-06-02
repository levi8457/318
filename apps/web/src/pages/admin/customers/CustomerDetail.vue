<template>
  <div class="page-container" v-if="customer">
    <div class="page-header">
      <el-button @click="$router.back()">返回</el-button>
      <h2 class="page-title" style="display:inline; margin-left:12px">{{ customer.name }} - 客户详情</h2>
    </div>

    <!-- 基本信息 -->
    <div class="card-grid">
      <div class="stat-card">
        <div class="stat-label">电话</div>
        <div class="stat-value" style="font-size:16px">{{ customer.phone }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">归属咨询师</div>
        <div class="stat-value" style="font-size:16px">{{ customer.consultant?.realName || '-' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">来源</div>
        <div class="stat-value" style="font-size:16px">{{ customer.source || '-' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">状态</div>
        <el-tag :type="customer.status === 'active' ? 'success' : customer.status === 'lost' ? 'danger' : 'info'">
          {{ statusMap[customer.status] || customer.status }}
        </el-tag>
      </div>
      <div class="stat-card">
        <div class="stat-label">预算敏感度</div>
        <div class="stat-value" style="font-size:16px">{{ budgetMap[customer.budgetSensitivity] || customer.budgetSensitivity }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">创建时间</div>
        <div class="stat-value" style="font-size:16px">{{ new Date(customer.createdAt).toLocaleDateString() }}</div>
      </div>
    </div>

    <!-- 标签 -->
    <div class="table-card">
      <h3>客户标签</h3>
      <div style="margin-top:8px">
        <el-tag v-for="t in customer.tags" :key="t.id" style="margin:4px">
          {{ t.category }}: {{ t.value }}
        </el-tag>
        <span v-if="!customer.tags?.length" style="color:#909399">暂无标签</span>
      </div>
    </div>

    <!-- 喜好备忘录 -->
    <div class="table-card">
      <h3>私人喜好备忘录</h3>
      <div v-if="customer.preferences?.length" style="margin-top:8px">
        <div v-for="p in customer.preferences" :key="p.id" class="pref-item">
          <span class="pref-category">[{{ p.category }}]</span>
          {{ p.content }}
          <el-tag size="small" :type="p.importance === 'critical' ? 'danger' : p.importance === 'important' ? 'warning' : 'info'">
            {{ importanceMap[p.importance] || p.importance }}
          </el-tag>
        </div>
      </div>
      <span v-else style="color:#909399">暂无备忘录</span>
    </div>

    <!-- 项目时间轴 -->
    <div class="table-card">
      <h3>历史项目时间轴</h3>
      <el-timeline style="margin-top:12px" v-if="customer.projects?.length">
        <el-timeline-item
          v-for="p in customer.projects"
          :key="p.id"
          :timestamp="new Date(p.date).toLocaleDateString()"
          placement="top"
        >
          <div class="timeline-item">
            <span class="timeline-title">{{ p.projectName }}</span>
            <el-tag size="small" :type="p.status === 'completed' ? 'success' : p.status === 'in_progress' ? 'warning' : 'info'">
              {{ projectStatusMap[p.status] || p.status }}
            </el-tag>
          </div>
        </el-timeline-item>
      </el-timeline>
      <span v-else style="color:#909399">暂无项目记录</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import request from '@/api/request';

const route = useRoute();
const customer = ref<any>(null);

const statusMap: Record<string, string> = { active: '活跃', inactive: '不活跃', lost: '流失' };
const budgetMap: Record<string, string> = { high: '高', medium: '中', low: '低' };
const importanceMap: Record<string, string> = { normal: '普通', important: '重要', critical: '关键' };
const projectStatusMap: Record<string, string> = { planned: '计划中', in_progress: '进行中', completed: '已完成', follow_up: '随访中' };

async function fetchData() {
  customer.value = await request.get(`/customers/${route.params.id}`);
}

onMounted(fetchData);
</script>

<style scoped>
.pref-item {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.pref-category {
  color: #909399;
  margin-right: 8px;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-title {
  font-weight: 500;
}
</style>
