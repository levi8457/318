<template>
  <div class="page-container">
    <div v-if="loading" style="text-align:center; padding:60px">
      <el-icon class="is-loading" style="font-size:40px"><Loading /></el-icon>
      <p style="margin-top:16px; color:#909399">加载中...</p>
    </div>

    <div v-else-if="error" style="padding:60px; text-align:center">
      <p style="color:#f56c6c">{{ error }}</p>
      <el-button type="primary" style="margin-top:16px" @click="fetchData">重试</el-button>
    </div>

    <template v-else-if="session">
      <div class="page-header">
        <el-button @click="$router.back()">返回</el-button>
        <h2 class="page-title" style="display:inline; margin-left:12px">会话详情</h2>
        <el-tag style="margin-left:12px" :type="statusType[session.status] || 'info'">
          {{ statusMap[session.status] || session.status }}
        </el-tag>
      </div>

      <!-- 基本信息 -->
      <div class="card-grid">
        <div class="stat-card">
          <div class="stat-label">客户</div>
          <div class="stat-value" style="font-size:16px">{{ session.customer?.name || '-' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">咨询师</div>
          <div class="stat-value" style="font-size:16px">{{ session.consultant?.realName || '-' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">时长</div>
          <div class="stat-value" style="font-size:16px">{{ session.duration ? `${session.duration}s` : '-' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">创建时间</div>
          <div class="stat-value" style="font-size:16px">{{ new Date(session.createdAt).toLocaleString() }}</div>
        </div>
      </div>

      <!-- 转写文本 -->
      <div class="table-card" v-if="session.transcript">
        <h3>转写文本</h3>
        <div class="transcript-box">{{ session.transcript }}</div>
      </div>

      <!-- AI 分析结果 -->
      <div class="table-card" v-if="session.summary">
        <h3>AI 面诊总结</h3>
        <p style="margin-top:8px; line-height:1.8; color:#606266">{{ session.summary }}</p>
      </div>

      <!-- 核心诉求 -->
      <div class="table-card" v-if="session.keyPoints?.length">
        <h3>核心诉求</h3>
        <el-table :data="session.keyPoints" style="margin-top:8px">
          <el-table-column prop="topic" label="主题" width="120" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="intent" label="意向" width="80">
            <template #default="{ row }">
              <el-tag :type="row.intent === 'high' ? 'danger' : row.intent === 'medium' ? 'warning' : 'info'">
                {{ intentMap[row.intent] || row.intent }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 客户卡点 -->
      <div class="table-card" v-if="session.blockers?.length">
        <h3>客户卡点</h3>
        <div v-for="b in session.blockers" :key="b.type" class="blocker-item">
          <div class="blocker-header">
            <el-tag size="small" :type="blockerType[b.type] || 'info'">
              {{ blockerMap[b.type] || b.type }}
            </el-tag>
            <span>{{ b.detail }}</span>
          </div>
          <p class="blocker-response">{{ b.suggestedResponse }}</p>
        </div>
      </div>

      <!-- AI 跟进策略 -->
      <div class="table-card" v-if="session.followUpStrategy?.summary">
        <h3>AI 跟进策略</h3>
        <div class="strategy-box">
          <p class="strategy-summary">{{ session.followUpStrategy.summary }}</p>

          <div v-if="session.followUpStrategy.talkingPoints?.length" style="margin-top:16px">
            <h4>推荐跟进话术</h4>
            <div v-for="(tp, i) in session.followUpStrategy.talkingPoints" :key="i" class="talking-point">
              <p>{{ tp }}</p>
            </div>
          </div>

          <div v-if="session.followUpStrategy.bestFollowUpTime" style="margin-top:12px">
            <strong>最佳跟进时间：</strong>{{ session.followUpStrategy.bestFollowUpTime }}
          </div>
        </div>
      </div>
    </template>

    <div v-else style="padding:60px; text-align:center">
      <p style="color:#909399">会话不存在或已被删除</p>
      <el-button type="primary" style="margin-top:16px" @click="$router.back()">返回列表</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Loading } from '@element-plus/icons-vue';
import request from '@/api/request';

const route = useRoute();
const session = ref<any>(null);
const loading = ref(true);
const error = ref('');

const statusMap: Record<string, string> = {
  pending: '待处理',
  transcribing: '转写中',
  completed: '已完成',
  failed: '失败',
};

const statusType: Record<string, string> = {
  pending: 'info',
  transcribing: 'warning',
  completed: 'success',
  failed: 'danger',
};

const intentMap: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
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

async function fetchData() {
  loading.value = true;
  error.value = '';
  try {
    session.value = await request.get(`/sessions/${route.params.id}`);
  } catch (e: any) {
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>

<style scoped>
.transcript-box {
  margin-top: 8px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
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

.strategy-box {
  background: #f0f9eb;
  border-radius: 8px;
  padding: 16px;
  margin-top: 8px;
}

.strategy-summary {
  font-weight: 600;
  line-height: 1.8;
}

.talking-point {
  padding: 8px 0;
  border-bottom: 1px dashed #ddd;
}

.talking-point p {
  margin: 0;
}
</style>
