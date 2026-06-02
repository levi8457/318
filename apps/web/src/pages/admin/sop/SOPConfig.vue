<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">SOP 模板配置</h2>
      <el-button type="primary" @click="showCreateDialog">创建 SOP 模板</el-button>
    </div>

    <div class="table-card">
      <el-table :data="templates" stripe v-loading="loading">
        <el-table-column prop="name" label="模板名称" min-width="200" />
        <el-table-column label="适用项目" min-width="200">
          <template #default="{ row }">
            <el-tag v-for="pt in (row.projectTypes || [])" :key="pt" size="small" style="margin:2px">{{ pt }}</el-tag>
            <span v-if="!row.projectTypes?.length" style="color:#909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="节点数" width="80">
          <template #default="{ row }">{{ row.nodes?.length || 0 }}</template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
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
      <el-form :model="form" label-width="100px">
        <el-form-item label="模板名称">
          <el-input v-model="form.name" placeholder="如：热玛吉术后SOP" />
        </el-form-item>
        <el-form-item label="适用项目">
          <div class="tag-selector">
            <el-tag
              v-for="pt in projectTypeOptions"
              :key="pt.id"
              :type="form.projectTypes.includes(pt.name) ? '' : 'info'"
              :effect="form.projectTypes.includes(pt.name) ? 'dark' : 'plain'"
              class="tag-option"
              @click="toggleProjectType(pt.name)"
            >
              {{ pt.name }}
            </el-tag>
          </div>
          <div v-if="form.projectTypes.length" style="margin-top:8px">
            <span style="color:#909399; font-size:12px; margin-right:8px">已选：</span>
            <el-tag
              v-for="pt in form.projectTypes"
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
        <el-form-item label="启用状态">
          <el-switch v-model="form.isActive" />
        </el-form-item>
        <el-form-item label="提醒节点">
          <div v-for="(node, i) in form.nodes" :key="i" class="node-item">
            <div class="node-header">
              <span>节点 {{ i + 1 }}</span>
              <el-button type="danger" link @click="form.nodes.splice(i, 1)">删除</el-button>
            </div>
            <div class="node-content">
              <el-form-item label="天数偏移" label-width="80px">
                <el-input-number v-model="node.dayOffset" :min="0" :max="365" size="small" />
                <span style="margin-left:8px; color:#909399">天后触发</span>
              </el-form-item>
              <el-form-item label="任务类型" label-width="80px">
                <el-select v-model="node.taskType" size="small" style="width:150px">
                  <el-option label="跟进" value="follow_up" />
                  <el-option label="复诊" value="recheck" />
                  <el-option label="关怀" value="care" />
                  <el-option label="营销" value="promotion" />
                </el-select>
              </el-form-item>
              <el-form-item label="话术模板" label-width="80px">
                <el-input v-model="node.messageTemplate" type="textarea" :rows="2" placeholder="AI生成关怀话术时参考的模板" />
              </el-form-item>
            </div>
          </div>
          <el-button type="primary" plain @click="addNode">+ 添加节点</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog title="SOP 模板详情" v-model="detailVisible" width="600px">
      <div v-if="currentTemplate">
        <p><strong>模板名称：</strong>{{ currentTemplate.name }}</p>
        <p><strong>适用项目：</strong>
          <el-tag v-for="pt in (currentTemplate.projectTypes || [])" :key="pt" size="small" style="margin:2px">{{ pt }}</el-tag>
          <span v-if="!currentTemplate.projectTypes?.length" style="color:#909399">-</span>
        </p>
        <p><strong>状态：</strong>
          <el-tag :type="currentTemplate.isActive ? 'success' : 'info'">
            {{ currentTemplate.isActive ? '启用' : '停用' }}
          </el-tag>
        </p>
        <div v-if="currentTemplate.nodes?.length" style="margin-top:16px">
          <h4>提醒节点</h4>
          <el-timeline style="margin-top:12px">
            <el-timeline-item
              v-for="(node, i) in currentTemplate.nodes"
              :key="i"
              :timestamp="`第 ${node.dayOffset} 天`"
              placement="top"
            >
              <el-tag size="small" style="margin-right:8px">{{ taskTypeMap[node.taskType] || node.taskType }}</el-tag>
              <p v-if="node.messageTemplate" style="color:#606266; margin-top:4px">{{ node.messageTemplate }}</p>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const templates = ref<any[]>([]);
const projectTypeOptions = ref<any[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const detailVisible = ref(false);
const isEdit = ref(false);
const editId = ref('');
const dialogTitle = ref('创建 SOP 模板');
const currentTemplate = ref<any>(null);
const form = ref({
  name: '',
  projectTypes: [] as string[],
  isActive: true,
  nodes: [] as any[],
});

const taskTypeMap: Record<string, string> = {
  follow_up: '跟进',
  recheck: '复诊',
  care: '关怀',
  promotion: '营销',
};

async function fetchData() {
  loading.value = true;
  const res: any = await request.get('/admin/sop-templates');
  templates.value = Array.isArray(res) ? res : [];
  loading.value = false;
}

async function fetchProjectTypes() {
  const res: any = await request.get('/admin/project-types/active');
  projectTypeOptions.value = Array.isArray(res) ? res : [];
}

function showCreateDialog() {
  isEdit.value = false;
  dialogTitle.value = '创建 SOP 模板';
  form.value = {
    name: '',
    projectTypes: [],
    isActive: true,
    nodes: [],
  };
  dialogVisible.value = true;
}

function showEditDialog(row: any) {
  isEdit.value = true;
  editId.value = row.id;
  dialogTitle.value = '编辑 SOP 模板';
  form.value = {
    name: row.name || '',
    projectTypes: row.projectTypes ? [...row.projectTypes] : [],
    isActive: row.isActive ?? true,
    nodes: row.nodes ? [...row.nodes] : [],
  };
  dialogVisible.value = true;
}

function viewDetail(row: any) {
  currentTemplate.value = row;
  detailVisible.value = true;
}

function addNode() {
  form.value.nodes.push({
    dayOffset: 7,
    taskType: 'care',
    messageTemplate: '',
  });
}

function removeProjectType(pt: string) {
  form.value.projectTypes = form.value.projectTypes.filter(p => p !== pt);
}

function toggleProjectType(pt: string) {
  const index = form.value.projectTypes.indexOf(pt);
  if (index === -1) {
    form.value.projectTypes.push(pt);
  } else {
    form.value.projectTypes.splice(index, 1);
  }
}

async function handleSubmit() {
  if (!form.value.name) {
    ElMessage.warning('请输入模板名称');
    return;
  }

  if (isEdit.value) {
    await request.put(`/admin/sop-templates/${editId.value}`, form.value);
  } else {
    await request.post('/admin/sop-templates', form.value);
  }
  ElMessage.success('操作成功');
  dialogVisible.value = false;
  fetchData();
}

async function handleDelete(id: string) {
  await request.delete(`/admin/sop-templates/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

onMounted(() => {
  fetchData();
  fetchProjectTypes();
});
</script>

<style scoped>
.node-item {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
}

.node-content {
  padding-left: 8px;
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
