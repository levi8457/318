<template>
  <div class="page-container">
    <div class="page-header">
      <el-button @click="$router.back()">返回</el-button>
      <h2 class="page-title" style="display:inline; margin-left:12px">{{ consultant?.realName }} - 详情</h2>
    </div>
    <div class="card-grid" v-if="consultant">
      <div class="stat-card"><div class="stat-label">工号</div><div class="stat-value" style="font-size:18px">{{ consultant.employeeNo || '-' }}</div></div>
      <div class="stat-card"><div class="stat-label">客户数</div><div class="stat-value">{{ consultant.customerCount }}</div></div>
      <div class="stat-card"><div class="stat-label">擅长领域</div><div><el-tag v-for="s in consultant.speciality" :key="s" size="small" style="margin-right:4px">{{ s }}</el-tag></div></div>
      <div class="stat-card"><div class="stat-label">状态</div><div class="stat-value" style="font-size:18px">{{ consultant.isActive ? '在职' : '已停用' }}</div></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import request from '@/api/request';

const route = useRoute();
const consultant = ref<any>(null);

onMounted(async () => {
  consultant.value = await request.get(`/admin/consultants/${route.params.id}`);
});
</script>
