<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

function handleKeydown(event: KeyboardEvent) {
  // ESC 键返回上一页
  if (event.key === 'Escape') {
    // 如果有弹窗打开，不处理（让弹窗自己处理关闭）
    const hasOpenDialog = document.querySelector('.el-dialog__wrapper[style*="display: block"]') ||
                          document.querySelector('.el-overlay:not([style*="display: none"])');
    if (hasOpenDialog) return;

    // 返回上一页
    if (window.history.length > 1) {
      router.back();
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>
