<template>
  <div class="page-container" v-if="customer">
    <div class="page-header">
      <el-button @click="$router.back()">返回</el-button>
      <h2 class="page-title" style="display:inline; margin-left:12px">{{ customer.name }} - 客户详情</h2>
    </div>

    <!-- 基本信息 -->
    <div class="card-grid">
      <div class="stat-card">
        <div class="stat-label">电话</div>
        <div class="stat-value" style="font-size:16px">{{ customer.phone }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">来源</div>
        <div class="stat-value" style="font-size:16px">{{ customer.source || '-' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">状态</div>
        <el-tag :type="customer.status === 'active' ? 'success' : customer.status === 'lost' ? 'danger' : 'info'">
          {{ statusMap[customer.status] || customer.status }}
        </el-tag>
      </div>
      <div class="stat-card">
        <div class="stat-label">预算敏感度</div>
        <div class="stat-value" style="font-size:16px">{{ budgetMap[customer.budgetSensitivity] || customer.budgetSensitivity }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">生日</div>
        <div class="stat-value" style="font-size:16px">{{ customer.birthday ? new Date(customer.birthday).toLocaleDateString() : '-' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">纪念日</div>
        <div class="stat-value" style="font-size:16px">{{ customer.anniversary ? new Date(customer.anniversary).toLocaleDateString() : '-' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">最近项目日期</div>
        <div class="stat-value" style="font-size:16px">{{ customer.lastBeautyDate ? new Date(customer.lastBeautyDate).toLocaleDateString() : '-' }}</div>
      </div>
    </div>

    <!-- 标签 -->
    <div class="table-card">
      <div class="section-header">
        <h3>客户标签</h3>
        <el-button size="small" type="primary" @click="showTagDialog = true">+ 添加标签</el-button>
      </div>
      <div style="margin-top:8px">
        <el-tag v-for="t in customer.tags" :key="t.id" closable @close="removeTag(t.id)" style="margin:4px">
          {{ t.category }}: {{ t.value }}
        </el-tag>
        <span v-if="!customer.tags?.length" style="color:#909399">暂无标签</span>
      </div>
    </div>

    <!-- 喜好备忘录 -->
    <div class="table-card">
      <div class="section-header">
        <h3>私人喜好备忘录</h3>
        <el-button size="small" type="primary" @click="showPrefDialog = true">+ 添加备忘</el-button>
      </div>
      <div v-if="customer.preferences?.length" style="margin-top:8px">
        <div v-for="p in customer.preferences" :key="p.id" class="pref-item">
          <div class="pref-content">
            <span class="pref-category">[{{ p.category }}]</span>
            {{ p.content }}
          </div>
          <div class="pref-actions">
            <el-tag size="small" :type="p.importance === 'critical' ? 'danger' : p.importance === 'important' ? 'warning' : 'info'">
              {{ importanceMap[p.importance] || p.importance }}
            </el-tag>
            <el-button type="danger" link size="small" @click="removePreference(p.id)">删除</el-button>
          </div>
        </div>
      </div>
      <span v-else style="color:#909399">暂无备忘录</span>
    </div>

    <!-- 转介绍信息 -->
    <div class="table-card">
      <div class="section-header">
        <h3>转介绍信息</h3>
      </div>
      <div style="margin-top:8px">
        <p v-if="customer.referrer">
          <strong>介绍人：</strong>
          <el-button type="primary" link @click="$router.push(`/dashboard/customers/${customer.referrer.id}`)">
            {{ customer.referrer.name }}
          </el-button>
        </p>
        <p v-else style="color:#909399">无介绍人（自然到店）</p>
        <div v-if="customer.referrals?.length" style="margin-top:12px">
          <p><strong>该客户介绍的客户：</strong></p>
          <el-tag
            v-for="ref in customer.referrals"
            :key="ref.id"
            style="margin:4px; cursor:pointer"
            @click="$router.push(`/dashboard/customers/${ref.id}`)"
          >
            {{ ref.name }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 项目时间轴 -->
    <div class="table-card">
      <div class="section-header">
        <h3>历史项目时间轴</h3>
        <el-button size="small" type="primary" @click="showProjectDialog = true">+ 添加项目</el-button>
      </div>
      <el-timeline style="margin-top:12px" v-if="customer.projects?.length">
        <el-timeline-item
          v-for="p in customer.projects"
          :key="p.id"
          :timestamp="new Date(p.date).toLocaleDateString()"
          placement="top"
        >
          <div class="timeline-item">
            <span class="timeline-title">{{ p.projectName }}</span>
            <el-tag size="small" :type="p.status === 'completed' ? 'success' : p.status === 'in_progress' ? 'warning' : 'info'">
              {{ projectStatusMap[p.status] || p.status }}
            </el-tag>
            <span v-if="p.projectType" class="timeline-type">{{ p.projectType }}</span>
          </div>
          <div v-if="p.notes" class="timeline-notes">{{ p.notes }}</div>
        </el-timeline-item>
      </el-timeline>
      <span v-else style="color:#909399">暂无项目记录</span>
    </div>

    <!-- 操作区 -->
    <div class="table-card">
      <h3>快速操作</h3>
      <div style="display:flex; gap:12px; margin-top:12px">
        <el-button type="primary" @click="showSessionDialog = true">创建面诊会话</el-button>
        <el-button type="success" @click="generateTasks">生成跟进任务</el-button>
      </div>
    </div>

    <!-- 创建会话弹窗 -->
    <el-dialog title="创建面诊会话" v-model="showSessionDialog" width="600px">
      <p style="color:#909399; margin-bottom:16px">
        输入面诊转写文本，系统将自动进行 AI 分析并生成跟进策略。
      </p>
      <el-input
        v-model="sessionTranscript"
        type="textarea"
        :rows="10"
        placeholder="请输入面诊转写文本...&#10;&#10;示例：&#10;咨询师：您好王姐，今天来是想了解哪方面的项目？&#10;客户：我想做热玛吉，但是听说很疼..."
      />
      <template #footer>
        <el-button @click="showSessionDialog = false">取消</el-button>
        <el-button type="primary" @click="createSessionWithTranscript" :loading="creatingSession">
          创建并分析
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加标签弹窗 -->
    <el-dialog title="添加标签" v-model="showTagDialog" width="400px">
      <el-form :model="tagForm" label-width="60px">
        <el-form-item label="分类"><el-input v-model="tagForm.category" placeholder="如：项目意向、身体条件" /></el-form-item>
        <el-form-item label="值"><el-input v-model="tagForm.value" placeholder="如：热玛吉、敏感肌" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTagDialog = false">取消</el-button>
        <el-button type="primary" @click="addTag">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加备忘弹窗 -->
    <el-dialog title="添加备忘" v-model="showPrefDialog" width="400px">
      <el-form :model="prefForm" label-width="80px">
        <el-form-item label="分类"><el-input v-model="prefForm.category" placeholder="如：饮食偏好、忌讳事项" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="prefForm.content" type="textarea" :rows="3" placeholder="详细内容" /></el-form-item>
        <el-form-item label="重要程度">
          <el-select v-model="prefForm.importance" style="width:100%">
            <el-option label="普通" value="normal" />
            <el-option label="重要" value="important" />
            <el-option label="关键" value="critical" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPrefDialog = false">取消</el-button>
        <el-button type="primary" @click="addPreference">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加项目弹窗 -->
    <el-dialog title="添加项目" v-model="showProjectDialog" width="400px">
      <el-form :model="projectForm" label-width="80px">
        <el-form-item label="项目名称"><el-input v-model="projectForm.projectName" placeholder="如：热玛吉面部抗衰" /></el-form-item>
        <el-form-item label="项目类型"><el-input v-model="projectForm.projectType" placeholder="如：抗衰、塑形" /></el-form-item>
        <el-form-item label="日期"><el-date-picker v-model="projectForm.date" type="date" style="width:100%" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="projectForm.notes" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showProjectDialog = false">取消</el-button>
        <el-button type="primary" @click="addProject">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const route = useRoute();
const customer = ref<any>(null);

const showTagDialog = ref(false);
const showPrefDialog = ref(false);
const showProjectDialog = ref(false);
const showSessionDialog = ref(false);
const creatingSession = ref(false);
const sessionTranscript = ref('');

const tagForm = ref({ category: '', value: '' });
const prefForm = ref({ category: '', content: '', importance: 'normal' });
const projectForm = ref({ projectName: '', projectType: '', date: '', notes: '' });

const statusMap: Record<string, string> = { active: '活跃', inactive: '不活跃', lost: '流失' };
const budgetMap: Record<string, string> = { high: '高', medium: '中', low: '低' };
const importanceMap: Record<string, string> = { normal: '普通', important: '重要', critical: '关键' };
const projectStatusMap: Record<string, string> = { planned: '计划中', in_progress: '进行中', completed: '已完成', follow_up: '随访中' };

async function fetchData() {
  customer.value = await request.get(`/customers/${route.params.id}`);
}

async function addTag() {
  if (!tagForm.value.category || !tagForm.value.value) {
    ElMessage.warning('请填写分类和值');
    return;
  }
  await request.post(`/customers/${route.params.id}/tags`, tagForm.value);
  ElMessage.success('标签已添加');
  showTagDialog.value = false;
  tagForm.value = { category: '', value: '' };
  fetchData();
}

async function removeTag(tagId: string) {
  await request.delete(`/customers/${route.params.id}/tags/${tagId}`);
  ElMessage.success('标签已删除');
  fetchData();
}

async function addPreference() {
  if (!prefForm.value.category || !prefForm.value.content) {
    ElMessage.warning('请填写分类和内容');
    return;
  }
  await request.post(`/customers/${route.params.id}/preferences`, prefForm.value);
  ElMessage.success('备忘已添加');
  showPrefDialog.value = false;
  prefForm.value = { category: '', content: '', importance: 'normal' };
  fetchData();
}

async function removePreference(prefId: string) {
  await request.delete(`/customers/${route.params.id}/preferences/${prefId}`);
  ElMessage.success('备忘已删除');
  fetchData();
}

async function addProject() {
  if (!projectForm.value.projectName || !projectForm.value.date) {
    ElMessage.warning('请填写项目名称和日期');
    return;
  }
  await request.post(`/customers/${route.params.id}/projects`, {
    ...projectForm.value,
    date: new Date(projectForm.value.date).toISOString(),
  });
  ElMessage.success('项目已添加');
  showProjectDialog.value = false;
  projectForm.value = { projectName: '', projectType: '', date: '', notes: '' };
  fetchData();
}

async function createSessionWithTranscript() {
  if (!sessionTranscript.value.trim()) {
    ElMessage.warning('请输入面诊转写文本');
    return;
  }

  creatingSession.value = true;
  try {
    const res: any = await request.post('/sessions', {
      customerId: route.params.id,
      transcript: sessionTranscript.value,
    });
    ElMessage.success('面诊会话已创建，AI 正在分析...');
    showSessionDialog.value = false;
    sessionTranscript.value = '';
    // 跳转到会话详情页
    if (res?.id) {
      window.location.href = `/dashboard/sessions/${res.id}`;
    }
  } catch (err: any) {
    ElMessage.error('创建失败：' + (err?.message || '未知错误'));
  }
  creatingSession.value = false;
}

async function generateTasks() {
  await request.post('/tasks/generate', { customerId: route.params.id });
  ElMessage.success('跟进任务已生成');
}

onMounted(fetchData);
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pref-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.pref-content {
  flex: 1;
}

.pref-category {
  color: #909399;
  margin-right: 8px;
}

.pref-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-title {
  font-weight: 500;
}

.timeline-type {
  color: #909399;
  font-size: 12px;
}

.timeline-notes {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}
</style>
