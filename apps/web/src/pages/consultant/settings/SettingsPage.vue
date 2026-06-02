<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">个人设置</h2>
    </div>

    <!-- 个人信息 -->
    <div class="table-card">
      <h3>个人信息</h3>
      <el-descriptions :column="2" border style="margin-top:16px">
        <el-descriptions-item label="用户名">{{ authStore.user?.username }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ authStore.user?.realName }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag type="primary">咨询师</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="手机号">{{ authStore.user?.phone || '-' }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 修改密码 -->
    <div class="table-card">
      <h3>修改密码</h3>
      <el-form :model="passwordForm" label-width="100px" style="max-width:500px; margin-top:16px">
        <el-form-item label="原密码">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码（至少6位）" show-password />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="changePassword" :loading="changing">修改密码</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 快捷操作 -->
    <div class="table-card">
      <h3>快捷操作</h3>
      <div style="display:flex; gap:12px; margin-top:16px; flex-wrap:wrap">
        <el-button @click="$router.push('/customers')">我的客户</el-button>
        <el-button @click="$router.push('/sessions')">我的会话</el-button>
        <el-button @click="$router.push('/tasks')">我的任务</el-button>
        <el-button @click="$router.push('/scripts')">话术库</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import request from '@/api/request';

const authStore = useAuthStore();
const changing = ref(false);
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

async function changePassword() {
  if (!passwordForm.oldPassword) {
    ElMessage.warning('请输入原密码');
    return;
  }
  if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
    ElMessage.warning('新密码至少6位');
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致');
    return;
  }

  changing.value = true;
  try {
    await request.put('/auth/password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
    ElMessage.success('密码修改成功');
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
  } catch (err: any) {
    ElMessage.error(err?.message || '修改失败');
  }
  changing.value = false;
}
</script>
