<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">咨询师管理</h2>
      <el-button type="primary" @click="showCreateDialog">新增咨询师</el-button>
    </div>

    <div class="table-card">
      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索姓名/手机号..."
          clearable
          style="width: 240px"
          @clear="fetchData"
          @keyup.enter="fetchData"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 120px" @change="fetchData">
          <el-option label="在职" value="true" />
          <el-option label="已停用" value="false" />
        </el-select>
        <el-button type="primary" @click="fetchData">搜索</el-button>
      </div>

      <el-table :data="filteredConsultants" stripe v-loading="loading">
        <el-table-column prop="realName" label="姓名" width="100" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="speciality" label="擅长领域" width="180">
          <template #default="{ row }">
            <el-tag v-for="s in (row.speciality || [])" :key="s" size="small" style="margin-right:4px">{{ s }}</el-tag>
            <span v-if="!row.speciality?.length" style="color:#909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="customerCount" label="客户数" width="80" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-switch :model-value="row.isActive" @change="toggleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
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

      <!-- 统计信息 -->
      <div class="stats-bar">
        <span>总计: {{ consultants.length }}</span>
        <span>在职: {{ consultants.filter(c => c.isActive).length }}</span>
        <span>已停用: {{ consultants.filter(c => !c.isActive).length }}</span>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名" v-if="!isEdit">
          <el-input v-model="form.username" placeholder="登录用户名" />
        </el-form-item>
        <el-form-item label="密码" v-if="!isEdit">
          <el-input v-model="form.password" type="password" placeholder="初始密码" show-password />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.realName" placeholder="真实姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="手机号" />
        </el-form-item>
        <el-form-item label="工号">
          <el-input v-model="form.employeeNo" placeholder="工号（可选）" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="备注信息" />
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import request from '@/api/request';

const router = useRouter();
const consultants = ref<any[]>([]);
const loading = ref(false);
const keyword = ref('');
const statusFilter = ref('');
const dialogVisible = ref(false);
const isEdit = ref(false);
const editId = ref('');
const dialogTitle = ref('新增咨询师');

const form = ref({ username: '', password: '', realName: '', phone: '', employeeNo: '', notes: '' });

const filteredConsultants = computed(() => {
  return consultants.value.filter(c => {
    if (keyword.value) {
      const kw = keyword.value.toLowerCase();
      if (!c.realName?.toLowerCase().includes(kw) && !c.phone?.includes(kw)) return false;
    }
    if (statusFilter.value !== '') {
      if (c.isActive !== (statusFilter.value === 'true')) return false;
    }
    return true;
  });
});

async function fetchData() {
  loading.value = true;
  const res: any = await request.get('/admin/consultants');
  consultants.value = Array.isArray(res) ? res : [];
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
  if (!form.value.realName) {
    ElMessage.warning('请输入姓名');
    return;
  }
  if (isEdit.value) {
    await request.put(`/admin/consultants/${editId.value}`, form.value);
  } else {
    if (!form.value.username || !form.value.password) {
      ElMessage.warning('请输入用户名和密码');
      return;
    }
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

function goDetail(id: string) {
  router.push(`/admin/consultants/${id}`);
}

onMounted(fetchData);
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.stats-bar {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  color: #606266;
  font-size: 14px;
}
</style>
