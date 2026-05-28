<template>
  <div class="page-container">
    <div class="page-header"><h2 class="page-title">话术库</h2></div>
    <div class="table-card">
      <el-input v-model="searchKeyword" placeholder="搜索话术..." style="width:300px; margin-bottom:12px" clearable />
      <el-table :data="filteredScripts" stripe v-loading="loading">
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="scenario" label="场景" width="150" />
        <el-table-column prop="script" label="话术内容" show-overflow-tooltip />
        <el-table-column prop="usageCount" label="使用次数" width="80" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="copyScript(row.script)">📋 复制</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const scripts = ref<any[]>([]);
const loading = ref(false);
const searchKeyword = ref('');

const filteredScripts = computed(() => {
  if (!searchKeyword.value) return scripts.value;
  const kw = searchKeyword.value.toLowerCase();
  return scripts.value.filter((s: any) =>
    s.category?.toLowerCase().includes(kw) ||
    s.scenario?.toLowerCase().includes(kw) ||
    s.script?.toLowerCase().includes(kw)
  );
});

function copyScript(text: string) {
  try { navigator.clipboard.writeText(text); ElMessage.success('已复制'); }
  catch { ElMessage.error('复制失败，请手动复制'); }
}

onMounted(async () => { loading.value = true; scripts.value = (await request.get('/scripts')) as any[]; loading.value = false; });
</script>
