<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">系统设置</h2>
    </div>

    <!-- 个人信息 -->
    <div class="table-card">
      <h3>个人信息</h3>
      <el-descriptions :column="2" border style="margin-top:16px">
        <el-descriptions-item label="用户名">{{ authStore.user?.username }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ authStore.user?.realName }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag type="danger">管理员</el-tag>
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

    <!-- 项目类型管理 -->
    <div class="table-card">
      <div class="section-header">
        <h3>项目类型管理</h3>
        <el-button type="primary" size="small" @click="showAddProjectType">添加项目</el-button>
      </div>
      <p style="color:#909399; margin-top:8px; font-size:13px">管理机构提供的医美项目类型，用于SOP配置、策略模板等功能的下拉选择。</p>

      <div class="project-tags" style="margin-top:16px">
        <el-tag
          v-for="pt in projectTypes"
          :key="pt.id"
          :closable="true"
          :type="pt.isActive ? '' : 'info'"
          style="margin:4px"
          @close="handleDeleteProjectType(pt.id)"
          @click="showEditProjectType(pt)"
        >
          {{ pt.name }}
          <span v-if="pt.category" style="color:#909399; margin-left:4px">({{ pt.category }})</span>
        </el-tag>
        <span v-if="!projectTypes.length" style="color:#909399">暂无项目类型，请点击"添加项目"创建</span>
      </div>
    </div>

    <!-- 系统信息 -->
    <div class="table-card">
      <h3>系统信息</h3>
      <el-descriptions :column="2" border style="margin-top:16px">
        <el-descriptions-item label="系统名称">铜雀台医美 AI 智能管家</el-descriptions-item>
        <el-descriptions-item label="版本">v1.0.0</el-descriptions-item>
        <el-descriptions-item label="前端框架">Vue 3 + Element Plus</el-descriptions-item>
        <el-descriptions-item label="后端框架">NestJS + TypeORM</el-descriptions-item>
        <el-descriptions-item label="数据库">PostgreSQL</el-descriptions-item>
        <el-descriptions-item label="AI 引擎">DeepSeek API</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 快捷操作 -->
    <div class="table-card">
      <h3>快捷操作</h3>
      <div style="display:flex; gap:12px; margin-top:16px; flex-wrap:wrap">
        <el-button @click="$router.push('/admin/consultants')">管理咨询师</el-button>
        <el-button @click="$router.push('/admin/strategy-templates')">策略模板</el-button>
        <el-button @click="$router.push('/admin/sop-config')">SOP 配置</el-button>
        <el-button @click="$router.push('/admin/audit-logs')">操作日志</el-button>
      </div>
    </div>

    <!-- 添加/编辑项目类型弹窗 -->
    <el-dialog :title="isEditProjectType ? '编辑项目类型' : '添加项目类型'" v-model="projectTypeDialogVisible" width="400px">
      <el-form :model="projectTypeForm" label-width="80px">
        <el-form-item label="项目名称">
          <el-input v-model="projectTypeForm.name" placeholder="如：热玛吉" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="projectTypeForm.category" placeholder="选择分类" clearable style="width:100%">
            <el-option label="抗衰" value="抗衰" />
            <el-option label="塑形" value="塑形" />
            <el-option label="皮肤" value="皮肤" />
            <el-option label="微整" value="微整" />
            <el-option label="口腔" value="口腔" />
            <el-option label="眼部" value="眼部" />
            <el-option label="鼻部" value="鼻部" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="projectTypeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveProjectType">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import request from '@/api/request';

const authStore = useAuthStore();
const changing = ref(false);
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// 项目类型管理
const projectTypes = ref<any[]>([]);
const projectTypeDialogVisible = ref(false);
const isEditProjectType = ref(false);
const editProjectTypeId = ref('');
const projectTypeForm = reactive({
  name: '',
  category: '',
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

// 项目类型相关方法
async function fetchProjectTypes() {
  const res: any = await request.get('/admin/project-types');
  projectTypes.value = Array.isArray(res) ? res : [];
}

function showAddProjectType() {
  isEditProjectType.value = false;
  editProjectTypeId.value = '';
  projectTypeForm.name = '';
  projectTypeForm.category = '';
  projectTypeDialogVisible.value = true;
}

function showEditProjectType(pt: any) {
  isEditProjectType.value = true;
  editProjectTypeId.value = pt.id;
  projectTypeForm.name = pt.name;
  projectTypeForm.category = pt.category || '';
  projectTypeDialogVisible.value = true;
}

async function handleSaveProjectType() {
  if (!projectTypeForm.name.trim()) {
    ElMessage.warning('请输入项目名称');
    return;
  }

  if (isEditProjectType.value) {
    await request.put(`/admin/project-types/${editProjectTypeId.value}`, {
      name: projectTypeForm.name,
      category: projectTypeForm.category || undefined,
    });
    ElMessage.success('更新成功');
  } else {
    await request.post('/admin/project-types', {
      name: projectTypeForm.name,
      category: projectTypeForm.category || undefined,
    });
    ElMessage.success('添加成功');
  }

  projectTypeDialogVisible.value = false;
  fetchProjectTypes();
}

async function handleDeleteProjectType(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该项目类型？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await request.delete(`/admin/project-types/${id}`);
    ElMessage.success('删除成功');
    fetchProjectTypes();
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  fetchProjectTypes();
});
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.project-tags .el-tag {
  cursor: pointer;
}

.project-tags .el-tag:hover {
  opacity: 0.8;
}
</style>
