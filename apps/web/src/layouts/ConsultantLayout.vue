<template>
  <el-container class="layout-container">
    <!-- 移动端遮罩 -->
    <div v-if="sidebarVisible" class="sidebar-overlay" @click="sidebarVisible = false" />

    <!-- 侧边栏 -->
    <el-aside :width="sidebarWidth" class="layout-aside" :class="{ 'mobile-visible': sidebarVisible }">
      <div class="logo">铜雀台 AI 管家</div>
      <el-menu :default-active="activeMenu" router background-color="#304156" text-color="#bfcbd9" active-text-color="#409eff" @select="handleMenuSelect">
        <el-menu-item index="/dashboard">
          <span>📊 仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/customers">
          <span>👥 我的客户</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/sessions">
          <span>📞 我的会话</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/tasks">
          <span>📋 我的任务</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/follow-up-plans">
          <span>🎯 跟进策略</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/scripts">
          <span>💬 话术库</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/campaigns">
          <span>📢 营销执行</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/settings">
          <span>⚙️ 个人设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="menu-toggle" @click="sidebarVisible = !sidebarVisible"><Menu /></el-icon>
          <span class="header-title">咨询师工作台</span>
        </div>
        <div class="header-right">
          <GlobalSearch />
          <NotificationBell />
          <span class="header-user">{{ authStore.user?.realName }}</span>
          <el-button text @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
      <AIAssistant />
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Menu } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import NotificationBell from '@/components/NotificationBell.vue';
import GlobalSearch from '@/components/GlobalSearch.vue';
import AIAssistant from '@/components/AIAssistant.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const sidebarVisible = ref(false);

const activeMenu = computed(() => route.path);
const sidebarWidth = computed(() => '200px');

function handleMenuSelect() {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    sidebarVisible.value = false;
  }
}

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  position: relative;
}

.layout-aside {
  background: #304156;
  overflow-y: auto;
  transition: transform 0.3s;
}

.logo {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.layout-header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-toggle {
  display: none;
  cursor: pointer;
  font-size: 20px;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-user {
  color: #606266;
}

.layout-main {
  background: #f5f7fa;
  padding: 20px;
}

.sidebar-overlay {
  display: none;
}

@media (max-width: 768px) {
  .layout-aside {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    transform: translateX(-100%);
  }

  .layout-aside.mobile-visible {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .menu-toggle {
    display: block;
  }

  .header-title {
    font-size: 14px;
  }

  .header-user {
    display: none;
  }

  .layout-main {
    padding: 12px;
  }
}
</style>
