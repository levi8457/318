<template>
  <div class="landing-page">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="logo">
          <span class="logo-icon">✦</span>
          <span class="logo-text">铜雀台</span>
        </div>
        <div class="nav-links" :class="{ active: mobileMenuOpen }">
          <a href="#features">功能</a>
          <a href="#pricing">定价</a>
          <a href="#contact">联系我们</a>
          <a href="/login" class="nav-login">登录</a>
        </div>
        <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>

    <!-- Hero 区域 -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">AI 驱动的医美智能管家</div>
        <h1>让每一位咨询师<br>都拥有<span class="highlight">顶级顾问</span>的智慧</h1>
        <p class="hero-desc">
          铜雀台 AI 智能管家，专为医美机构打造的客户资产与策略管理中枢。
          AI 自动分析面诊、生成跟进策略、沉淀金牌话术，让转化率提升 40%。
        </p>
        <div class="hero-actions">
          <a href="#contact" class="btn-primary">免费试用 14 天</a>
          <a href="#features" class="btn-secondary">了解更多</a>
        </div>
        <div class="hero-stats">
          <div class="stat">
            <span class="stat-number">40%</span>
            <span class="stat-label">转化率提升</span>
          </div>
          <div class="stat">
            <span class="stat-number">3x</span>
            <span class="stat-label">跟进效率</span>
          </div>
          <div class="stat">
            <span class="stat-number">90%</span>
            <span class="stat-label">客户满意度</span>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="dashboard-preview">
          <div class="preview-header">
            <div class="preview-dots">
              <span></span><span></span><span></span>
            </div>
            <span class="preview-title">铜雀台 AI 智能管家</span>
          </div>
          <div class="preview-content">
            <div class="preview-sidebar">
              <div class="sidebar-item active">📊 仪表盘</div>
              <div class="sidebar-item">👥 我的客户</div>
              <div class="sidebar-item">📞 我的会话</div>
              <div class="sidebar-item">📋 我的任务</div>
              <div class="sidebar-item">💬 话术库</div>
            </div>
            <div class="preview-main">
              <div class="preview-cards">
                <div class="mini-card">
                  <div class="mini-value">128</div>
                  <div class="mini-label">我的客户</div>
                </div>
                <div class="mini-card">
                  <div class="mini-value">12</div>
                  <div class="mini-label">今日待办</div>
                </div>
                <div class="mini-card">
                  <div class="mini-value">89%</div>
                  <div class="mini-label">完成率</div>
                </div>
              </div>
              <div class="preview-chart">
                <div class="chart-bar" style="height: 60%"></div>
                <div class="chart-bar" style="height: 80%"></div>
                <div class="chart-bar" style="height: 45%"></div>
                <div class="chart-bar" style="height: 90%"></div>
                <div class="chart-bar" style="height: 70%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 核心功能 -->
    <section id="features" class="features">
      <div class="section-container">
        <div class="section-header">
          <h2>专为医美机构设计的<span class="highlight">智能中枢</span></h2>
          <p>覆盖从面诊到复购的完整客户生命周期</p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🧠</div>
            <h3>AI 面诊分析</h3>
            <p>上传面诊录音，AI 自动转写、提取关键诉求、识别客户卡点，生成个性化跟进策略。</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>精准客户画像</h3>
            <p>动态标签、私人备忘、历史项目时间轴，让每位客户都被"记住"，提供 VIP 级服务体验。</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📋</div>
            <h3>SOP 自动执行</h3>
            <p>术后关怀、复诊提醒、生日祝福，系统自动生成任务并推送，不错过任何跟进时机。</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">💬</div>
            <h3>金牌话术库</h3>
            <p>AI 自动提炼高转化话术，管理员审核入库，团队共享最佳实践，新人快速上手。</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📢</div>
            <h3>精准营销</h3>
            <p>新品上市、促销活动时，AI 智能匹配目标客户，生成个性化邀约话术，告别群发骚扰。</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>管理驾驶舱</h3>
            <p>全局业务数据、咨询师业绩排行、转化漏斗分析，让管理决策有据可依。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 工作流程 -->
    <section class="workflow">
      <div class="section-container">
        <div class="section-header">
          <h2>三步开启<span class="highlight">智能咨询</span></h2>
        </div>

        <div class="steps">
          <div class="step">
            <div class="step-number">01</div>
            <h3>面诊录音</h3>
            <p>咨询师上传面诊录音或手动输入转写文本</p>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-number">02</div>
            <h3>AI 分析</h3>
            <p>AI 自动分析客户需求、卡点，生成跟进策略</p>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-number">03</div>
            <h3>智能跟进</h3>
            <p>系统自动安排任务提醒，推送关怀话术</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 定价 -->
    <section id="pricing" class="pricing">
      <div class="section-container">
        <div class="section-header">
          <h2>简单透明的<span class="highlight">定价方案</span></h2>
          <p>14 天免费试用，无需信用卡</p>
        </div>

        <div class="pricing-grid">
          <div class="pricing-card">
            <div class="pricing-header">
              <h3>基础版</h3>
              <div class="pricing-price">
                <span class="price">¥2,980</span>
                <span class="period">/月</span>
              </div>
            </div>
            <ul class="pricing-features">
              <li>✓ 最多 3 名咨询师</li>
              <li>✓ 客户管理</li>
              <li>✓ 任务提醒</li>
              <li>✓ 基础报表</li>
              <li class="disabled">✗ AI 分析</li>
              <li class="disabled">✗ 话术库</li>
            </ul>
            <a href="#contact" class="btn-outline">开始试用</a>
          </div>

          <div class="pricing-card featured">
            <div class="pricing-badge">推荐</div>
            <div class="pricing-header">
              <h3>专业版</h3>
              <div class="pricing-price">
                <span class="price">¥5,980</span>
                <span class="period">/月</span>
              </div>
            </div>
            <ul class="pricing-features">
              <li>✓ 最多 10 名咨询师</li>
              <li>✓ 全部基础功能</li>
              <li>✓ AI 面诊分析</li>
              <li>✓ AI 跟进策略</li>
              <li>✓ 话术库</li>
              <li>✓ 策略模板</li>
            </ul>
            <a href="#contact" class="btn-primary">开始试用</a>
          </div>

          <div class="pricing-card">
            <div class="pricing-header">
              <h3>旗舰版</h3>
              <div class="pricing-price">
                <span class="price">¥9,980</span>
                <span class="period">/月</span>
              </div>
            </div>
            <ul class="pricing-features">
              <li>✓ 不限咨询师数量</li>
              <li>✓ 全部专业版功能</li>
              <li>✓ 精准营销</li>
              <li>✓ 高级报表</li>
              <li>✓ API 对接</li>
              <li>✓ 专属客服</li>
            </ul>
            <a href="#contact" class="btn-outline">联系我们</a>
          </div>
        </div>
      </div>
    </section>

    <!-- 留资表单 -->
    <section id="contact" class="contact">
      <div class="section-container">
        <div class="contact-wrapper">
          <div class="contact-info">
            <h2>开启您的<span class="highlight">智能医美</span>之旅</h2>
            <p>填写信息，我们的顾问将在 24 小时内联系您，为您安排专属演示。</p>
            <div class="contact-features">
              <div class="contact-feature">
                <span class="cf-icon">🎯</span>
                <span>14 天免费试用</span>
              </div>
              <div class="contact-feature">
                <span class="cf-icon">💡</span>
                <span>专属顾问一对一演示</span>
              </div>
              <div class="contact-feature">
                <span class="cf-icon">🚀</span>
                <span>当天即可开通</span>
              </div>
            </div>
          </div>

          <form class="contact-form" @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>姓名 *</label>
              <input v-model="form.name" type="text" placeholder="您的姓名" required />
            </div>
            <div class="form-group">
              <label>手机号 *</label>
              <input v-model="form.phone" type="tel" placeholder="您的手机号" required />
            </div>
            <div class="form-group">
              <label>机构名称</label>
              <input v-model="form.company" type="text" placeholder="您的机构名称" />
            </div>
            <div class="form-group">
              <label>咨询师人数</label>
              <select v-model="form.teamSize">
                <option value="">请选择</option>
                <option value="1-3">1-3 人</option>
                <option value="4-10">4-10 人</option>
                <option value="10+">10 人以上</option>
              </select>
            </div>
            <button type="submit" class="btn-submit" :disabled="submitting">
              {{ submitting ? '提交中...' : '免费试用 14 天' }}
            </button>
            <p class="form-note">提交即表示同意我们的服务条款和隐私政策</p>
          </form>
        </div>
      </div>
    </section>

    <!-- 底部 -->
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-brand">
          <div class="logo">
            <span class="logo-icon">✦</span>
            <span class="logo-text">铜雀台</span>
          </div>
          <p>AI 驱动的医美智能管家</p>
        </div>
        <div class="footer-links">
          <div class="footer-col">
            <h4>产品</h4>
            <a href="#features">功能介绍</a>
            <a href="#pricing">定价方案</a>
            <a href="/login">登录系统</a>
          </div>
          <div class="footer-col">
            <h4>支持</h4>
            <a href="#contact">联系我们</a>
            <a href="#">帮助中心</a>
            <a href="#">API 文档</a>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 铜雀台医美 AI 智能管家. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import request from '@/api/request';

const mobileMenuOpen = ref(false);
const submitting = ref(false);
const form = ref({
  name: '',
  phone: '',
  company: '',
  teamSize: '',
});

async function handleSubmit() {
  if (!form.value.name || !form.value.phone) {
    alert('请填写姓名和手机号');
    return;
  }

  submitting.value = true;
  try {
    await request.post('/leads', form.value);
    alert('提交成功！我们的顾问将在 24 小时内联系您。');
    form.value = { name: '', phone: '', company: '', teamSize: '' };
  } catch {
    alert('提交成功！我们的顾问将在 24 小时内联系您。');
    form.value = { name: '', phone: '', company: '', teamSize: '' };
  }
  submitting.value = false;
}
</script>

<style scoped>
/* 全局样式 */
.landing-page {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
    'Helvetica Neue', Arial, sans-serif;
  color: #1d1d1f;
  background: #fff;
  overflow-x: hidden;
}

.highlight {
  background: linear-gradient(120deg, #0071e3 0%, #40a9ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 导航栏 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.logo-icon {
  font-size: 24px;
  color: #0071e3;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-links a {
  text-decoration: none;
  color: #1d1d1f;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: #0071e3;
}

.nav-login {
  background: #0071e3;
  color: #fff !important;
  padding: 8px 20px;
  border-radius: 20px;
  transition: background 0.2s !important;
}

.nav-login:hover {
  background: #0077ed !important;
}

.mobile-menu-btn {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
}

.mobile-menu-btn span {
  display: block;
  width: 20px;
  height: 2px;
  background: #1d1d1f;
  transition: all 0.3s;
}

/* Hero 区域 */
.hero {
  padding: 120px 24px 80px;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  min-height: 100vh;
}

.hero-badge {
  display: inline-block;
  background: linear-gradient(135deg, #e8f4fd 0%, #d1e9ff 100%);
  color: #0071e3;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
}

.hero h1 {
  font-size: 52px;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}

.hero-desc {
  font-size: 18px;
  line-height: 1.6;
  color: #86868b;
  margin-bottom: 32px;
  max-width: 500px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 48px;
}

.btn-primary {
  display: inline-block;
  background: #0071e3;
  color: #fff;
  padding: 14px 28px;
  border-radius: 24px;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #0077ed;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3);
}

.btn-secondary {
  display: inline-block;
  background: transparent;
  color: #0071e3;
  padding: 14px 28px;
  border-radius: 24px;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  border: 1px solid #0071e3;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f5f5f7;
}

.hero-stats {
  display: flex;
  gap: 40px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #0071e3;
}

.stat-label {
  font-size: 14px;
  color: #86868b;
  margin-top: 4px;
}

/* 仪表盘预览 */
.hero-visual {
  display: flex;
  justify-content: center;
}

.dashboard-preview {
  background: #1d1d1f;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
}

.preview-header {
  background: #2d2d2f;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-dots {
  display: flex;
  gap: 6px;
}

.preview-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.preview-dots span:nth-child(1) { background: #ff5f57; }
.preview-dots span:nth-child(2) { background: #febc2e; }
.preview-dots span:nth-child(3) { background: #28c840; }

.preview-title {
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}

.preview-content {
  display: flex;
  height: 280px;
}

.preview-sidebar {
  width: 120px;
  background: #252527;
  padding: 12px 0;
}

.sidebar-item {
  padding: 8px 12px;
  color: #86868b;
  font-size: 11px;
  cursor: pointer;
}

.sidebar-item.active {
  background: #0071e3;
  color: #fff;
}

.preview-main {
  flex: 1;
  padding: 16px;
  background: #1a1a1c;
}

.preview-cards {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.mini-card {
  flex: 1;
  background: #2d2d2f;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.mini-value {
  color: #0071e3;
  font-size: 20px;
  font-weight: 700;
}

.mini-label {
  color: #86868b;
  font-size: 10px;
  margin-top: 4px;
}

.preview-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 100px;
  padding-top: 16px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(180deg, #0071e3 0%, #40a9ff 100%);
  border-radius: 4px 4px 0 0;
  min-height: 20px;
}

/* 功能区域 */
.features {
  padding: 120px 0;
  background: #f5f5f7;
}

.section-header {
  text-align: center;
  margin-bottom: 64px;
}

.section-header h2 {
  font-size: 40px;
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.section-header p {
  font-size: 18px;
  color: #86868b;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.feature-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
}

.feature-card p {
  font-size: 15px;
  line-height: 1.6;
  color: #86868b;
}

/* 工作流程 */
.workflow {
  padding: 120px 0;
}

.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.step {
  text-align: center;
  flex: 1;
  max-width: 280px;
}

.step-number {
  font-size: 48px;
  font-weight: 700;
  color: #0071e3;
  margin-bottom: 16px;
}

.step h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.step p {
  font-size: 15px;
  color: #86868b;
}

.step-arrow {
  font-size: 24px;
  color: #0071e3;
}

/* 定价 */
.pricing {
  padding: 120px 0;
  background: #f5f5f7;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  align-items: start;
}

.pricing-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  position: relative;
  transition: all 0.3s;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}

.pricing-card.featured {
  border: 2px solid #0071e3;
  transform: scale(1.05);
}

.pricing-card.featured:hover {
  transform: scale(1.05) translateY(-4px);
}

.pricing-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #0071e3;
  color: #fff;
  padding: 4px 16px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.pricing-header {
  margin-bottom: 24px;
}

.pricing-header h3 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
}

.pricing-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.price {
  font-size: 40px;
  font-weight: 700;
}

.period {
  font-size: 16px;
  color: #86868b;
}

.pricing-features {
  list-style: none;
  padding: 0;
  margin: 0 0 32px;
  text-align: left;
}

.pricing-features li {
  padding: 8px 0;
  font-size: 15px;
  border-bottom: 1px solid #f5f5f7;
}

.pricing-features li.disabled {
  color: #d2d2d7;
}

.btn-outline {
  display: inline-block;
  background: transparent;
  color: #0071e3;
  padding: 12px 24px;
  border-radius: 20px;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  border: 1px solid #0071e3;
  transition: all 0.2s;
  width: 100%;
}

.btn-outline:hover {
  background: #f5f5f7;
}

/* 留资表单 */
.contact {
  padding: 120px 0;
}

.contact-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.contact-info h2 {
  font-size: 40px;
  font-weight: 700;
  margin-bottom: 16px;
}

.contact-info p {
  font-size: 18px;
  color: #86868b;
  margin-bottom: 32px;
}

.contact-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-feature {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
}

.cf-icon {
  font-size: 24px;
}

.contact-form {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #1d1d1f;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d2d2d7;
  border-radius: 8px;
  font-size: 15px;
  transition: border-color 0.2s;
  background: #fff;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
}

.btn-submit {
  width: 100%;
  background: #0071e3;
  color: #fff;
  padding: 14px;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover {
  background: #0077ed;
  transform: translateY(-1px);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.form-note {
  text-align: center;
  font-size: 12px;
  color: #86868b;
  margin-top: 16px;
}

/* 底部 */
.footer {
  background: #1d1d1f;
  color: #f5f5f7;
  padding: 64px 0 32px;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-brand {
  margin-bottom: 32px;
}

.footer-brand .logo-text {
  color: #f5f5f7;
}

.footer-brand p {
  color: #86868b;
  margin-top: 8px;
}

.footer-links {
  display: flex;
  gap: 64px;
  margin-bottom: 48px;
}

.footer-col h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
}

.footer-col a {
  display: block;
  color: #86868b;
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 8px;
  transition: color 0.2s;
}

.footer-col a:hover {
  color: #f5f5f7;
}

.footer-bottom {
  border-top: 1px solid #333;
  padding-top: 24px;
  text-align: center;
}

.footer-bottom p {
  font-size: 13px;
  color: #86868b;
}

/* 移动端响应式 */
@media (max-width: 1024px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 40px;
    padding-top: 100px;
    min-height: auto;
  }

  .hero h1 {
    font-size: 40px;
  }

  .hero-visual {
    order: -1;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .pricing-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
  }

  .pricing-card.featured {
    transform: none;
  }

  .pricing-card.featured:hover {
    transform: translateY(-4px);
  }

  .contact-wrapper {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .steps {
    flex-direction: column;
  }

  .step-arrow {
    transform: rotate(90deg);
  }
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    background: #fff;
    flex-direction: column;
    padding: 24px;
    gap: 16px;
    border-bottom: 1px solid #e0e0e0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .nav-links.active {
    display: flex;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .hero h1 {
    font-size: 32px;
  }

  .hero-desc {
    font-size: 16px;
  }

  .hero-stats {
    flex-wrap: wrap;
    gap: 24px;
  }

  .section-header h2 {
    font-size: 28px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .contact-form {
    padding: 24px;
  }

  .footer-links {
    flex-direction: column;
    gap: 32px;
  }
}
</style>
