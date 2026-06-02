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

      <!-- 音频上传和转写 -->
      <div class="table-card">
        <h3>语音转写</h3>

        <!-- 待上传状态提示 -->
        <div v-if="session.status === 'pending'" class="pending-banner">
          <el-icon><Upload /></el-icon>
          <span>请上传面诊录音音频，系统将自动转写并生成 AI 分析</span>
        </div>

        <!-- 转写中状态提示 -->
        <div v-if="session.status === 'transcribing'" class="transcribing-banner">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>音频正在转写中，请稍候...</span>
          <el-button size="small" @click="fetchData">刷新状态</el-button>
        </div>

        <!-- 上传区域 - pending 或 failed 状态显示 -->
        <div class="upload-area" v-if="session.status === 'pending' || session.status === 'failed'">
          <el-upload
            ref="uploadRef"
            :action="`/api/upload/audio/session/${route.params.id}`"
            :headers="{ Authorization: `Bearer ${token}` }"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :on-progress="handleUploadProgress"
            :before-upload="beforeUpload"
            accept=".mp3,.wav,.m4a,.ogg,.webm,.aac"
          >
            <el-button type="primary" size="large" :loading="uploading">
              <span v-if="!uploading">上传MP3音频</span>
              <span v-else>上传中... {{ uploadProgress }}%</span>
            </el-button>
          </el-upload>
          <p style="margin-top:8px; color:#909399; font-size:13px">
            支持 MP3、WAV、M4A、OGG、WEBM、AAC 格式，最大 50MB
          </p>
        </div>

        <!-- 已上传音频 -->
        <div v-if="session.audioUrl" style="margin-top:16px; padding:12px; background:#f5f7fa; border-radius:8px">
          <p style="margin-bottom:8px"><strong>已上传音频：</strong></p>
          <audio :src="session.audioUrl" controls style="width:100%"></audio>
        </div>

        <!-- 转写文本 -->
        <div v-if="session.transcript" style="margin-top:16px">
          <h4 style="margin-bottom:8px">转写文本</h4>
          <el-input
            type="textarea"
            v-model="transcriptText"
            :rows="6"
            placeholder="转写文本将显示在这里..."
          />
          <div style="margin-top:8px; display:flex; gap:8px">
            <el-button @click="analyzeSession" type="primary" :loading="analyzing">
              AI 分析
            </el-button>
            <el-button @click="updateTranscript" type="warning" :loading="analyzing">
              更新文本并重新分析
            </el-button>
          </div>
        </div>
      </div>

      <!-- AI 分析结果 -->
      <div class="table-card" v-if="session.summary">
        <h3>AI 面诊总结</h3>
        <p style="margin-top:8px; line-height:1.8; color:#606266">{{ session.summary }}</p>
      </div>

      <!-- 客户标签 -->
      <div class="table-card">
        <h3>客户标签</h3>
        <div v-if="customerTags.length" style="margin-top:8px">
          <el-tag v-for="tag in customerTags" :key="tag.id" style="margin:4px" type="info">
            [{{ tag.category }}] {{ tag.value }}
          </el-tag>
        </div>
        <el-empty v-else description="暂无标签" :image-size="60" />
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
            <span class="blocker-detail">{{ b.detail }}</span>
          </div>
          <p class="blocker-response">{{ b.suggestedResponse }}</p>
        </div>
      </div>

      <!-- 决策人 -->
      <div class="table-card" v-if="session.decisionMakers?.length">
        <h3>决策人</h3>
        <div style="margin-top:8px">
          <el-tag v-for="dm in session.decisionMakers" :key="dm" style="margin:4px">{{ dm }}</el-tag>
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
              <el-button size="small" type="primary" @click="copyText(tp)">复制话术</el-button>
            </div>
          </div>

          <div v-if="session.followUpStrategy.bestFollowUpTime" style="margin-top:12px">
            <strong>最佳跟进时间：</strong>{{ session.followUpStrategy.bestFollowUpTime }}
          </div>

          <div v-if="session.followUpStrategy.caseReferences?.length" style="margin-top:12px">
            <strong>参考案例：</strong>
            <el-tag v-for="ref in session.followUpStrategy.caseReferences" :key="ref" size="small" style="margin:4px">
              {{ ref }}
            </el-tag>
          </div>

          <div v-if="session.followUpStrategy.templateName" style="margin-top:12px; color:#909399">
            参考策略模板：{{ session.followUpStrategy.templateName }}
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
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Loading, Upload } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import request from '@/api/request';

const route = useRoute();
const userStore = useAuthStore();
const token = userStore.token || '';

const session = ref<any>(null);
const customerTags = ref<any[]>([]);
const transcriptText = ref('');
const uploading = ref(false);
const uploadProgress = ref(0);
const analyzing = ref(false);
const loading = ref(true);
const error = ref('');
let pollTimer: ReturnType<typeof setInterval> | null = null;

const statusMap: Record<string, string> = {
  pending: '待处理',
  transcribing: '转写中',
  completed: '已完成',
  failed: '转写失败',
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
    transcriptText.value = session.value?.transcript || '';

    if (session.value?.customerId) {
      try {
        const customerDetail: any = await request.get(`/customers/${session.value.customerId}`);
        customerTags.value = customerDetail?.tags || [];
      } catch {
        customerTags.value = [];
      }
    }

    // 如果正在转写，启动轮询
    if (session.value?.status === 'transcribing') {
      startPolling();
    }
  } catch (e: any) {
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    try {
      const res: any = await request.get(`/sessions/${route.params.id}`);
      if (res?.status !== 'transcribing') {
        session.value = res;
        transcriptText.value = res?.transcript || '';
        stopPolling();
        if (res?.status === 'completed') {
          ElMessage.success('转写完成！');
        } else if (res?.status === 'failed') {
          ElMessage.error('转写失败，请重试');
        }
      }
    } catch {
      // 忽略轮询错误
    }
  }, 3000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function beforeUpload(file: File) {
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 50MB');
    return false;
  }
  uploading.value = true;
  return true;
}

function handleUploadSuccess(response: any) {
  uploading.value = false;
  ElMessage.success('音频上传成功！正在转写中...');
  // 刷新数据并开始轮询
  fetchData();
}

function handleUploadError(err: any) {
  uploading.value = false;
  ElMessage.error('上传失败：' + (err.message || '未知错误'));
}

function handleUploadProgress(event: any) {
  uploadProgress.value = Math.round(event.percent || 0);
}

async function analyzeSession() {
  analyzing.value = true;
  try {
    await request.post(`/sessions/${route.params.id}/analyze`);
    ElMessage.success('AI 分析完成');
    setTimeout(fetchData, 1000);
  } catch (err: any) {
    ElMessage.error('分析失败：' + (err.message || '未知错误'));
  } finally {
    analyzing.value = false;
  }
}

async function updateTranscript() {
  if (!transcriptText.value.trim()) {
    ElMessage.warning('请输入转写文本');
    return;
  }

  analyzing.value = true;
  try {
    await request.put(`/sessions/${route.params.id}/transcript`, {
      transcript: transcriptText.value,
    });
    await request.post(`/sessions/${route.params.id}/analyze`);
    ElMessage.success('文本已更新，AI 分析完成');
    setTimeout(fetchData, 1000);
  } catch (err: any) {
    ElMessage.error('操作失败：' + (err.message || '未知错误'));
  } finally {
    analyzing.value = false;
  }
}

function copyText(text: string) {
  navigator.clipboard.writeText(text);
  ElMessage.success('话术已复制');
}

onMounted(fetchData);

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  background: #fafafa;
  margin-top: 12px;
}

.pending-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  margin-top: 12px;
  color: #fa8c16;
}

.transcribing-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
  margin-top: 12px;
  color: #1890ff;
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

.blocker-detail {
  color: #606266;
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.talking-point p {
  flex: 1;
  margin: 0;
}
</style>
