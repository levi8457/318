import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/pages/landing/LandingPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/login/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('@/pages/admin/dashboard/AdminDashboard.vue') },
      { path: 'consultants', name: 'Consultants', component: () => import('@/pages/admin/consultants/ConsultantList.vue') },
      { path: 'consultants/:id', name: 'ConsultantDetail', component: () => import('@/pages/admin/consultants/ConsultantDetail.vue') },
      { path: 'strategy-templates', name: 'StrategyTemplates', component: () => import('@/pages/admin/strategy/StrategyList.vue') },
      { path: 'sop-config', name: 'SOPConfig', component: () => import('@/pages/admin/sop/SOPConfig.vue') },
      { path: 'customers', name: 'AdminCustomers', component: () => import('@/pages/admin/customers/CustomerList.vue') },
      { path: 'customers/:id', name: 'AdminCustomerDetail', component: () => import('@/pages/admin/customers/CustomerDetail.vue') },
      { path: 'sessions', name: 'AdminSessions', component: () => import('@/pages/admin/sessions/SessionList.vue') },
      { path: 'sessions/:id', name: 'AdminSessionDetail', component: () => import('@/pages/admin/sessions/SessionDetail.vue') },
      { path: 'tasks', name: 'AdminTasks', component: () => import('@/pages/admin/tasks/TaskList.vue') },
      { path: 'scripts', name: 'AdminScripts', component: () => import('@/pages/admin/scripts/ScriptList.vue') },
      { path: 'campaigns', name: 'AdminCampaigns', component: () => import('@/pages/admin/campaigns/CampaignList.vue') },
      { path: 'follow-up-plans', name: 'AdminFollowUpPlans', component: () => import('@/pages/admin/follow-up/FollowUpPlanDashboard.vue') },
      { path: 'follow-up-plans/:id', name: 'AdminFollowUpPlanDetail', component: () => import('@/pages/admin/follow-up/FollowUpPlanDetail.vue') },
      { path: 'audit-logs', name: 'AuditLogs', component: () => import('@/pages/admin/audit/AuditLog.vue') },
      { path: 'subscription', name: 'Subscription', component: () => import('@/pages/admin/subscription/SubscriptionPage.vue') },
      { path: 'settings', name: 'AdminSettings', component: () => import('@/pages/admin/settings/SettingsPage.vue') },
    ],
  },
  {
    path: '/dashboard',
    component: () => import('@/layouts/ConsultantLayout.vue'),
    meta: { requiresAuth: true, role: 'consultant' },
    children: [
      { path: '', name: 'ConsultantDashboard', component: () => import('@/pages/consultant/dashboard/ConsultantDashboard.vue') },
      { path: 'customers', name: 'MyCustomers', component: () => import('@/pages/consultant/customers/CustomerList.vue') },
      { path: 'customers/:id', name: 'CustomerDetail', component: () => import('@/pages/consultant/customers/CustomerDetail.vue') },
      { path: 'sessions', name: 'MySessions', component: () => import('@/pages/consultant/sessions/SessionList.vue') },
      { path: 'sessions/:id', name: 'SessionDetail', component: () => import('@/pages/consultant/sessions/SessionDetail.vue') },
      { path: 'tasks', name: 'MyTasks', component: () => import('@/pages/consultant/tasks/TaskCalendar.vue') },
      { path: 'follow-up-plans', name: 'FollowUpPlans', component: () => import('@/pages/consultant/follow-up/FollowUpPlanList.vue') },
      { path: 'follow-up-plans/:id', name: 'FollowUpPlanDetail', component: () => import('@/pages/consultant/follow-up/FollowUpPlanDetail.vue') },
      { path: 'scripts', name: 'Scripts', component: () => import('@/pages/consultant/scripts/ScriptList.vue') },
      { path: 'campaigns', name: 'Campaigns', component: () => import('@/pages/consultant/campaigns/CampaignList.vue') },
      { path: 'settings', name: 'Settings', component: () => import('@/pages/consultant/settings/SettingsPage.vue') },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 安全解析 localStorage 中的用户数据
function parseStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

// 路由守卫：检查认证和角色权限
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('accessToken');
  const user = parseStoredUser();

  // 无需认证的页面（官网、登录页）
  if (to.meta.requiresAuth === false) {
    // 已登录用户访问登录页时重定向到工作台
    if (token && to.path === '/login') {
      next(user?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      return;
    }
    next();
    return;
  }

  // 需要认证但未登录
  if (!token) {
    next('/login');
    return;
  }

  // 检查角色权限
  if (to.meta.role && to.meta.role !== user?.role) {
    next(user?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    return;
  }

  next();
});

export default router;
