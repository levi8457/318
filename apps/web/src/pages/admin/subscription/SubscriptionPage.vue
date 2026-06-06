<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">订阅管理</h2>
    </div>

    <!-- 当前订阅信息 -->
    <div class="table-card">
      <h3>当前订阅</h3>
      <div v-if="license" class="current-plan">
        <div class="plan-badge" :class="license.plan">
          {{ license.planName }}
        </div>
        <div class="plan-info">
          <p v-if="license.isTrial" class="trial-info">
            试用期截止：{{ new Date(license.trialEndsAt).toLocaleDateString() }}
          </p>
          <p v-else class="subscription-info">
            订阅周期：{{ license.billingCycle === 'monthly' ? '月付' : '年付' }}
            <span v-if="license.subscriptionEndsAt">
              | 到期时间：{{ new Date(license.subscriptionEndsAt).toLocaleDateString() }}
            </span>
          </p>
          <p>咨询师上限：{{ license.maxConsultants === 999 ? '不限' : license.maxConsultants + ' 人' }}</p>
          <p>状态：
            <el-tag :type="license.status === 'active' || license.status === 'trial' ? 'success' : 'danger'">
              {{ statusMap[license.status] || license.status }}
            </el-tag>
          </p>
        </div>
      </div>
    </div>

    <!-- 版本对比 -->
    <div class="table-card">
      <h3>版本对比</h3>
      <div class="plans-grid">
        <div
          v-for="plan in allPlans"
          :key="plan.id"
          class="plan-card"
          :class="{ active: license?.plan === plan.id }"
        >
          <div class="plan-header">
            <h4>{{ plan.name }}</h4>
            <div class="plan-price">¥{{ plan.price }}<span>/月</span></div>
          </div>
          <div class="plan-features">
            <div v-for="(enabled, feature) in plan.features" :key="feature" class="feature-item">
              <span v-if="enabled" class="feature-yes">✓</span>
              <span v-else class="feature-no">✗</span>
              <span>{{ featureNames[feature] || feature }}</span>
            </div>
          </div>
          <div class="plan-footer">
            <el-button
              v-if="license?.plan !== plan.id"
              type="primary"
              @click="upgradePlan(plan.id)"
            >
              {{ license?.plan === 'basic' ? '升级' : '切换' }}
            </el-button>
            <el-button v-else disabled>当前版本</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能详情 -->
    <div class="table-card">
      <h3>已启用功能</h3>
      <div v-if="license" class="features-list">
        <el-tag
          v-for="feature in license.enabledFeatures"
          :key="feature"
          type="success"
          style="margin: 4px"
        >
          {{ featureNames[feature] || feature }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/api/request';

const license = ref<any>(null);
const allPlans = ref<any[]>([]);

const statusMap: Record<string, string> = {
  active: '已激活',
  expired: '已过期',
  suspended: '已暂停',
  trial: '试用中',
};

const featureNames: Record<string, string> = {
  customerManagement: '客户管理',
  taskReminder: '任务提醒',
  basicReports: '基础报表',
  sessionTranscription: '会话录音转写',
  aiAnalysis: 'AI 面诊分析',
  aiStrategy: 'AI 跟进策略',
  scriptLibrary: '话术库',
  strategyTemplates: '策略模板管理',
  precisionMarketing: '精准营销',
  advancedReports: '高级报表',
  apiIntegration: 'API 对接',
  multiOrganization: '多机构管理',
};

async function fetchLicense() {
  const res: any = await request.get('/license');
  if (res) {
    license.value = res;
    allPlans.value = res.allPlans || [];
  }
}

async function upgradePlan(planId: string) {
  await ElMessageBox.confirm(
    `确定要切换到${featureNames[planId] || planId}吗？`,
    '确认切换',
  );

  const res: any = await request.post('/license/upgrade', {
    plan: planId,
    billingCycle: 'monthly',
  });

  if (res) {
    ElMessage.success('版本切换成功');
    fetchLicense();
  }
}

onMounted(fetchLicense);
</script>

<style scoped>
.current-plan {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 16px;
}

.plan-badge {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.plan-badge.basic {
  background: #909399;
}

.plan-badge.professional {
  background: #409eff;
}

.plan-badge.enterprise {
  background: #e6a23c;
}

.plan-info p {
  margin: 4px 0;
  color: #606266;
}

.trial-info {
  color: #e6a23c !important;
  font-weight: 600;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 16px;
}

.plan-card {
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s;
}

.plan-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.plan-header {
  text-align: center;
  margin-bottom: 20px;
}

.plan-header h4 {
  font-size: 20px;
  margin-bottom: 8px;
}

.plan-price {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
}

.plan-price span {
  font-size: 14px;
  font-weight: normal;
  color: #909399;
}

.plan-features {
  margin-bottom: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 14px;
}

.feature-yes {
  color: #67c23a;
  font-weight: 600;
}

.feature-no {
  color: #f56c6c;
}

.plan-footer {
  text-align: center;
}

.features-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
</style>
