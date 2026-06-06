<template>
  <div class="page-container">
    <div v-if="loading" style="text-align:center; padding:60px">
      <el-icon class="is-loading" style="font-size:40px"><Loading /></el-icon>
      <p style="margin-top:16px; color:#909399">加载中...</p>
    </div>

    <template v-else-if="plan">
      <div class="page-header">
        <el-button @click="$router.back()">返回</el-button>
        <h2 class="page-title" style="display:inline; margin-left:12px">跟进策略</h2>
        <el-tag style="margin-left:12px" :type="statusType[plan.status] || 'info'">
          {{ statusMap[plan.status] || plan.status }}
        </el-tag>
      </div>

      <!-- 客户信息 -->
      <div class="card-grid">
        <div class="stat-card">
          <div class="stat-label">客户</div>
          <div class="stat-value" style="font-size:16px">{{ plan.customer?.name || '-' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">电话</div>
          <div class="stat-value" style="font-size:16px">{{ plan.customer?.phone || '-' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">创建时间</div>
          <div class="stat-value" style="font-size:14px">{{ new Date(plan.createdAt).toLocaleString() }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">跟进次数</div>
          <div class="stat-value">{{ plan.followUpRecords?.length || 0 }}</div>
        </div>
      </div>

      <!-- AI 分析摘要 -->
      <div class="table-card" v-if="plan.aiSummary">
        <h3>AI 分析摘要</h3>
        <div class="ai-summary">{{ plan.aiSummary }}</div>
      </div>

      <!-- 客户卡点 -->
      <div class="table-card" v-if="plan.blockers?.length">
        <h3>客户卡点</h3>
        <div v-for="(b, i) in plan.blockers" :key="i" class="blocker-item">
          <div class="blocker-header">
            <el-tag size="small" :type="blockerType[b.type] || 'info'">
              {{ blockerMap[b.type] || b.type }}
            </el-tag>
            <span>{{ b.detail }}</span>
          </div>
          <p class="blocker-response">建议应对：{{ b.response }}</p>
        </div>
      </div>

      <!-- 跟进话术（可编辑） -->
      <div class="table-card">
        <div class="section-header">
          <h3>跟进话术</h3>
          <el-button v-if="isEditable" size="small" type="primary" @click="addTalkingPoint">+ 添加话术</el-button>
        </div>
        <div v-for="(tp, i) in talkingPoints" :key="i" class="talking-point-item">
          <div class="tp-content">
            <el-input
              v-if="isEditable"
              v-model="talkingPoints[i]"
              type="textarea"
              :rows="2"
            />
            <p v-else>{{ tp }}</p>
          </div>
          <el-button
            v-if="isEditable"
            type="danger"
            link
            size="small"
            @click="talkingPoints.splice(i, 1)"
          >
            删除
          </el-button>
          <el-button
            v-else
            type="primary"
            link
            size="small"
            @click="copyText(tp)"
          >
            复制
          </el-button>
        </div>
        <el-empty v-if="!talkingPoints.length" description="暂无话术" :image-size="60" />
      </div>

      <!-- 最佳跟进时间 -->
      <div class="table-card">
        <h3>最佳跟进时间</h3>
        <el-input
          v-if="isEditable"
          v-model="bestFollowUpTime"
          placeholder="如：面诊后24小时内，上午10:00-11:00"
          style="margin-top:8px"
        />
        <p v-else style="margin-top:8px; color:#606266">{{ bestFollowUpTime || '-' }}</p>
      </div>

      <!-- 咨询师备注 -->
      <div class="table-card">
        <h3>咨询师备注</h3>
        <el-input
          v-if="isEditable"
          v-model="consultantNotes"
          type="textarea"
          :rows="3"
          placeholder="补充你的判断和调整..."
          style="margin-top:8px"
        />
        <p v-else style="margin-top:8px; color:#606266">{{ consultantNotes || '-' }}</p>
      </div>

      <!-- 操作按钮 -->
      <div class="table-card" v-if="isEditable">
        <div style="display:flex; gap:12px">
          <el-button type="primary" @click="handleSave" :loading="saving">保存修改</el-button>
          <el-button type="success" @click="handleConfirm" :loading="saving" v-if="plan.status === 'draft'">
            确认策略
          </el-button>
        </div>
      </div>

      <!-- 跟进记录 -->
      <div class="table-card">
        <div class="section-header">
          <h3>跟进记录</h3>
          <el-button
            v-if="plan.status === 'confirmed' || plan.status === 'executing'"
            size="small"
            type="primary"
            @click="showFollowUpDialog = true"
          >
            + 记录跟进
          </el-button>
        </div>

        <el-timeline v-if="plan.followUpRecords?.length" style="margin-top:16px">
          <el-timeline-item
            v-for="(record, i) in plan.followUpRecords"
            :key="i"
            :timestamp="new Date(record.contactedAt).toLocaleString()"
            placement="top"
          >
            <div class="record-item">
              <div class="record-header">
                <el-tag size="small">{{ methodMap[record.method] || record.method }}</el-tag>
                <el-tag size="small" :type="resultType[record.result] || 'info'">
                  {{ resultMap[record.result] || record.result }}
                </el-tag>
              </div>
              <p v-if="record.notes" style="margin-top:4px; color:#606266">{{ record.notes }}</p>
              <p v-if="record.nextFollowUpDate" style="margin-top:4px; color:#909399; font-size:12px">
                下次跟进：{{ new Date(record.nextFollowUpDate).toLocaleDateString() }}
              </p>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无跟进记录" :image-size="60" />
      </div>

      <!-- 完成/取消策略 -->
      <div class="table-card" v-if="plan.status === 'executing' || plan.status === 'confirmed'">
        <div style="display:flex; gap:12px">
          <el-button type="success" @click="handleComplete" :loading="completing">标记完成</el-button>
          <el-button type="danger" plain @click="handleCancel" :loading="cancelling">取消策略</el-button>
        </div>
      </div>
    </template>

    <div v-else style="padding:60px; text-align:center">
      <p style="color:#909399">策略不存在</p>
    </div>

    <!-- 记录跟进弹窗 -->
    <el-dialog title="记录跟进" v-model="showFollowUpDialog" width="500px">
      <el-form :model="followUpForm" label-width="80px">
        <el-form-item label="联系方式">
          <el-select v-model="followUpForm.method" style="width:100%">
            <el-option label="微信" value="wechat" />
            <el-option label="电话" value="phone" />
            <el-option label="到院" value="visit" />
            <el-option label="短信" value="sms" />
          </el-select>
        </el-form-item>
        <el-form-item label="结果">
          <el-select v-model="followUpForm.result" style="width:100%">
            <el-option label="已接通/已回复" value="replied" />
            <el-option label="未接通/未回复" value="no_reply" />
            <el-option label="已预约到院" value="booked" />
            <el-option label="已成交" value="converted" />
            <el-option label="暂无意向" value="not_interested" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="followUpForm.notes" type="textarea" :rows="3" placeholder="跟进详情..." />
        </el-form-item>
        <el-form-item label="下次跟进">
          <el-date-picker v-model="followUpForm.nextFollowUpDate" type="date" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFollowUpDialog = false">取消</el-button>
        <el-button type="primary" @click="handleFollowUp" :loading="saving">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import request from '@/api/request';

const route = useRoute();
const plan = ref<any>(null);
const loading = ref(true);
const saving = ref(false);
const completing = ref(false);
const cancelling = ref(false);
const showFollowUpDialog = ref(false);

// 可编辑字段
const talkingPoints = ref<string[]>([]);
const bestFollowUpTime = ref('');
const consultantNotes = ref('');

const followUpForm = ref({
  method: 'wechat',
  result: 'replied',
  notes: '',
  nextFollowUpDate: null as any,
});

const statusMap: Record<string, string> = {
  draft: '草稿',
  confirmed: '已确认',
  executing: '执行中',
  completed: '已完成',
  cancelled: '已取消',
};

const statusType: Record<string, string> = {
  draft: 'warning',
  confirmed: 'primary',
  executing: '',
  completed: 'success',
  cancelled: 'info',
};

const blockerMap: Record<string, string> = {
  price: '价格顾虑',
  pain: '疼痛顾虑',
  trust: '信任顾虑',
  family: '家人反对',
  other: '其他',
};

const blockerType: Record<string, string> = {
  price: 'warning',
  pain: 'danger',
  trust: 'warning',
  family: 'info',
  other: 'info',
};

const methodMap: Record<string, string> = {
  wechat: '微信',
  phone: '电话',
  visit: '到院',
  sms: '短信',
};

const resultMap: Record<string, string> = {
  replied: '已接通',
  no_reply: '未接通',
  booked: '已预约',
  converted: '已成交',
  not_interested: '暂无意向',
};

const resultType: Record<string, string> = {
  replied: 'success',
  no_reply: 'warning',
  booked: 'primary',
  converted: 'success',
  not_interested: 'info',
};

const isEditable = computed(() => {
  return plan.value && (plan.value.status === 'draft' || plan.value.status === 'confirmed');
});

async function fetchData() {
  loading.value = true;
  try {
    plan.value = await request.get(`/follow-up-plans/${route.params.id}`);
    talkingPoints.value = [...(plan.value.talkingPoints || [])];
    bestFollowUpTime.value = plan.value.bestFollowUpTime || '';
    consultantNotes.value = plan.value.consultantNotes || '';
  } catch {
    plan.value = null;
  }
  loading.value = false;
}

function addTalkingPoint() {
  talkingPoints.value.push('');
}

async function handleSave() {
  saving.value = true;
  try {
    await request.put(`/follow-up-plans/${route.params.id}`, {
      talkingPoints: talkingPoints.value.filter(t => t.trim()),
      bestFollowUpTime: bestFollowUpTime.value,
      consultantNotes: consultantNotes.value,
    });
    ElMessage.success('保存成功');
    fetchData();
  } catch {
    ElMessage.error('保存失败');
  }
  saving.value = false;
}

async function handleConfirm() {
  saving.value = true;
  try {
    await request.post(`/follow-up-plans/${route.params.id}/confirm`, {
      talkingPoints: talkingPoints.value.filter(t => t.trim()),
      bestFollowUpTime: bestFollowUpTime.value,
      consultantNotes: consultantNotes.value,
    });
    ElMessage.success('策略已确认');
    fetchData();
  } catch {
    ElMessage.error('确认失败');
  }
  saving.value = false;
}

async function handleFollowUp() {
  saving.value = true;
  try {
    const record: any = {
      method: followUpForm.value.method,
      result: followUpForm.value.result,
      notes: followUpForm.value.notes,
    };
    if (followUpForm.value.nextFollowUpDate) {
      record.nextFollowUpDate = new Date(followUpForm.value.nextFollowUpDate).toISOString();
    }
    await request.post(`/follow-up-plans/${route.params.id}/follow-up`, record);
    ElMessage.success('跟进记录已添加');
    showFollowUpDialog.value = false;
    followUpForm.value = { method: 'wechat', result: 'replied', notes: '', nextFollowUpDate: null };
    fetchData();
  } catch {
    ElMessage.error('添加失败');
  }
  saving.value = false;
}

async function handleComplete() {
  completing.value = true;
  try {
    await request.post(`/follow-up-plans/${route.params.id}/complete`);
    ElMessage.success('策略已完成');
    fetchData();
  } catch {
    ElMessage.error('操作失败');
  }
  completing.value = false;
}

async function handleCancel() {
  cancelling.value = true;
  try {
    await request.post(`/follow-up-plans/${route.params.id}/cancel`);
    ElMessage.success('策略已取消');
    fetchData();
  } catch {
    ElMessage.error('操作失败');
  }
  cancelling.value = false;
}

function copyText(text: string) {
  navigator.clipboard.writeText(text);
  ElMessage.success('已复制');
}

onMounted(fetchData);
</script>

<style scoped>
.ai-summary {
  margin-top: 12px;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  line-height: 1.8;
  color: #1d1d1f;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.blocker-item {
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.blocker-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.blocker-response {
  color: #67c23a;
  font-size: 13px;
  margin-top: 8px;
  padding-left: 8px;
  border-left: 3px solid #67c23a;
}

.talking-point-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.tp-content {
  flex: 1;
}

.record-item {
  padding: 8px 0;
}

.record-header {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
