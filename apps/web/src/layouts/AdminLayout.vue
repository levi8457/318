<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="layout-aside">
      <div class="logo">铜雀台 AI 管家</div>
      <el-menu :default-active="activeMenu" router background-color="#304156" text-color="#bfcbd9" active-text-color="#409eff">
        <el-menu-item index="/admin/dashboard">
          <span>📊 仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/admin/consultants">
          <span>👨‍💼 咨询师管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/strategy-templates">
          <span>📋 策略模板</span>
        </el-menu-item>
        <el-menu-item index="/admin/sop-config">
          <span>⚙️ SOP 配置</span>
        </el-menu-item>
        <el-menu-item index="/admin/customers">
          <span>👥 全部客户</span>
        </el-menu-item>
        <el-menu-item index="/admin/sessions">
          <span>📞 全部会话</span>
        </el-menu-item>
        <el-menu-item index="/admin/tasks">
          <span>📋 全部任务</span>
        </el-menu-item>
        <el-menu-item index="/admin/scripts">
          <span>💬 话术库管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/campaigns">
          <span>📢 营销中心</span>
        </el-menu-item>
        <el-menu-item index="/admin/settings">
          <span>⚙️ 系统设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <span class="header-title">管理员工作台</span>
        <div class="header-right">
          <span class="header-user">{{ authStore.user?.realName }}</span>
          <el-button text @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const activeMenu = computed(() => route.path);

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.layout-container { height: 100vh; }
.layout-aside { background: #304156; overflow-y: auto; }
.logo { color: #fff; font-size: 18px; font-weight: 600; text-align: center; padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
.layout-header { background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.header-title { font-size: 16px; font-weight: 500; }
.header-right { display: flex; align-items: center; gap: 12px; }
.header-user { color: #606266; }
.layout-main { background: #f5f7fa; padding: 20px; }
</style>
