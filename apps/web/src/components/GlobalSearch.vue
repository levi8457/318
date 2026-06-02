<template>
  <div class="global-search">
    <el-input
      v-model="keyword"
      placeholder="搜索客户、会话、话术、任务..."
      clearable
      style="width: 300px"
      @input="handleSearch"
      @focus="showPanel = true"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>

    <!-- 搜索结果面板 -->
    <div v-if="showPanel && keyword" class="search-panel" @click.stop>
      <div v-if="loading" class="search-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>搜索中...</span>
      </div>

      <template v-else>
        <!-- 客户结果 -->
        <div v-if="results.customers?.length" class="result-section">
          <div class="section-title">客户</div>
          <div
            v-for="item in results.customers"
            :key="item.id"
            class="result-item"
            @click="goTo(`/customers/${item.id}`)"
          >
            <span class="result-name">{{ item.name }}</span>
            <span class="result-info">{{ item.phone }}</span>
          </div>
        </div>

        <!-- 会话结果 -->
        <div v-if="results.sessions?.length" class="result-section">
          <div class="section-title">会话</div>
          <div
            v-for="item in results.sessions"
            :key="item.id"
            class="result-item"
            @click="goTo(`/sessions/${item.id}`)"
          >
            <span class="result-name">{{ item.customerName || '-' }}</span>
            <span class="result-info">{{ item.summary }}</span>
          </div>
        </div>

        <!-- 话术结果 -->
        <div v-if="results.scripts?.length" class="result-section">
          <div class="section-title">话术</div>
          <div
            v-for="item in results.scripts"
            :key="item.id"
            class="result-item"
            @click="showScriptDetail(item)"
          >
            <span class="result-name">{{ item.scenario }}</span>
            <span class="result-info">{{ item.script }}</span>
          </div>
        </div>

        <!-- 任务结果 -->
        <div v-if="results.tasks?.length" class="result-section">
          <div class="section-title">任务</div>
          <div
            v-for="item in results.tasks"
            :key="item.id"
            class="result-item"
            @click="goTo(`/tasks`)"
          >
            <span class="result-name">{{ item.title }}</span>
            <span class="result-info">{{ item.customerName }}</span>
          </div>
        </div>

        <!-- 无结果 -->
        <div v-if="noResults" class="no-results">
          未找到相关结果
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Loading } from '@element-plus/icons-vue';
import request from '@/api/request';

const router = useRouter();
const keyword = ref('');
const showPanel = ref(false);
const loading = ref(false);
const results = ref<any>({});
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const noResults = computed(() => {
  return !loading.value &&
    (!results.value.customers?.length) &&
    (!results.value.sessions?.length) &&
    (!results.value.scripts?.length) &&
    (!results.value.tasks?.length);
});

function handleSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  if (!keyword.value.trim()) {
    results.value = {};
    return;
  }
  searchTimer = setTimeout(async () => {
    loading.value = true;
    try {
      const res: any = await request.get('/search', { params: { keyword: keyword.value } });
      results.value = res || {};
    } catch {
      results.value = {};
    }
    loading.value = false;
  }, 300);
}

function goTo(path: string) {
  showPanel.value = false;
  keyword.value = '';
  router.push(path);
}

function showScriptDetail(item: any) {
  showPanel.value = false;
  // Could open a dialog or navigate
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.global-search')) {
    showPanel.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.global-search {
  position: relative;
}

.search-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
}

.search-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: #909399;
}

.result-section {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.result-section:last-child {
  border-bottom: none;
}

.section-title {
  padding: 4px 16px;
  font-size: 12px;
  color: #909399;
  font-weight: 600;
  text-transform: uppercase;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.result-item:hover {
  background-color: #f5f7fa;
}

.result-name {
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
}

.result-info {
  color: #909399;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-results {
  padding: 24px;
  text-align: center;
  color: #909399;
}
</style>
