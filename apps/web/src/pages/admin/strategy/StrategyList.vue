<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">策略模板管理</h2>
      <el-button type="primary" @click="showCreateDialog">创建模板</el-button>
    </div>
    <div class="table-card">
      <el-table :data="templates" stripe v-loading="loading">
        <el-table-column prop="name" label="模板名称" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-switch :model-value="row.isActive" @change="toggleStatus(row.id)" />
          </template>
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
        <el-form-item label="分类"><el-input v-model="form.category" placeholder="如：术后跟进/术前沟通" /></el-form-item>
        <el-form-item label="适用项目类型">
          <el-select v-model="form.applicableProjectTypes" multiple placeholder="选择项目类型" style="width:100%">
            <el-option label="抗衰" value="抗衰" /><el-option label="塑形" value="塑形" />
            <el-option label="皮肤" value="皮肤" /><el-option label="微整" value="微整" />
          </el-select>
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
const dialogTitle = ref('创建模板');
const form = ref({ name: '', category: '', applicableProjectTypes: [], applicableBlockerTypes: [], steps: [] });

async function fetchData() {
  loading.value = true;
  templates.value = (await request.get('/admin/strategy-templates')) as any[];
  loading.value = false;
}

function showCreateDialog() {
  isEdit.value = false; dialogTitle.value = '创建模板';
  form.value = { name: '', category: '', applicableProjectTypes: [], applicableBlockerTypes: [], steps: [] };
  dialogVisible.value = true;
}

function showEditDialog(row: any) {
  isEdit.value = true; editId.value = row.id; dialogTitle.value = '编辑模板';
  form.value = { ...row };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (isEdit.value) await request.put(`/admin/strategy-templates/${editId.value}`, form.value);
  else await request.post('/admin/strategy-templates', form.value);
  ElMessage.success('操作成功'); dialogVisible.value = false; fetchData();
}

async function handleDelete(id: string) {
  await request.delete(`/admin/strategy-templates/${id}`);
  ElMessage.success('删除成功'); fetchData();
}

async function toggleStatus(id: string) {
  await request.put(`/admin/strategy-templates/${id}/status`);
  fetchData();
}

onMounted(fetchData);
</script>
