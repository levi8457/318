<template>
  <div class="page-container">
    <div v-if="loading" style="text-align:center; padding:60px">
      <el-icon class="is-loading" style="font-size:40px"><Loading /></el-icon>
      <p style="margin-top:16px; color:#909399">加载中...</p>
    </div>

    <template v-else-if="plan">
      <div class="page-header">
        <el-button @click="$router.back()">返回</el-button>
        <h2 class="page-title" style="display:inline; margin-left:12px">跟进策略详情</h2>
        <el-tag style="margin-left:12px" :type="statusType[plan.status] || 'info'">
          {{ statusMap[plan.status] || plan.status }}
        </el-tag>
      </div>

      <!-- 客户和咨询师信息 -->
      <div class="card-grid">
        <div class="stat-card">
          <div class="stat-label">客户</div>
          <div class="stat-value" style="font-size:16px">{{ plan.customer?.name || '-' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">咨询师</div>
          <div class="stat-value" style="font-size:16px">{{ plan.consultant?.realName || '-' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">状态</div>
          <el-tag :type="statusType[plan.status] || 'info'">
            {{ statusMap[plan.status] || plan.status }}
          </el-tag>
        </div>
        <div class="stat-card">
          <div class="stat-label">创建时间</div>
          <div class="stat-value" style="font-size:14px">{{ new Date(plan.createdAt).toLocaleString() }}</div>
        </div>
      </div>

      <!-- AI 分析摘要 -->
      <div class="table-card" v-if="plan.aiSummary">
        <h3>AI 分析摘要</h3>
        <div class="ai-summary">{{ plan.aiSummary }}</div>
      </div>

      <!-- 跟进话术 -->
      <div class="table-card">
        <h3>跟进话术</h3>
        <div v-for="(tp, i) in plan.talkingPoints" :key="i" class="talking-point-item">
          <p>{{ tp }}</p>
        </div>
        <el-empty v-if="!plan.talkingPoints?.length" description="暂无话术" :image-size="60" />
      </div>

      <!-- 最佳跟进时间 -->
      <div class="table-card">
        <h3>最佳跟进时间</h3>
        <p style="margin-top:8px; color:#606266">{{ plan.bestFollowUpTime || '-' }}</p>
      </div>

      <!-- 咨询师备注 -->
      <div class="table-card" v-if="plan.consultantNotes">
        <h3>咨询师备注</h3>
        <p style="margin-top:8px; color:#606266">{{ plan.consultantNotes }}</p>
      </div>

      <!-- 跟进记录 -->
      <div class="table-card">
        <h3>跟进记录</h3>
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
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无跟进记录" :image-size="60" />
      </div>
    </template>

    <div v-else style="padding:60px; text-align:center">
      <p style="color:#909399">策略不存在</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Loading } from '@element-plus/icons-vue';
import request from '@/api/request';

const route = useRoute();
const plan = ref<any>(null);
const loading = ref(true);

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

async function fetchData() {
  loading.value = true;
  try {
    plan.value = await request.get(`/follow-up-plans/${route.params.id}`);
  } catch {
    plan.value = null;
  }
  loading.value = false;
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

.talking-point-item {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
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
