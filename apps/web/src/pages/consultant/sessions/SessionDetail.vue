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
        <el-tag style="margin-left:12px" :type="session.status === 'completed' ? 'success' : 'warning'">{{ session.status }}</el-tag>
      </div>

      <div class="table-card">
        <h3>🎤 语音转写</h3>
        <div class="upload-area">
          <el-upload
            ref="uploadRef"
            :action="`/api/sessions/${route.params.id}/audio`"
            :headers="{ Authorization: `Bearer ${token}` }"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :on-progress="handleUploadProgress"
            accept=".mp3,.wav,.m4a,.ogg,.webm,.aac"
          >
            <el-button type="primary" size="large" :loading="uploading">
              <span v-if="!uploading">📤 上传MP3音频</span>
              <span v-else>上传中... {{ uploadProgress }}%</span>
            </el-button>
          </el-upload>
          <p style="margin-top:8px; color:#909399; font-size:13px">
            支持 MP3、WAV、M4A、OGG、WEBM、AAC 格式，最大 50MB
          </p>
        </div>

        <div v-if="session.audioUrl" style="margin-top:16px; padding:12px; background:#f5f7fa; border-radius:8px">
          <p style="margin-bottom:8px"><strong>已上传音频：</strong></p>
          <audio :src="session.audioUrl" controls style="width:100%"></audio>
        </div>

        <div v-if="session.transcript" style="margin-top:16px">
          <h4 style="margin-bottom:8px">📝 转写文本</h4>
          <el-input
            type="textarea"
            v-model="transcriptText"
            :rows="6"
            placeholder="转写文本将显示在这里..."
          />
          <div style="margin-top:8px">
            <el-button @click="updateTranscript" type="warning" :loading="analyzing">
              🔄 重新分析
            </el-button>
          </div>
        </div>
      </div>

      <div class="table-card" v-if="session.summary">
        <h3>📊 AI 面诊总结</h3>
        <p style="margin-top:8px; line-height:1.8; color:#606266">{{ session.summary }}</p>
      </div>

      <div class="table-card">
        <h3>🏷️ 客户标签</h3>
        <div v-if="customerTags.length" style="margin-top:8px">
          <el-tag v-for="tag in customerTags" :key="tag.id" style="margin:4px" type="info">
            [{{ tag.category }}] {{ tag.value }}
          </el-tag>
        </div>
        <el-empty v-else description="暂无标签" :image-size="60" />
      </div>

      <div class="table-card" v-if="session.keyPoints?.length">
        <h3>🎯 核心诉求</h3>
        <el-table :data="session.keyPoints" style="margin-top:8px">
          <el-table-column prop="topic" label="主题" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="intent" label="意向" width="80">
            <template #default="{ row }"><el-tag :type="row.intent === 'high' ? 'danger' : 'warning'">{{ row.intent }}</el-tag></template>
          </el-table-column>
        </el-table>
      </div>

      <div class="table-card" v-if="session.blockers?.length">
        <h3>⚠️ 客户卡点</h3>
        <div v-for="b in session.blockers" :key="b.type" style="padding:8px 0; border-bottom:1px solid #eee">
          <el-tag size="small" style="margin-right:8px">{{ b.type }}</el-tag>
          <span>{{ b.detail }}</span>
          <p style="color:#67c23a; font-size:13px; margin-top:4px">{{ b.suggestedResponse }}</p>
        </div>
      </div>

      <div class="table-card" v-if="session.followUpStrategy?.talkingPoints?.length">
        <h3>💡 AI 跟进策略</h3>
        <div style="background:#f0f9eb; border-radius:8px; padding:16px; margin-top:8px">
          <p style="font-weight:600; margin-bottom:8px">{{ session.followUpStrategy.summary }}</p>
          <div v-for="(tp, i) in session.followUpStrategy.talkingPoints" :key="i" style="padding:8px 0; border-bottom:1px dashed #ddd">
            <p>{{ tp }}</p>
            <el-button size="small" type="primary" style="margin-top:4px" @click="copyText(tp)">📋 复制话术</el-button>
          </div>
          <p style="margin-top:8px; color:#909399">最佳跟进时间：{{ session.followUpStrategy.bestFollowUpTime }}</p>
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
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
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

async function fetchData() {
  loading.value = true;
  error.value = '';
  try {
    session.value = await request.get(`/sessions/${route.params.id}`);
    transcriptText.value = session.value?.transcript || '';

    if (session.value?.customerId) {
      try {
        const customerDetail = await request.get(`/customers/${session.value.customerId}`);
        customerTags.value = customerDetail?.tags || [];
      } catch {
        customerTags.value = [];
      }
    }
  } catch (e: any) {
    error.value = e.message || '加载失败';
    console.error('会话详情加载失败:', e);
  } finally {
    loading.value = false;
  }
}

function handleUploadSuccess(response: any) {
  uploading.value = false;
  ElMessage.success('音频上传成功！正在进行AI分析...');
  setTimeout(fetchData, 2000);
}

function handleUploadError(error: any) {
  uploading.value = false;
  ElMessage.error('上传失败：' + (error.message || '未知错误'));
}

function handleUploadProgress(event: any) {
  uploadProgress.value = Math.round(event.percent || 0);
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
    ElMessage.success('正在重新分析...');
    setTimeout(fetchData, 2000);
  } catch (err: any) {
    ElMessage.error('分析失败：' + (err.message || '未知错误'));
  } finally {
    analyzing.value = false;
  }
}

function copyText(text: string) {
  navigator.clipboard.writeText(text);
  ElMessage.success('话术已复制');
}

onMounted(fetchData);
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
</style>
