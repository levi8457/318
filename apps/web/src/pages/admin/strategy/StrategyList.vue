<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">策略模板管理</h2>
      <el-button type="primary" @click="showCreateDialog">创建模板</el-button>
    </div>

    <div class="table-card">
      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索模板名称..."
          clearable
          style="width: 240px"
          @clear="fetchData"
          @keyup.enter="fetchData"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="categoryFilter" placeholder="分类" clearable style="width: 150px" @change="fetchData">
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
        <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 120px" @change="fetchData">
          <el-option label="已启用" value="true" />
          <el-option label="已停用" value="false" />
        </el-select>
        <el-button type="primary" @click="fetchData">搜索</el-button>
      </div>

      <el-table :data="templates" stripe v-loading="loading">
        <el-table-column prop="name" label="模板名称" min-width="200" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="适用项目" width="150">
          <template #default="{ row }">
            <el-tag v-for="t in (row.applicableProjectTypes || [])" :key="t" size="small" style="margin:2px">{{ t }}</el-tag>
            <span v-if="!row.applicableProjectTypes?.length" style="color:#909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-switch :model-value="row.isActive" @change="toggleStatus(row.id)" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleDateString() }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showEditDialog(row)">编辑</el-button>
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-popconfirm title="确定删除？" @confirm="handleDelete(row.id)">
              <template #reference><el-button size="small" type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 创建/编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="700px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="模板名称">
          <el-input v-model="form.name" placeholder="如：热玛吉术后跟进策略" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" placeholder="如：术后跟进/术前沟通/升单策略" />
        </el-form-item>
        <el-form-item label="适用项目类型">
          <div class="tag-selector">
            <el-tag
              v-for="pt in projectTypeOptions"
              :key="pt.id"
              :type="form.applicableProjectTypes.includes(pt.name) ? '' : 'info'"
              :effect="form.applicableProjectTypes.includes(pt.name) ? 'dark' : 'plain'"
              class="tag-option"
              @click="toggleProjectType(pt.name)"
            >
              {{ pt.name }}
            </el-tag>
          </div>
          <div v-if="form.applicableProjectTypes.length" style="margin-top:8px">
            <span style="color:#909399; font-size:12px; margin-right:8px">已选：</span>
            <el-tag
              v-for="pt in form.applicableProjectTypes"
              :key="pt"
              closable
              size="small"
              style="margin:2px"
              @close="removeProjectType(pt)"
            >
              {{ pt }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="适用卡点类型">
          <el-select v-model="form.applicableBlockerTypes" multiple placeholder="选择卡点类型" style="width:100%">
            <el-option label="价格顾虑" value="price" />
            <el-option label="疼痛顾虑" value="pain" />
            <el-option label="信任顾虑" value="trust" />
            <el-option label="家人反对" value="family" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进步骤">
          <div v-for="(step, index) in form.steps" :key="index" class="step-item">
            <div class="step-header">
              <span>步骤 {{ index + 1 }}</span>
              <el-button type="danger" link @click="removeStep(index)">删除</el-button>
            </div>
            <el-form-item label="天数偏移" label-width="80px">
              <el-input-number v-model="step.dayOffset" :min="0" :max="365" />
            </el-form-item>
            <el-form-item label="行动描述" label-width="80px">
              <el-input v-model="step.action" placeholder="如：发送关怀消息" />
            </el-form-item>
            <el-form-item label="话术要点" label-width="80px">
              <el-input v-model="step.talkingPoints" type="textarea" :rows="2" placeholder="每行一个话术要点" />
            </el-form-item>
          </div>
          <el-button type="primary" plain @click="addStep">添加步骤</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog title="策略模板详情" v-model="detailVisible" width="600px">
      <div v-if="currentTemplate">
        <p><strong>模板名称：</strong>{{ currentTemplate.name }}</p>
        <p><strong>分类：</strong>{{ currentTemplate.category || '-' }}</p>
        <p><strong>适用项目：</strong>{{ (currentTemplate.applicableProjectTypes || []).join('、') || '-' }}</p>
        <p><strong>适用卡点：</strong>{{ (currentTemplate.applicableBlockerTypes || []).join('、') || '-' }}</p>
        <p><strong>状态：</strong>
          <el-tag :type="currentTemplate.isActive ? 'success' : 'info'">
            {{ currentTemplate.isActive ? '已启用' : '已停用' }}
          </el-tag>
        </p>
        <div v-if="currentTemplate.steps?.length" style="margin-top:16px">
          <h4>跟进步骤</h4>
          <div v-for="(step, i) in currentTemplate.steps" :key="i" class="step-detail">
            <p><strong>步骤{{ i + 1 }}：</strong>第{{ step.dayOffset }}天 - {{ step.action }}</p>
            <p v-if="step.talkingPoints" style="color:#606266; margin-left:20px">{{ step.talkingPoints }}</p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import request from '@/api/request';

const templates = ref<any[]>([]);
const categories = ref<string[]>([]);
const projectTypeOptions = ref<any[]>([]);
const loading = ref(false);
const keyword = ref('');
const categoryFilter = ref('');
const statusFilter = ref('');
const dialogVisible = ref(false);
const detailVisible = ref(false);
const isEdit = ref(false);
const editId = ref('');
const dialogTitle = ref('创建模板');
const currentTemplate = ref<any>(null);
const form = ref({
  name: '',
  category: '',
  applicableProjectTypes: [] as string[],
  applicableBlockerTypes: [] as string[],
  steps: [] as any[],
});

async function fetchData() {
  loading.value = true;
  const params: Record<string, any> = {};
  if (keyword.value) params.keyword = keyword.value;
  if (categoryFilter.value) params.category = categoryFilter.value;
  if (statusFilter.value) params.isActive = statusFilter.value;

  const res: any = await request.get('/admin/strategy-templates', { params });
  templates.value = Array.isArray(res) ? res : [];
  loading.value = false;
}

async function fetchCategories() {
  const res: any = await request.get('/admin/strategy-templates/categories');
  categories.value = Array.isArray(res) ? res : [];
}

async function fetchProjectTypes() {
  const res: any = await request.get('/admin/project-types/active');
  projectTypeOptions.value = Array.isArray(res) ? res : [];
}

function toggleProjectType(pt: string) {
  const index = form.value.applicableProjectTypes.indexOf(pt);
  if (index === -1) {
    form.value.applicableProjectTypes.push(pt);
  } else {
    form.value.applicableProjectTypes.splice(index, 1);
  }
}

function removeProjectType(pt: string) {
  form.value.applicableProjectTypes = form.value.applicableProjectTypes.filter(p => p !== pt);
}

function showCreateDialog() {
  isEdit.value = false;
  dialogTitle.value = '创建模板';
  form.value = {
    name: '',
    category: '',
    applicableProjectTypes: [],
    applicableBlockerTypes: [],
    steps: [],
  };
  dialogVisible.value = true;
}

function showEditDialog(row: any) {
  isEdit.value = true;
  editId.value = row.id;
  dialogTitle.value = '编辑模板';
  form.value = {
    name: row.name || '',
    category: row.category || '',
    applicableProjectTypes: row.applicableProjectTypes || [],
    applicableBlockerTypes: row.applicableBlockerTypes || [],
    steps: row.steps || [],
  };
  dialogVisible.value = true;
}

function viewDetail(row: any) {
  currentTemplate.value = row;
  detailVisible.value = true;
}

function addStep() {
  form.value.steps.push({
    dayOffset: 0,
    action: '',
    talkingPoints: '',
  });
}

function removeStep(index: number) {
  form.value.steps.splice(index, 1);
}

async function handleSubmit() {
  if (!form.value.name) {
    ElMessage.warning('请输入模板名称');
    return;
  }

  if (isEdit.value) {
    await request.put(`/admin/strategy-templates/${editId.value}`, form.value);
  } else {
    await request.post('/admin/strategy-templates', form.value);
  }
  ElMessage.success('操作成功');
  dialogVisible.value = false;
  fetchData();
  fetchCategories();
}

async function handleDelete(id: string) {
  await request.delete(`/admin/strategy-templates/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

async function toggleStatus(id: string) {
  await request.put(`/admin/strategy-templates/${id}/status`);
  fetchData();
}

onMounted(() => {
  fetchData();
  fetchCategories();
  fetchProjectTypes();
});
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.step-item {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
}

.step-detail {
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
}

.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-option {
  cursor: pointer;
  transition: all 0.2s;
}

.tag-option:hover {
  opacity: 0.8;
}
</style>
