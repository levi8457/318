<template>
  <div class="page-container">
    <!-- 当前订阅状态横幅 -->
    <div class="subscription-banner" :class="currentPlan">
      <div class="banner-left">
        <div class="plan-badge-lg">
          <span v-if="license?.isTrial" class="trial-badge">试用</span>
          {{ planNames[license?.plan] || '加载中...' }}
        </div>
        <div class="banner-info">
          <template v-if="license?.isTrial">
            <p>专业版试用中，剩余 <strong>{{ trialDaysLeft }}</strong> 天</p>
            <el-progress :percentage="trialProgress" :stroke-width="6" :color="'#fff'" style="width:200px;margin-top:8px" />
          </template>
          <template v-else-if="license?.status === 'active'">
            <p>{{ license?.billingCycle === 'yearly' ? '年付' : '月付' }} · 到期时间：{{ formatDate(license?.subscriptionEndsAt) }}</p>
            <p style="opacity:0.8;font-size:13px">咨询师上限：{{ license?.maxConsultants === 999 ? '不限' : license?.maxConsultants + ' 人' }}</p>
          </template>
          <template v-else>
            <p>订阅已{{ license?.status === 'expired' ? '过期' : '暂停' }}，请续费或升级</p>
          </template>
        </div>
      </div>
      <div class="banner-right">
        <div class="amount-display" v-if="license && !license.isTrial">
          <span class="amount">¥{{ currentMonthlyPrice }}</span>
          <span class="unit">/月</span>
        </div>
      </div>
    </div>

    <!-- 计费周期切换 -->
    <div class="billing-toggle">
      <span :class="{ active: billingCycle === 'monthly' }" @click="billingCycle = 'monthly'">月付</span>
      <span :class="{ active: billingCycle === 'yearly' }" @click="billingCycle = 'yearly'">
        年付
        <el-tag size="small" type="success" effect="dark" style="margin-left:4px">省20%</el-tag>
      </span>
    </div>

    <!-- 套餐卡片 -->
    <div class="plans-row">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="plan-card"
        :class="{
          active: license?.plan === plan.id,
          recommended: plan.id === 'professional',
          selected: selectedPlan === plan.id
        }"
        @click="selectedPlan = plan.id"
      >
        <div v-if="plan.id === 'professional'" class="recommended-tag">推荐</div>
        <div class="plan-name">{{ plan.name }}</div>
        <div class="plan-desc">{{ plan.desc }}</div>
        <div class="plan-price-row">
          <span class="currency">¥</span>
          <span class="price">{{ billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice }}</span>
          <span class="period">/{{ billingCycle === 'yearly' ? '年' : '月' }}</span>
        </div>
        <div class="plan-price-monthly" v-if="billingCycle === 'yearly'">
          约 ¥{{ Math.round(plan.yearlyPrice / 12) }}/月
        </div>
        <div class="plan-discount" v-if="billingCycle === 'yearly'">
          原价 ¥{{ plan.monthlyPrice * 12 }}/年，省 ¥{{ plan.monthlyPrice * 12 - plan.yearlyPrice }}
        </div>
        <div class="plan-limit">咨询师上限：{{ plan.maxConsultants === 999 ? '不限' : plan.maxConsultants + ' 人' }}</div>
        <div class="plan-features">
          <div v-for="f in plan.featureList" :key="f.key" class="feature-row">
            <span class="feature-icon" :class="f.enabled ? 'yes' : 'no'">{{ f.enabled ? '✓' : '✗' }}</span>
            <span :class="{ 'feature-disabled': !f.enabled }">{{ f.name }}</span>
          </div>
        </div>
        <div class="plan-action">
          <el-button
            v-if="license?.plan === plan.id && license?.status === 'active'"
            type="info"
            disabled
            style="width:100%"
          >
            当前版本
          </el-button>
          <el-button
            v-else-if="license?.plan === plan.id && license?.isTrial"
            type="primary"
            style="width:100%"
            @click.stop="openPayment(plan)"
          >
            立即续费
          </el-button>
          <el-button
            v-else-if="getPlanIndex(plan.id) > getPlanIndex(license?.plan || 'basic')"
            type="primary"
            style="width:100%"
            @click.stop="openPayment(plan)"
          >
            升级到{{ plan.name }}
          </el-button>
          <el-button
            v-else
            type="warning"
            style="width:100%"
            @click.stop="openPayment(plan)"
          >
            切换到{{ plan.name }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 功能对比表 -->
    <div class="table-card" style="margin-top:24px">
      <h3 style="margin-bottom:16px">功能对比详情</h3>
      <el-table :data="featureComparison" stripe border style="width:100%">
        <el-table-column prop="name" label="功能模块" min-width="180" fixed />
        <el-table-column label="基础版" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.basic" type="success" size="small">支持</el-tag>
            <el-tag v-else type="info" size="small">不支持</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="专业版" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.professional" type="success" size="small">支持</el-tag>
            <el-tag v-else type="info" size="small">不支持</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="旗舰版" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.enterprise" type="success" size="small">支持</el-tag>
            <el-tag v-else type="info" size="small">不支持</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 账单历史 -->
    <div class="table-card" style="margin-top:24px">
      <h3 style="margin-bottom:16px">账单记录</h3>
      <el-table :data="paymentHistory" stripe v-loading="loadingHistory">
        <el-table-column prop="planType" label="套餐" width="100">
          <template #default="{ row }">{{ planNames[row.planType] || row.planType }}</template>
        </el-table-column>
        <el-table-column prop="billingCycle" label="计费" width="80">
          <template #default="{ row }">{{ row.billingCycle === 'yearly' ? '年付' : '月付' }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="100">
          <template #default="{ row }">{{ paymentMethodNames[row.paymentMethod] || row.paymentMethod }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="orderStatusType[row.status]">{{ orderStatusNames[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="paidAt" label="支付时间" width="170">
          <template #default="{ row }">{{ row.paidAt ? formatDateTime(row.paidAt) : '-' }}</template>
        </el-table-column>
      </el-table>
      <div v-if="paymentHistory.length === 0 && !loadingHistory" style="text-align:center;padding:24px;color:#909399">
        暂无账单记录
      </div>
    </div>

    <!-- 支付弹窗 -->
    <el-dialog
      v-model="showPaymentDialog"
      title="确认支付"
      width="500px"
      :close-on-click-modal="false"
      @close="cancelCurrentOrder"
    >
      <div v-if="pendingOrder" class="payment-content">
        <div class="payment-summary">
          <div class="summary-row">
            <span>套餐</span>
            <span>{{ planNames[pendingOrder.planType] }}</span>
          </div>
          <div class="summary-row">
            <span>计费周期</span>
            <span>{{ pendingOrder.billingCycle === 'yearly' ? '年付' : '月付' }}</span>
          </div>
          <div class="summary-row" v-if="pendingOrder.billingCycle === 'yearly'">
            <span>原价</span>
            <span style="text-decoration:line-through;color:#909399">¥{{ pendingOrder.originalAmount }}</span>
          </div>
          <div class="summary-row" v-if="pendingOrder.billingCycle === 'yearly'">
            <span>年付8折优惠</span>
            <span style="color:#67c23a">-¥{{ (pendingOrder.originalAmount - pendingOrder.amount).toFixed(0) }}</span>
          </div>
          <div class="summary-row total">
            <span>应付金额</span>
            <span class="total-amount">¥{{ pendingOrder.amount }}</span>
          </div>
        </div>

        <!-- 支付方式选择 -->
        <div class="payment-methods">
          <div class="method-title">选择支付方式</div>
          <div
            v-for="method in paymentMethods"
            :key="method.id"
            class="method-card"
            :class="{ active: selectedPaymentMethod === method.id }"
            @click="selectedPaymentMethod = method.id"
          >
            <span class="method-icon">{{ method.icon }}</span>
            <span>{{ method.name }}</span>
          </div>
        </div>

        <!-- 支付二维码区域 -->
        <div class="qr-section" v-if="selectedPaymentMethod === 'alipay'">
          <div class="qr-tip">请使用支付宝扫描下方二维码完成支付</div>
          <div class="qr-code">
            <div class="qr-placeholder">
              <div class="qr-inner">
                <div class="qr-logo">支付宝</div>
                <div class="qr-amount">¥{{ pendingOrder.amount }}</div>
              </div>
            </div>
          </div>
          <div class="qr-account">收款账号：279139326@qq.com</div>
          <div class="qr-expire">
            支付剩余时间：
            <span class="countdown" :class="{ urgent: remainSeconds < 300 }">{{ formatCountdown }}</span>
          </div>
        </div>

        <div class="qr-section" v-else-if="selectedPaymentMethod === 'bank_transfer'">
          <div class="bank-info">
            <p><strong>银行转账信息</strong></p>
            <p>收款人：铜雀台医美科技有限公司</p>
            <p>开户行：中国工商银行重庆分行</p>
            <p>账号：279139326@qq.com</p>
            <p style="color:#e6a23c;margin-top:8px">* 转账后请联系客服确认到账</p>
          </div>
        </div>

        <div class="payment-tips">
          <p>1. 支付完成后，系统将在 1-5 分钟内自动开通服务</p>
          <p>2. 如遇支付问题，请联系客服：service@tongquetai.com</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="cancelCurrentOrder">取消支付</el-button>
        <el-button type="primary" @click="confirmPaymentManual" :loading="confirming">
          我已完成支付
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/api/request';
import { formatDate, formatDateTime } from '@/utils/date';

const license = ref<any>(null);
const billingCycle = ref<'monthly' | 'yearly'>('monthly');
const selectedPlan = ref('');
const showPaymentDialog = ref(false);
const pendingOrder = ref<any>(null);
const selectedPaymentMethod = ref('alipay');
const confirming = ref(false);
const loadingHistory = ref(false);
const paymentHistory = ref<any[]>([]);
const remainSeconds = ref(1800);
let countdownTimer: any = null;

const planNames: Record<string, string> = { basic: '基础版', professional: '专业版', enterprise: '旗舰版' };
const paymentMethodNames: Record<string, string> = { alipay: '支付宝', wechat: '微信支付', bank_transfer: '银行转账' };
const orderStatusNames: Record<string, string> = { pending: '待支付', paid: '已支付', cancelled: '已取消', expired: '已过期' };
const orderStatusType: Record<string, string> = { pending: 'warning', paid: 'success', cancelled: 'info', expired: 'danger' };

const plans = [
  {
    id: 'basic', name: '基础版', desc: '适合小型机构起步',
    monthlyPrice: 2980, yearlyPrice: 28608, maxConsultants: 3,
    featureList: [
      { key: 'customerManagement', name: '客户管理（CRUD+标签+备忘录）', enabled: true },
      { key: 'taskReminder', name: '任务提醒（SOP自动生成）', enabled: true },
      { key: 'basicReports', name: '基础报表（客户数/任务完成率）', enabled: true },
      { key: 'sessionTranscription', name: '会话录音转写', enabled: false },
      { key: 'aiAnalysis', name: 'AI 面诊分析', enabled: false },
      { key: 'aiStrategy', name: 'AI 跟进策略生成', enabled: false },
      { key: 'scriptLibrary', name: '话术库', enabled: false },
      { key: 'strategyTemplates', name: '策略模板管理', enabled: false },
      { key: 'precisionMarketing', name: '精准营销', enabled: false },
      { key: 'advancedReports', name: '高级报表（转化漏斗/ROI）', enabled: false },
      { key: 'apiIntegration', name: 'API 对接（HIS/CRM）', enabled: false },
    ],
  },
  {
    id: 'professional', name: '专业版', desc: 'AI 赋能，效率倍增',
    monthlyPrice: 5980, yearlyPrice: 57408, maxConsultants: 10,
    featureList: [
      { key: 'customerManagement', name: '客户管理（CRUD+标签+备忘录）', enabled: true },
      { key: 'taskReminder', name: '任务提醒（SOP自动生成）', enabled: true },
      { key: 'basicReports', name: '基础报表（客户数/任务完成率）', enabled: true },
      { key: 'sessionTranscription', name: '会话录音转写', enabled: true },
      { key: 'aiAnalysis', name: 'AI 面诊分析', enabled: true },
      { key: 'aiStrategy', name: 'AI 跟进策略生成', enabled: true },
      { key: 'scriptLibrary', name: '话术库', enabled: true },
      { key: 'strategyTemplates', name: '策略模板管理', enabled: true },
      { key: 'precisionMarketing', name: '精准营销', enabled: false },
      { key: 'advancedReports', name: '高级报表（转化漏斗/ROI）', enabled: false },
      { key: 'apiIntegration', name: 'API 对接（HIS/CRM）', enabled: false },
    ],
  },
  {
    id: 'enterprise', name: '旗舰版', desc: '全功能，无限可能',
    monthlyPrice: 9980, yearlyPrice: 95808, maxConsultants: 999,
    featureList: [
      { key: 'customerManagement', name: '客户管理（CRUD+标签+备忘录）', enabled: true },
      { key: 'taskReminder', name: '任务提醒（SOP自动生成）', enabled: true },
      { key: 'basicReports', name: '基础报表（客户数/任务完成率）', enabled: true },
      { key: 'sessionTranscription', name: '会话录音转写', enabled: true },
      { key: 'aiAnalysis', name: 'AI 面诊分析', enabled: true },
      { key: 'aiStrategy', name: 'AI 跟进策略生成', enabled: true },
      { key: 'scriptLibrary', name: '话术库', enabled: true },
      { key: 'strategyTemplates', name: '策略模板管理', enabled: true },
      { key: 'precisionMarketing', name: '精准营销', enabled: true },
      { key: 'advancedReports', name: '高级报表（转化漏斗/ROI）', enabled: true },
      { key: 'apiIntegration', name: 'API 对接（HIS/CRM）', enabled: true },
    ],
  },
];

const featureComparison = [
  { name: '客户管理（CRUD+标签+备忘录）', basic: true, professional: true, enterprise: true },
  { name: '任务提醒（SOP自动生成）', basic: true, professional: true, enterprise: true },
  { name: '基础报表（客户数/任务完成率）', basic: true, professional: true, enterprise: true },
  { name: '会话录音转写', basic: false, professional: true, enterprise: true },
  { name: 'AI 面诊分析', basic: false, professional: true, enterprise: true },
  { name: 'AI 跟进策略生成', basic: false, professional: true, enterprise: true },
  { name: '话术库', basic: false, professional: true, enterprise: true },
  { name: '策略模板管理', basic: false, professional: true, enterprise: true },
  { name: '精准营销', basic: false, professional: false, enterprise: true },
  { name: '高级报表（转化漏斗/ROI）', basic: false, professional: false, enterprise: true },
  { name: 'API 对接（HIS/CRM）', basic: false, professional: false, enterprise: true },
];

const paymentMethods = [
  { id: 'alipay', name: '支付宝', icon: '💙' },
  { id: 'bank_transfer', name: '银行转账', icon: '🏦' },
];

const currentPlan = computed(() => license.value?.plan || 'basic');
const currentMonthlyPrice = computed(() => {
  if (!license.value) return 0;
  const plan = plans.find(p => p.id === license.value.plan);
  return plan ? plan.monthlyPrice : 0;
});

const trialDaysLeft = computed(() => {
  if (!license.value?.trialEndsAt) return 0;
  const ends = new Date(license.value.trialEndsAt);
  const now = new Date();
  const diff = Math.ceil((ends.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
});

const trialProgress = computed(() => {
  return Math.max(0, Math.min(100, (trialDaysLeft.value / 14) * 100));
});

const formatCountdown = computed(() => {
  const m = Math.floor(remainSeconds.value / 60);
  const s = remainSeconds.value % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

function getPlanIndex(planId: string): number {
  const order = ['basic', 'professional', 'enterprise'];
  return order.indexOf(planId);
}

async function fetchLicense() {
  const res: any = await request.get('/license');
  if (res) {
    license.value = res;
    selectedPlan.value = res.plan;
  }
}

async function fetchPaymentHistory() {
  loadingHistory.value = true;
  try {
    const res: any = await request.get('/payment/history');
    paymentHistory.value = Array.isArray(res) ? res : [];
  } catch {
    paymentHistory.value = [];
  }
  loadingHistory.value = false;
}

async function openPayment(plan: any) {
  if (plan.id === license.value?.plan && license.value?.status === 'active' && !license.value?.isTrial) {
    ElMessage.info('您当前已是该版本');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要${getPlanIndex(plan.id) > getPlanIndex(license.value?.plan || 'basic') ? '升级' : '切换'}到${plan.name}吗？`,
      '确认订单',
      { confirmButtonText: '去支付', cancelButtonText: '再想想' },
    );
  } catch {
    return;
  }

  try {
    const res: any = await request.post('/payment/create', {
      planType: plan.id,
      billingCycle: billingCycle.value,
      paymentMethod: selectedPaymentMethod.value,
    });

    if (res) {
      pendingOrder.value = res;
      showPaymentDialog.value = true;
      remainSeconds.value = 1800;
      startCountdown();
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '创建订单失败');
  }
}

function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    if (remainSeconds.value > 0) {
      remainSeconds.value--;
    } else {
      clearInterval(countdownTimer);
      ElMessage.warning('支付超时，订单已自动取消');
      showPaymentDialog.value = false;
      pendingOrder.value = null;
    }
  }, 1000);
}

async function cancelCurrentOrder() {
  if (pendingOrder.value?.id) {
    try {
      await request.post(`/payment/${pendingOrder.value.id}/cancel`);
    } catch {}
  }
  showPaymentDialog.value = false;
  pendingOrder.value = null;
  if (countdownTimer) clearInterval(countdownTimer);
}

async function confirmPaymentManual() {
  if (!pendingOrder.value?.id) return;
  confirming.value = true;
  try {
    const res: any = await request.post(`/payment/${pendingOrder.value.id}/confirm`);
    if (res) {
      ElMessage.success('支付确认成功！订阅已更新');
      showPaymentDialog.value = false;
      pendingOrder.value = null;
      if (countdownTimer) clearInterval(countdownTimer);
      fetchLicense();
      fetchPaymentHistory();
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '确认失败，请联系客服');
  }
  confirming.value = false;
}

onMounted(() => {
  fetchLicense();
  fetchPaymentHistory();
});

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
});
</script>

<style scoped>
.subscription-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 32px;
  border-radius: 16px;
  color: #fff;
  margin-bottom: 24px;
}
.subscription-banner.basic { background: linear-gradient(135deg, #909399, #606266); }
.subscription-banner.professional { background: linear-gradient(135deg, #409eff, #337ecc); }
.subscription-banner.enterprise { background: linear-gradient(135deg, #e6a23c, #cf9236); }

.banner-left { display: flex; align-items: center; gap: 20px; }
.plan-badge-lg { font-size: 24px; font-weight: 700; }
.trial-badge { background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 6px; }
.banner-info p { margin: 2px 0; font-size: 14px; opacity: 0.9; }
.banner-right { text-align: right; }
.amount-display .amount { font-size: 36px; font-weight: 700; }
.amount-display .unit { font-size: 14px; opacity: 0.8; }

.billing-toggle {
  display: flex; justify-content: center; gap: 4px;
  margin-bottom: 24px; background: #f5f7fa; border-radius: 8px; padding: 4px;
  width: fit-content; margin-left: auto; margin-right: auto;
}
.billing-toggle span {
  padding: 8px 24px; border-radius: 6px; cursor: pointer; font-size: 14px;
  transition: all 0.2s; display: flex; align-items: center;
}
.billing-toggle span.active { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); color: #409eff; font-weight: 600; }

.plans-row {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
}

.plan-card {
  border: 2px solid #e4e7ed; border-radius: 16px; padding: 28px 24px;
  position: relative; cursor: pointer; transition: all 0.3s; background: #fff;
}
.plan-card:hover { border-color: #409eff; transform: translateY(-4px); box-shadow: 0 8px 24px rgba(64,158,255,0.15); }
.plan-card.active { border-color: #409eff; background: #f0f7ff; }
.plan-card.recommended { border-color: #409eff; }
.plan-card.selected { box-shadow: 0 0 0 2px #409eff; }

.recommended-tag {
  position: absolute; top: -1px; right: 20px;
  background: #409eff; color: #fff; padding: 4px 12px;
  border-radius: 0 0 8px 8px; font-size: 12px; font-weight: 600;
}

.plan-name { font-size: 22px; font-weight: 700; margin-bottom: 4px; color: #303133; }
.plan-desc { font-size: 13px; color: #909399; margin-bottom: 16px; }

.plan-price-row { margin-bottom: 4px; }
.plan-price-row .currency { font-size: 18px; font-weight: 600; color: #303133; }
.plan-price-row .price { font-size: 40px; font-weight: 700; color: #303133; line-height: 1; }
.plan-price-row .period { font-size: 14px; color: #909399; }

.plan-price-monthly { font-size: 13px; color: #909399; margin-bottom: 4px; }
.plan-discount { font-size: 12px; color: #67c23a; margin-bottom: 8px; }
.plan-limit { font-size: 13px; color: #606266; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #eee; }

.plan-features { margin-bottom: 20px; }
.feature-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px; }
.feature-icon.yes { color: #67c23a; font-weight: 700; }
.feature-icon.no { color: #dcdfe6; }
.feature-disabled { color: #c0c4cc; }

.plan-action { margin-top: auto; }

.payment-content { padding: 0 8px; }
.payment-summary { background: #f5f7fa; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
.summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
.summary-row.total { border-top: 1px solid #dcdfe6; margin-top: 8px; padding-top: 12px; font-weight: 600; }
.total-amount { font-size: 20px; color: #f56c6c; }

.payment-methods { margin-bottom: 20px; }
.method-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.method-card {
  display: flex; align-items: center; gap: 8px; padding: 12px 16px;
  border: 2px solid #e4e7ed; border-radius: 8px; cursor: pointer; margin-bottom: 8px;
  transition: all 0.2s;
}
.method-card:hover { border-color: #409eff; }
.method-card.active { border-color: #409eff; background: #ecf5ff; }
.method-icon { font-size: 20px; }

.qr-section { text-align: center; margin: 20px 0; }
.qr-tip { font-size: 14px; color: #606266; margin-bottom: 16px; }
.qr-code { display: flex; justify-content: center; margin-bottom: 12px; }
.qr-placeholder {
  width: 200px; height: 200px; border: 2px solid #e4e7ed; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; background: #fafafa;
}
.qr-inner { text-align: center; }
.qr-logo { font-size: 24px; font-weight: 700; color: #1677ff; margin-bottom: 8px; }
.qr-amount { font-size: 20px; font-weight: 600; color: #f56c6c; }
.qr-account { font-size: 13px; color: #909399; margin-bottom: 8px; }
.qr-expire { font-size: 13px; color: #606266; }
.countdown { font-weight: 600; color: #409eff; font-size: 16px; }
.countdown.urgent { color: #f56c6c; }

.bank-info { background: #f5f7fa; border-radius: 8px; padding: 16px; text-align: left; font-size: 14px; line-height: 2; }

.payment-tips { margin-top: 16px; font-size: 12px; color: #909399; line-height: 1.8; }

@media (max-width: 900px) {
  .plans-row { grid-template-columns: 1fr; }
  .subscription-banner { flex-direction: column; gap: 16px; text-align: center; }
  .banner-left { flex-direction: column; }
}
</style>
