<template>
  <div class="page-container" v-if="customer">
    <div class="page-header">
      <el-button @click="$router.back()">返回</el-button>
      <h2 class="page-title" style="display:inline; margin-left:12px">{{ customer.name }} - 客户详情</h2>
    </div>

    <!-- 基本信息 -->
    <div class="card-grid">
      <div class="stat-card"><div class="stat-label">电话</div><div class="stat-value" style="font-size:16px">{{ customer.phone }}</div></div>
      <div class="stat-card"><div class="stat-label">来源</div><div class="stat-value" style="font-size:16px">{{ customer.source || '-' }}</div></div>
      <div class="stat-card"><div class="stat-label">状态</div><el-tag :type="customer.status === 'active' ? 'success' : 'info'">{{ customer.status }}</el-tag></div>
      <div class="stat-card"><div class="stat-label">预算敏感度</div><div class="stat-value" style="font-size:16px">{{ customer.budgetSensitivity }}</div></div>
    </div>

    <!-- 标签 -->
    <div class="table-card">
      <h3>客户标签 <el-button size="small" @click="showTagDialog = true" style="margin-left:12px">+ 添加标签</el-button></h3>
      <div style="margin-top:8px">
        <el-tag v-for="t in customer.tags" :key="t.id" closable @close="removeTag(t.id)" style="margin:4px">{{ t.category }}: {{ t.value }}</el-tag>
      </div>
    </div>

    <!-- 喜好备忘录 -->
    <div class="table-card">
      <h3>私人喜好备忘录</h3>
      <div v-for="p in customer.preferences" :key="p.id" style="padding:8px 0; border-bottom:1px solid #eee">
        <span style="color:#909399">[{{ p.category }}]</span> {{ p.content }}
        <el-tag size="small">{{ p.importance }}</el-tag>
      </div>
    </div>

    <!-- 项目时间轴 -->
    <div class="table-card">
      <h3>历史项目时间轴</h3>
      <el-timeline style="margin-top:12px">
        <el-timeline-item v-for="p in customer.projects" :key="p.id" :timestamp="new Date(p.date).toLocaleDateString()">
          {{ p.projectName }} <el-tag size="small">{{ p.status }}</el-tag>
        </el-timeline-item>
      </el-timeline>
    </div>

    <!-- 操作区 -->
    <div class="table-card">
      <h3>快速操作</h3>
      <div style="display:flex; gap:12px; margin-top:12px">
        <el-button type="primary" @click="createSession">📞 创建面诊会话</el-button>
        <el-button type="success" @click="generateTasks">📋 生成跟进任务</el-button>
      </div>
    </div>

    <el-dialog title="添加标签" v-model="showTagDialog" width="400px">
      <el-form :model="tagForm" label-width="60px">
        <el-form-item label="分类"><el-input v-model="tagForm.category" placeholder="如：项目意向" /></el-form-item>
        <el-form-item label="值"><el-input v-model="tagForm.value" placeholder="如：热玛吉" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTagDialog = false">取消</el-button>
        <el-button type="primary" @click="addTag">确定</el-button>
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
const tagForm = ref({ category: '', value: '' });

async function fetchData() {
  customer.value = await request.get(`/customers/${route.params.id}`);
}

async function addTag() {
  await request.post(`/customers/${route.params.id}/tags`, tagForm.value);
  ElMessage.success('标签已添加'); showTagDialog.value = false; fetchData();
}

async function removeTag(tagId: string) {
  await request.delete(`/customers/${route.params.id}/tags/${tagId}`);
  ElMessage.success('标签已删除'); fetchData();
}

async function createSession() {
  await request.post('/sessions', { customerId: route.params.id });
  ElMessage.success('面诊会话已创建，AI 正在分析中...');
  setTimeout(() => fetchData(), 1000);
}

async function generateTasks() {
  await request.post('/tasks/generate', { customerId: route.params.id });
  ElMessage.success('跟进任务已生成');
}

onMounted(fetchData);
</script>
