<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">管理员仪表盘</h2>
    </div>

    <!-- 核心业务指标 -->
    <div class="card-grid">
      <div class="stat-card" v-for="card in metricCards" :key="card.label">
        <div class="stat-label">{{ card.label }}</div>
        <div class="stat-value">{{ card.value }}</div>
      </div>
    </div>

    <!-- 待处理事项 -->
    <div class="table-card" v-if="alerts.overdueTasks > 0 || alerts.pendingScripts > 0 || alerts.pendingCampaigns > 0">
      <h3>待处理事项</h3>
      <div style="display:flex; gap:16px; margin-top:12px; flex-wrap:wrap">
        <el-tag v-if="alerts.overdueTasks > 0" type="danger" size="large">
          {{ alerts.overdueTasks }} 个逾期任务
        </el-tag>
        <el-tag v-if="alerts.pendingScripts > 0" type="warning" size="large">
          {{ alerts.pendingScripts }} 条待审核话术
        </el-tag>
        <el-tag v-if="alerts.pendingCampaigns > 0" type="info" size="large">
          {{ alerts.pendingCampaigns }} 个待处理活动
        </el-tag>
        <el-tag v-if="alerts.inactiveConsultants > 0" type="info" size="large">
          {{ alerts.inactiveConsultants }} 个停用咨询师
        </el-tag>
      </div>
    </div>

    <!-- 客户生命周期漏斗 -->
    <div class="table-card">
      <CustomerFunnel />
    </div>

    <!-- 咨询师业绩排行 -->
    <div class="table-card">
      <h3>咨询师业绩排行</h3>
      <el-table :data="ranking" stripe style="margin-top: 16px">
        <el-table-column prop="consultantName" label="姓名" width="100" />
        <el-table-column prop="totalCustomers" label="客户数" width="80" />
        <el-table-column prop="newCustomersThisMonth" label="本月新增" width="80" />
        <el-table-column prop="sessionsThisMonth" label="本月面诊" width="80" />
        <el-table-column prop="taskCompletionRate" label="任务完成率" width="100">
          <template #default="{ row }">{{ (row.taskCompletionRate * 100).toFixed(0) }}%</template>
        </el-table-column>
        <el-table-column prop="conversionRate" label="转化率" width="80">
          <template #default="{ row }">{{ (row.conversionRate * 100).toFixed(0) }}%</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 趋势图表 + 项目分布 -->
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px">
      <div class="table-card">
        <h3>客户增长趋势</h3>
        <div style="height: 200px; display: flex; align-items: flex-end; gap: 8px; margin-top: 16px; padding: 0 20px;">
          <div v-for="(d, i) in trends.customerGrowth" :key="i"
            class="trend-bar"
            :style="{ height: getBarHeight(d.value) + 'px' }">
            <span class="trend-value">{{ d.value }}</span>
            <span class="trend-label">{{ d.date.split('-')[1] }}月</span>
          </div>
        </div>
      </div>
      <div class="table-card">
        <h3>品项分布</h3>
        <div v-if="trends.projectDistribution?.length">
          <div v-for="p in trends.projectDistribution" :key="p.projectType" class="distribution-item">
            <span>{{ p.projectType }}</span>
            <span style="color: #409eff; font-weight: 600;">{{ p.count }}</span>
          </div>
        </div>
        <el-empty v-else description="暂无数据" :image-size="60" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import request from '@/api/request';
import CustomerFunnel from '@/components/CustomerFunnel.vue';

const metricCards = ref<any[]>([]);
const ranking = ref<any[]>([]);
const trends = ref<any>({ customerGrowth: [], projectDistribution: [] });
const alerts = ref<any>({ overdueTasks: 0, pendingScripts: 0, pendingCampaigns: 0, inactiveConsultants: 0 });

function getBarHeight(value: number): number {
  const maxValue = Math.max(...trends.value.customerGrowth.map((d: any) => d.value), 1);
  return (value / maxValue) * 150;
}

onMounted(async () => {
  const [metricsRes, rankingRes, trendsRes, alertsRes] = await Promise.all([
    request.get('/admin/dashboard/metrics'),
    request.get('/admin/dashboard/ranking'),
    request.get('/admin/dashboard/trends'),
    request.get('/admin/dashboard/alerts'),
  ]);
  const m: any = metricsRes;
  metricCards.value = [
    { label: '总客户数', value: m.totalCustomers },
    { label: '本月新增', value: m.newCustomersThisMonth },
    { label: '活跃率', value: (m.activeRate * 100).toFixed(1) + '%' },
    { label: '转化率', value: (m.conversionRate * 100).toFixed(1) + '%' },
    { label: '本月面诊', value: m.sessionsThisMonth },
    { label: '任务完成率', value: (m.taskCompletionRate * 100).toFixed(1) + '%' },
  ];
  ranking.value = (rankingRes as unknown as any[]) || [];
  trends.value = trendsRes as unknown as any;
  alerts.value = alertsRes as unknown as any;
});
</script>

<style scoped>
.trend-bar {
  flex: 1;
  background: #409eff;
  border-radius: 4px 4px 0 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 4px;
  min-height: 20px;
}

.trend-value {
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.trend-label {
  color: #909399;
  font-size: 11px;
  margin-top: 4px;
}

.distribution-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}
</style>
