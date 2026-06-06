<template>
  <div class="funnel-container">
    <h3>客户生命周期漏斗</h3>
    <div class="funnel-chart">
      <div
        v-for="(stage, index) in funnelData"
        :key="stage.stage"
        class="funnel-stage"
        :style="{
          width: getBarWidth(stage.count) + '%',
          backgroundColor: colors[index],
          opacity: 1 - index * 0.1,
        }"
      >
        <div class="stage-content">
          <span class="stage-name">{{ stage.stage }}</span>
          <span class="stage-count">{{ stage.count }}</span>
          <span class="stage-rate" v-if="index > 0">{{ stage.rate }}%</span>
        </div>
      </div>
    </div>

    <!-- 转化率标注 -->
    <div class="funnel-rates">
      <div v-for="(stage, index) in funnelData" :key="'rate-' + index" class="rate-item">
        <template v-if="index > 0">
          <span class="rate-arrow">→</span>
          <span class="rate-value">{{ stage.rate }}%</span>
        </template>
      </div>
    </div>

    <!-- 汇总信息 -->
    <div class="funnel-summary" v-if="summary">
      <div class="summary-item">
        <span class="summary-label">本月新增</span>
        <span class="summary-value">{{ summary.newThisMonth }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">总潜客</span>
        <span class="summary-value">{{ summary.totalLeads }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">面诊率</span>
        <span class="summary-value">{{ summary.totalLeads > 0 ? Math.round((summary.consulted / summary.totalLeads) * 100) : 0 }}%</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">复购率</span>
        <span class="summary-value">{{ summary.postOp > 0 ? Math.round((summary.repeat / summary.postOp) * 100) : 0 }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import request from '@/api/request';

const funnelData = ref<any[]>([]);
const summary = ref<any>(null);
const loading = ref(false);

const colors = [
  '#409eff',
  '#67c23a',
  '#e6a23c',
  '#f56c6c',
  '#909399',
  '#9b59b6',
];

const maxCount = ref(0);

function getBarWidth(count: number): number {
  if (maxCount.value === 0) return 100;
  return Math.max(30, (count / maxCount.value) * 100);
}

async function fetchFunnel() {
  loading.value = true;
  try {
    const res: any = await request.get('/admin/dashboard/funnel');
    if (res) {
      funnelData.value = res.funnel || [];
      summary.value = res.summary || null;
      maxCount.value = Math.max(...funnelData.value.map(s => s.count), 1);
    }
  } catch {
    funnelData.value = [];
    summary.value = null;
  }
  loading.value = false;
}

onMounted(fetchFunnel);
</script>

<style scoped>
.funnel-container {
  padding: 20px;
}

.funnel-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin: 24px 0;
}

.funnel-stage {
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  min-width: 200px;
}

.funnel-stage:hover {
  transform: scaleX(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stage-content {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #fff;
  font-weight: 500;
}

.stage-name {
  font-size: 14px;
  min-width: 48px;
}

.stage-count {
  font-size: 20px;
  font-weight: 700;
}

.stage-rate {
  font-size: 12px;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
}

.funnel-rates {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.rate-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rate-arrow {
  color: #909399;
}

.rate-value {
  color: #67c23a;
  font-weight: 600;
  font-size: 14px;
}

.funnel-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

@media (max-width: 768px) {
  .funnel-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
