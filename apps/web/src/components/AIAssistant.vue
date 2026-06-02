<template>
  <div class="ai-assistant">
    <!-- 悬浮按钮 -->
    <div class="ai-fab" @click="togglePanel" :class="{ active: panelVisible }">
      <el-icon :size="24"><ChatDotRound /></el-icon>
    </div>

    <!-- 面板 -->
    <div v-if="panelVisible" class="ai-panel">
      <div class="ai-header">
        <span>AI 助手</span>
        <el-icon @click="panelVisible = false" style="cursor:pointer"><Close /></el-icon>
      </div>

      <div class="ai-messages" ref="messagesRef">
        <div v-for="(msg, i) in messages" :key="i" :class="['ai-message', msg.role]">
          <div class="message-content">{{ msg.content }}</div>
        </div>
        <div v-if="loading" class="ai-message assistant">
          <div class="message-content">
            <el-icon class="is-loading"><Loading /></el-icon>
            思考中...
          </div>
        </div>
      </div>

      <div class="ai-input">
        <el-input
          v-model="inputText"
          placeholder="输入问题，如：帮我分析这个客户..."
          :rows="2"
          type="textarea"
          @keydown.enter.ctrl="sendMessage"
        />
        <el-button type="primary" @click="sendMessage" :loading="loading" :disabled="!inputText.trim()">
          发送 (Ctrl+Enter)
        </el-button>
      </div>

      <!-- 快捷操作 -->
      <div class="ai-shortcuts">
        <el-button size="small" @click="quickAction('分析客户')">分析客户</el-button>
        <el-button size="small" @click="quickAction('生成话术')">生成话术</el-button>
        <el-button size="small" @click="quickAction('跟进策略')">跟进策略</el-button>
        <el-button size="small" @click="quickAction('关怀文案')">关怀文案</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { ChatDotRound, Close, Loading } from '@element-plus/icons-vue';
import request from '@/api/request';

const panelVisible = ref(false);
const inputText = ref('');
const loading = ref(false);
const messagesRef = ref<HTMLElement | null>(null);
const messages = ref<Array<{ role: string; content: string }>>([
  { role: 'assistant', content: '你好！我是 AI 助手，可以帮你分析客户、生成话术、制定跟进策略。有什么可以帮你的？' }
]);

function togglePanel() {
  panelVisible.value = !panelVisible.value;
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || loading.value) return;

  messages.value.push({ role: 'user', content: text });
  inputText.value = '';
  loading.value = true;

  await nextTick();
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }

  try {
    const res: any = await request.post('/ai/chat', { message: text });
    messages.value.push({
      role: 'assistant',
      content: res?.response || '抱歉，我暂时无法回答这个问题。'
    });
  } catch {
    messages.value.push({
      role: 'assistant',
      content: '抱歉，服务暂时不可用，请稍后再试。'
    });
  }

  loading.value = false;
  await nextTick();
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
}

function quickAction(action: string) {
  inputText.value = action + '：';
}
</script>

<style scoped>
.ai-assistant {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
}

.ai-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transition: all 0.3s;
}

.ai-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.5);
}

.ai-fab.active {
  background: #f56c6c;
}

.ai-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 360px;
  height: 480px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #409eff;
  color: #fff;
  font-weight: 600;
}

.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.ai-message {
  margin-bottom: 12px;
}

.ai-message.user {
  text-align: right;
}

.ai-message.user .message-content {
  background: #409eff;
  color: #fff;
  display: inline-block;
  padding: 8px 12px;
  border-radius: 12px 12px 0 12px;
  max-width: 80%;
  text-align: left;
}

.ai-message.assistant .message-content {
  background: #f5f7fa;
  color: #303133;
  display: inline-block;
  padding: 8px 12px;
  border-radius: 12px 12px 12px 0;
  max-width: 80%;
  text-align: left;
}

.ai-input {
  padding: 12px;
  border-top: 1px solid #eee;
}

.ai-input .el-button {
  margin-top: 8px;
  width: 100%;
}

.ai-shortcuts {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-top: 1px solid #eee;
  flex-wrap: wrap;
}
</style>
