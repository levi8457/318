<template>
  <div class="ai-assistant">
    <!-- 悬浮按钮 -->
    <div class="ai-fab" @click="togglePanel" :class="{ active: panelVisible }">
      <el-icon :size="24"><ChatDotRound /></el-icon>
      <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
    </div>

    <!-- 面板 -->
    <div v-if="panelVisible" class="ai-panel">
      <div class="ai-header">
        <div class="header-left">
          <span class="header-title">铜雀台智囊</span>
          <el-tag size="small" type="success">AI</el-tag>
        </div>
        <div class="header-actions">
          <el-icon @click="clearHistory" style="cursor:pointer" title="清空对话"><Delete /></el-icon>
          <el-icon @click="panelVisible = false" style="cursor:pointer"><Close /></el-icon>
        </div>
      </div>

      <div class="ai-messages" ref="messagesRef">
        <div v-for="(msg, i) in messages" :key="i" :class="['ai-message', msg.role]">
          <div class="message-avatar" v-if="msg.role === 'assistant'">AI</div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(msg.content)"></div>
            <div class="message-time">{{ formatTime(msg.createdAt) }}</div>
          </div>
        </div>
        <div v-if="loading" class="ai-message assistant">
          <div class="message-avatar">AI</div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="ai-input">
        <el-input
          v-model="inputText"
          placeholder="问我任何医美相关问题..."
          :rows="2"
          type="textarea"
          @keydown.enter.ctrl="sendMessage"
          @keydown.enter.meta="sendMessage"
        />
        <div class="input-footer">
          <span class="input-hint">Ctrl+Enter 发送</span>
          <el-button type="primary" @click="sendMessage" :loading="loading" :disabled="!inputText.trim()">
            发送
          </el-button>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="ai-shortcuts">
        <el-button size="small" @click="quickAsk('如何应对客户说贵？')">价格异议</el-button>
        <el-button size="small" @click="quickAsk('客户怕疼怎么安抚？')">疼痛顾虑</el-button>
        <el-button size="small" @click="quickAsk('如何提升转化率？')">转化技巧</el-button>
        <el-button size="small" @click="quickAsk('术后关怀话术')">术后关怀</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { ChatDotRound, Close, Delete } from '@element-plus/icons-vue';
import request from '@/api/request';

const panelVisible = ref(false);
const inputText = ref('');
const loading = ref(false);
const messagesRef = ref<HTMLElement | null>(null);
const unreadCount = ref(0);
const messages = ref<Array<{ role: string; content: string; createdAt?: string }>>([]);

function togglePanel() {
  panelVisible.value = !panelVisible.value;
  if (panelVisible.value) {
    unreadCount.value = 0;
    loadHistory();
  }
}

async function loadHistory() {
  try {
    const res: any = await request.get('/ai/history');
    if (res && Array.isArray(res) && res.length > 0) {
      messages.value = res.map((m: any) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      }));
    } else if (messages.value.length === 0) {
      messages.value = [{
        role: 'assistant',
        content: '你好！我是铜雀台智囊，你的医美咨询 AI 助手。\n\n我可以帮你：\n- 分析客户需求和卡点\n- 生成个性化跟进话术\n- 解答医美项目知识\n- 提供营销策略建议\n\n有什么可以帮你的？',
        createdAt: new Date().toISOString(),
      }];
    }
  } catch {
    if (messages.value.length === 0) {
      messages.value = [{
        role: 'assistant',
        content: '你好！我是铜雀台智囊，你的医美咨询 AI 助手。有什么可以帮你的？',
        createdAt: new Date().toISOString(),
      }];
    }
  }
  scrollToBottom();
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || loading.value) return;

  messages.value.push({ role: 'user', content: text, createdAt: new Date().toISOString() });
  inputText.value = '';
  loading.value = true;

  await nextTick();
  scrollToBottom();

  try {
    const res: any = await request.post('/ai/chat', { message: text });
    messages.value.push({
      role: 'assistant',
      content: res?.response || '抱歉，我暂时无法回答这个问题。',
      createdAt: new Date().toISOString(),
    });
  } catch {
    messages.value.push({
      role: 'assistant',
      content: '抱歉，服务暂时不可用，请稍后再试。',
      createdAt: new Date().toISOString(),
    });
  }

  loading.value = false;
  await nextTick();
  scrollToBottom();
}

function quickAsk(question: string) {
  inputText.value = question;
  sendMessage();
}

async function clearHistory() {
  try {
    await request.delete('/ai/history');
    messages.value = [{
      role: 'assistant',
      content: '对话已清空。有什么可以帮你的？',
      createdAt: new Date().toISOString(),
    }];
  } catch {
    // ignore
  }
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
}

function formatMessage(content: string): string {
  // 简单的 markdown 转换
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

onMounted(() => {
  loadHistory();
});
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
  position: relative;
}

.ai-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.ai-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 400px;
  height: 560px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-weight: 600;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.ai-message {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}

.ai-message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.message-content {
  max-width: 80%;
}

.message-text {
  padding: 10px 14px;
  border-radius: 12px;
  line-height: 1.5;
  font-size: 14px;
}

.ai-message.user .message-text {
  background: #667eea;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.ai-message.assistant .message-text {
  background: #f5f7fa;
  color: #1d1d1f;
  border-bottom-left-radius: 4px;
}

.message-time {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.ai-message.user .message-time {
  text-align: right;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 14px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #909399;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}

.ai-input {
  padding: 12px 16px;
  border-top: 1px solid #eee;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.input-hint {
  font-size: 12px;
  color: #909399;
}

.ai-shortcuts {
  display: flex;
  gap: 6px;
  padding: 8px 16px;
  border-top: 1px solid #eee;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .ai-panel {
    width: calc(100vw - 32px);
    height: calc(100vh - 120px);
    right: 16px;
    bottom: 70px;
  }
}
</style>
