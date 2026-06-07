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

    <div v-else-if="session">
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
          <span>请上传面诊录音音频或手动输入转写文本</span>
        </div>

        <!-- 转写中状态提示 -->
        <div v-if="session.status === 'transcribing'" class="transcribing-banner">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>音频正在转写中，请稍候...</span>
          <el-button size="small" @click="fetchData">刷新状态</el-button>
        </div>

        <!-- 上传区域 -->
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
        <div style="margin-top:16px">
          <h4 style="margin-bottom:8px">转写文本</h4>
          <el-input
            type="textarea"
            v-model="transcriptText"
            :rows="6"
            placeholder="输入或粘贴面诊转写文本..."
          />
          <div style="margin-top:8px; display:flex; gap:8px">
            <el-button @click="analyzeSession" type="primary" :loading="analyzing" :disabled="!transcriptText.trim()">
              AI 分析
            </el-button>
            <el-button @click="updateTranscript" type="warning" :loading="analyzing" v-if="session.transcript">
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
      <div class="table-card" v-if="customerTags.length">
        <h3>客户标签</h3>
        <div style="margin-top:8px">
          <el-tag v-for="tag in customerTags" :key="tag.id" style="margin:4px" type="info">
            [{{ tag.category }}] {{ tag.value }}
          </el-tag>
        </div>
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

      <!-- 跟进策略（按项目分组） -->
      <div class="table-card" v-if="followUpPlan">
        <div class="section-header">
          <h3>跟进策略</h3>
          <el-tag :type="planStatusType[followUpPlan.status] || 'info'" size="small">
            {{ planStatusMap[followUpPlan.status] || followUpPlan.status }}
          </el-tag>
        </div>

        <!-- 项目策略列表 -->
        <div v-for="(ps, pi) in projectStrategies" :key="pi" class="project-strategy">
          <div class="project-header">
            <el-tag type="primary" size="small">{{ ps.projectType }}</el-tag>
            <span class="project-name">{{ ps.projectId }}</span>
            <el-button v-if="isPlanEditable" size="small" type="primary" @click="addStrategyToProject(pi)">
              + 添加策略
            </el-button>
          </div>

          <div v-for="(strategy, si) in ps.strategies" :key="strategy.id || si" class="strategy-item">
            <div class="strategy-header">
              <div class="strategy-title">
                <el-icon v-if="strategy.status === 'completed'" style="color:#67c23a"><CircleCheck /></el-icon>
                <el-icon v-else-if="strategy.status === 'pending'" style="color:#e6a23c"><Clock /></el-icon>
                <el-input v-if="isPlanEditable" v-model="strategy.title" size="small" placeholder="策略标题" style="width:200px" />
                <span v-else>{{ strategy.title }}</span>
              </div>
              <div class="strategy-time">
                <el-date-picker
                  v-if="isPlanEditable"
                  v-model="strategy.executeAt"
                  type="datetime"
                  size="small"
                  placeholder="选择执行时间"
                  format="MM/DD HH:mm"
                  value-format="YYYY-MM-DDTHH:mm:ssZ"
                  style="width:180px"
                />
                <template v-else>
                  <el-icon><Calendar /></el-icon>
                  <span>{{ formatExecuteTime(strategy.executeAt) }}</span>
                </template>
              </div>
            </div>

            <div class="strategy-content">
              <el-input
                v-if="isPlanEditable"
                v-model="strategy.talkingPoint"
                type="textarea"
                :rows="3"
                placeholder="话术内容..."
              />
              <p v-else>{{ strategy.talkingPoint }}</p>
            </div>

            <div class="strategy-actions" v-if="isPlanEditable || strategy.taskId">
              <el-button v-if="isPlanEditable" type="danger" link size="small" @click="removeStrategy(pi, si)">
                删除
              </el-button>
              <el-button v-if="!isPlanEditable" type="primary" link size="small" @click="copyText(strategy.talkingPoint)">
                复制话术
              </el-button>
              <el-tag v-if="strategy.taskId" size="small" type="success">已生成任务</el-tag>
            </div>
          </div>
        </div>

        <!-- 咨询师备注 -->
        <div style="margin-top:16px">
          <h4>咨询师备注</h4>
          <el-input
            v-if="isPlanEditable"
            v-model="consultantNotes"
            type="textarea"
            :rows="3"
            placeholder="补充你的判断和调整..."
            style="margin-top:8px"
          />
          <p v-else style="margin-top:8px; color:#606266">{{ consultantNotes || '-' }}</p>
        </div>

        <!-- 操作按钮 -->
        <div style="margin-top:16px; display:flex; gap:12px" v-if="isPlanEditable">
          <el-button type="primary" @click="savePlan" :loading="savingPlan">保存修改</el-button>
          <el-button type="success" @click="confirmPlan" :loading="savingPlan" v-if="followUpPlan.status === 'draft'">
            确认策略并生成任务
          </el-button>
        </div>

        <!-- 跟进记录 -->
        <div style="margin-top:24px">
          <div class="section-header">
            <h4>跟进记录</h4>
            <el-button
              v-if="followUpPlan.status === 'confirmed' || followUpPlan.status === 'executing'"
              size="small"
              type="primary"
              @click="showFollowUpDialog = true"
            >
              + 记录跟进
            </el-button>
          </div>

          <el-timeline v-if="followUpPlan.followUpRecords?.length" style="margin-top:16px">
            <el-timeline-item
              v-for="(record, i) in followUpPlan.followUpRecords"
              :key="i"
              :timestamp="formatDateTime(record.contactedAt)"
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
                  下次跟进：{{ formatDate(record.nextFollowUpDate) }}
                </p>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无跟进记录" :image-size="60" />
        </div>

        <!-- 完成/取消策略 -->
        <div style="margin-top:16px; display:flex; gap:12px" v-if="followUpPlan.status === 'executing' || followUpPlan.status === 'confirmed'">
          <el-button type="success" @click="completePlan" :loading="completingPlan">标记完成</el-button>
          <el-button type="danger" plain @click="cancelPlan" :loading="cancellingPlan">取消策略</el-button>
        </div>
      </div>

      <!-- 无跟进策略时的提示 -->
      <div class="table-card" v-else-if="session.status === 'completed' && session.summary">
        <div style="text-align:center; padding:24px">
          <p style="color:#909399; margin-bottom:12px">AI 分析已完成，跟进策略正在生成中...</p>
          <el-button type="primary" @click="fetchData">刷新状态</el-button>
        </div>
      </div>
    </div>

    <div v-else style="padding:60px; text-align:center">
      <p style="color:#909399">会话不存在或已被删除</p>
      <el-button type="primary" style="margin-top:16px" @click="$router.back()">返回列表</el-button>
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
          <el-date-picker v-model="followUpForm.nextFollowUpDate" type="date" style="width:100%" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFollowUpDialog = false">取消</el-button>
        <el-button type="primary" @click="addFollowUpRecord" :loading="savingFollowUp">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Loading, Upload, CircleCheck, Clock, Calendar } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import request from '@/api/request';
import { formatDateTime, formatDate } from '@/utils/date';

const route = useRoute();
const userStore = useAuthStore();
const token = userStore.token || '';

const session = ref<any>(null);
const customerTags = ref<any[]>([]);
const followUpPlan = ref<any>(null);
const projectStrategies = ref<any[]>([]);
const transcriptText = ref('');
const uploading = ref(false);
const uploadProgress = ref(0);
const analyzing = ref(false);
const loading = ref(true);
const error = ref('');
let pollTimer: ReturnType<typeof setInterval> | null = null;

const consultantNotes = ref('');
const savingPlan = ref(false);
const completingPlan = ref(false);
const cancellingPlan = ref(false);
const showFollowUpDialog = ref(false);
const savingFollowUp = ref(false);
const followUpForm = ref({
  method: 'wechat',
  result: 'replied',
  notes: '',
  nextFollowUpDate: null as any,
});

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

const planStatusMap: Record<string, string> = {
  draft: '草稿',
  confirmed: '已确认',
  executing: '执行中',
  completed: '已完成',
  cancelled: '已取消',
};

const planStatusType: Record<string, string> = {
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

const isPlanEditable = computed(() => {
  return followUpPlan.value && (followUpPlan.value.status === 'draft' || followUpPlan.value.status === 'confirmed');
});

async function fetchData() {
  loading.value = true;
  error.value = '';
  try {
    session.value = await request.get(`/sessions/${route.params.id}`);
    transcriptText.value = session.value?.transcript || '';

    // 获取客户标签
    if (session.value?.customerId) {
      try {
        const customerDetail: any = await request.get(`/customers/${session.value.customerId}`);
        customerTags.value = customerDetail?.tags || [];
      } catch {
        customerTags.value = [];
      }
    }

    // 获取关联的跟进策略
    if (session.value?.status === 'completed') {
      await fetchFollowUpPlan();
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

async function fetchFollowUpPlan() {
  try {
    const res: any = await request.get('/follow-up-plans', {
      params: { sessionId: route.params.id },
    });
    if (res && res.length > 0) {
      followUpPlan.value = res[0];
      projectStrategies.value = followUpPlan.value.projectStrategies || [];
      consultantNotes.value = followUpPlan.value.consultantNotes || '';
    }
  } catch {
    followUpPlan.value = null;
    projectStrategies.value = [];
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
          await fetchFollowUpPlan();
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

function handleUploadSuccess() {
  uploading.value = false;
  ElMessage.success('音频上传成功！正在转写中...');
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
  if (!transcriptText.value.trim()) {
    ElMessage.warning('请输入转写文本');
    return;
  }

  analyzing.value = true;
  try {
    // 如果会话还没有转写文本，先更新
    if (!session.value.transcript) {
      await request.put(`/sessions/${route.params.id}/transcript`, {
        transcript: transcriptText.value,
      });
    }
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

// 跟进策略操作
function addStrategyToProject(projectIndex: number) {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  projectStrategies.value[projectIndex].strategies.push({
    id: Date.now().toString(),
    title: '',
    talkingPoint: '',
    executeAt: now.toISOString(),
    status: 'pending',
  });
}

function removeStrategy(projectIndex: number, strategyIndex: number) {
  projectStrategies.value[projectIndex].strategies.splice(strategyIndex, 1);
}

function formatExecuteTime(dateStr: string): string {
  if (!dateStr) return '未设置';
  try {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

async function savePlan() {
  if (!followUpPlan.value) return;
  savingPlan.value = true;
  try {
    await request.put(`/follow-up-plans/${followUpPlan.value.id}`, {
      projectStrategies: projectStrategies.value,
      consultantNotes: consultantNotes.value,
    });
    ElMessage.success('保存成功');
    await fetchFollowUpPlan();
  } catch {
    ElMessage.error('保存失败');
  }
  savingPlan.value = false;
}

async function confirmPlan() {
  if (!followUpPlan.value) return;
  savingPlan.value = true;
  try {
    await request.post(`/follow-up-plans/${followUpPlan.value.id}/confirm`, {
      projectStrategies: projectStrategies.value,
      consultantNotes: consultantNotes.value,
    });
    ElMessage.success('策略已确认，任务已生成');
    await fetchFollowUpPlan();
  } catch {
    ElMessage.error('确认失败');
  }
  savingPlan.value = false;
}

async function addFollowUpRecord() {
  if (!followUpPlan.value) return;
  savingFollowUp.value = true;
  try {
    const record: any = {
      method: followUpForm.value.method,
      result: followUpForm.value.result,
      notes: followUpForm.value.notes,
    };
    if (followUpForm.value.nextFollowUpDate) {
      record.nextFollowUpDate = new Date(followUpForm.value.nextFollowUpDate).toISOString();
    }
    await request.post(`/follow-up-plans/${followUpPlan.value.id}/follow-up`, record);
    ElMessage.success('跟进记录已添加');
    showFollowUpDialog.value = false;
    followUpForm.value = { method: 'wechat', result: 'replied', notes: '', nextFollowUpDate: null };
    await fetchFollowUpPlan();
  } catch {
    ElMessage.error('添加失败');
  }
  savingFollowUp.value = false;
}

async function completePlan() {
  if (!followUpPlan.value) return;
  completingPlan.value = true;
  try {
    await request.post(`/follow-up-plans/${followUpPlan.value.id}/complete`);
    ElMessage.success('策略已完成');
    await fetchFollowUpPlan();
  } catch {
    ElMessage.error('操作失败');
  }
  completingPlan.value = false;
}

async function cancelPlan() {
  if (!followUpPlan.value) return;
  cancellingPlan.value = true;
  try {
    await request.post(`/follow-up-plans/${followUpPlan.value.id}/cancel`);
    ElMessage.success('策略已取消');
    await fetchFollowUpPlan();
  } catch {
    ElMessage.error('操作失败');
  }
  cancellingPlan.value = false;
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

.project-strategy {
  margin-top: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #eee;
}

.project-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.project-name {
  font-weight: 600;
  font-size: 16px;
}

.strategy-item {
  margin-top: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.strategy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.strategy-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.strategy-time {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 13px;
}

.strategy-content {
  margin: 8px 0;
}

.strategy-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
</style>
