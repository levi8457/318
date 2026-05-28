<template>
  <div class="page-container">
    <div class="page-header"><h2 class="page-title">系统设置</h2></div>
    <div class="table-card">
      <el-form label-width="120px" style="max-width:500px">
        <el-form-item label="当前用户">{{ authStore.user?.realName }}</el-form-item>
        <el-form-item label="角色">管理员</el-form-item>
        <el-form-item label="修改密码">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="原密码" style="margin-bottom:8px" />
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="新密码" />
        </el-form-item>
        <el-form-item><el-button type="primary" @click="changePassword">修改密码</el-button></el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import request from '@/api/request';

const authStore = useAuthStore();
const passwordForm = reactive({ oldPassword: '', newPassword: '' });

async function changePassword() {
  await request.put('/auth/password', passwordForm);
  ElMessage.success('密码修改成功');
  passwordForm.oldPassword = ''; passwordForm.newPassword = '';
}
</script>
