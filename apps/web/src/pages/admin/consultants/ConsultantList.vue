<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">咨询师管理</h2>
      <el-button type="primary" @click="showCreateDialog">新增咨询师</el-button>
    </div>
    <div class="table-card">
      <el-table :data="consultants" stripe v-loading="loading">
        <el-table-column prop="realName" label="姓名" width="100" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="speciality" label="擅长领域" width="180">
          <template #default="{ row }"><el-tag v-for="s in row.speciality" :key="s" size="small" style="margin-right:4px">{{ s }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="customerCount" label="客户数" width="80" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-switch :model-value="row.isActive" @change="toggleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button size="small" @click="showEditDialog(row)">编辑</el-button>
            <el-button size="small" @click="goDetail(row.id)">详情</el-button>
            <el-button size="small" type="warning" @click="resetPassword(row)">重置密码</el-button>
            <el-popconfirm title="确定删除该咨询师？" @confirm="handleDelete(row.id)">
              <template #reference><el-button size="small" type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名" v-if="!isEdit"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="密码" v-if="!isEdit"><el-input v-model="form.password" type="password" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.realName" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="工号"><el-input v-model="form.employeeNo" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.notes" type="textarea" /></el-form-item>
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
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const router = useRouter();
const consultants = ref<any[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const editId = ref('');
const dialogTitle = ref('新增咨询师');

const form = ref({ username: '', password: '', realName: '', phone: '', employeeNo: '', notes: '' });

async function fetchData() {
  loading.value = true;
  consultants.value = (await request.get('/admin/consultants')) as any[];
  loading.value = false;
}

function showCreateDialog() {
  isEdit.value = false;
  dialogTitle.value = '新增咨询师';
  form.value = { username: '', password: '123456', realName: '', phone: '', employeeNo: '', notes: '' };
  dialogVisible.value = true;
}

function showEditDialog(row: any) {
  isEdit.value = true;
  editId.value = row.id;
  dialogTitle.value = '编辑咨询师';
  form.value = { username: '', password: '', realName: row.realName, phone: row.phone, employeeNo: row.employeeNo, notes: row.notes };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (isEdit.value) {
    await request.put(`/admin/consultants/${editId.value}`, form.value);
  } else {
    await request.post('/admin/consultants', form.value);
  }
  ElMessage.success(isEdit.value ? '编辑成功' : '新增成功');
  dialogVisible.value = false;
  fetchData();
}

async function handleDelete(id: string) {
  await request.delete(`/admin/consultants/${id}`);
  ElMessage.success('删除成功');
  fetchData();
}

async function toggleStatus(row: any) {
  await request.put(`/admin/consultants/${row.id}/status`);
  fetchData();
}

async function resetPassword(row: any) {
  await request.post(`/admin/consultants/${row.id}/reset-password`, { newPassword: '123456' });
  ElMessage.success('密码已重置为 123456');
}

function goDetail(id: string) { router.push(`/admin/consultants/${id}`); }

onMounted(fetchData);
</script>
