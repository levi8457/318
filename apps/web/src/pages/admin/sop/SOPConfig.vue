<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">SOP 模板配置</h2>
      <el-button type="primary" @click="showCreateDialog">创建 SOP 模板</el-button>
    </div>
    <div class="table-card">
      <el-table :data="templates" stripe v-loading="loading">
        <el-table-column prop="name" label="模板名称" />
        <el-table-column prop="projectType" label="适用项目" width="120" />
        <el-table-column prop="isActive" label="启用" width="80">
          <template #default="{ row }"><el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '是' : '否' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="showEditDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除？" @confirm="handleDelete(row.id)">
              <template #reference><el-button size="small" type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="模板名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="项目类型"><el-input v-model="form.projectType" placeholder="如：热玛吉" /></el-form-item>
        <el-form-item label="提醒节点">
          <div v-for="(node, i) in form.nodes" :key="i" style="display:flex; gap:8px; margin-bottom:8px">
            <el-input-number v-model="node.dayOffset" :min="0" size="small" style="width:80px" />
            <el-input v-model="node.taskType" placeholder="任务类型" size="small" style="width:100px" />
            <el-input v-model="node.messageTemplate" placeholder="话术模板" size="small" style="flex:1" />
            <el-button size="small" @click="form.nodes.splice(i,1)">删除</el-button>
          </div>
          <el-button size="small" @click="form.nodes.push({dayOffset:7,taskType:'care',messageTemplate:''})">+ 添加节点</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const templates = ref<any[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const editId = ref('');
const dialogTitle = ref('创建 SOP 模板');
const form = ref({ name: '', projectType: '', nodes: [] as any[] });

async function fetchData() {
  loading.value = true;
  templates.value = (await request.get('/admin/sop-templates')) as any[];
  loading.value = false;
}

function showCreateDialog() {
  isEdit.value = false; dialogTitle.value = '创建 SOP 模板';
  form.value = { name: '', projectType: '', nodes: [] };
  dialogVisible.value = true;
}

function showEditDialog(row: any) {
  isEdit.value = true; editId.value = row.id; dialogTitle.value = '编辑 SOP 模板';
  form.value = { ...row };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (isEdit.value) await request.put(`/admin/sop-templates/${editId.value}`, form.value);
  else await request.post('/admin/sop-templates', form.value);
  ElMessage.success('操作成功'); dialogVisible.value = false; fetchData();
}

async function handleDelete(id: string) {
  await request.delete(`/admin/sop-templates/${id}`);
  ElMessage.success('删除成功'); fetchData();
}

onMounted(fetchData);
</script>
