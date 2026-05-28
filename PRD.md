# 铜雀台医美 AI 智能管家 — 产品需求文档 (PRD)

> 本文档面向 Claude Code (CC) 开发使用，包含完整功能需求、技术架构与验收标准。

---

## 1. 产品概述

**产品名称**：铜雀台医美 AI 智能管家（Agent）

**产品定位**：专为医美机构打造的 AI 客户资产管理与策略生成中枢，覆盖"管理-业务"双层场景。

**核心价值**：
- **管理端**：让医院管理方掌握全局业务数据、管理咨询师团队、统一跟进策略标准
- **业务端**：作为咨询师最强辅助（Copilot），降低记忆成本，提升转化与复购率

**目标用户**：
| 角色 | 数量 | 职责 |
|------|------|------|
| 管理员 | 全局唯一 1 个 | 机构管理者/运营总监，掌控全局业务、管理团队、制定策略 |
| 咨询师 | 多个 | 现场咨询师/网电咨询师，直接服务客户、执行跟进策略 |

---

## 2. 商业逻辑

客户生命周期：`潜客激活 → 到院面诊 → 术中体验 → 术后恢复 → 升单/复购`

AI Agent 的核心商业价值在于堵住每个环节的漏斗，覆盖两个层面：

| 层面 | 角色 | 核心价值 |
|------|------|----------|
| **管理决策层** | 管理员 | 全局数据洞察、团队管理、策略标准化、业务质量把控 |
| **业务执行层** | 咨询师 | 客户资产管理、AI辅助跟进、话术沉淀、精准营销执行 |

### 管理方核心诉求（第一性原理拆解）

医美机构管理者的核心问题是**"如何让整个咨询师团队高效运转并持续产出"**，拆解为：

1. **团队管控**：我有哪些咨询师？每人负责多少客户？业绩如何？
2. **策略标准化**：跟进策略不能只靠个人经验，需要统一的"最佳实践"模板
3. **质量监督**：咨询师有没有按要求跟进？客户满意度如何？
4. **业务决策**：哪些品项卖得好？哪些客户有升单潜力？团队短板在哪？

---

## 3. 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                     前端层 (Vue3)                        │
│    ┌──────────────────┐    ┌───────────────────────┐    │
│    │  管理员工作台      │    │  咨询师工作台          │    │
│    │  (Admin Dashboard) │    │  (Consultant Dashboard)│    │
│    └──────────────────┘    └───────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│                    后端层 (NestJS)                       │
│    用户体系(RBAC) / 客户画像 / 任务提醒 / 策略管理       │
├─────────────────────────────────────────────────────────┤
│                    AI Agent 层                           │
│   ASR语音转写 / 会话分析 / 策略生成 / Prompt工程         │
│          LLM: DeepSeek (国产大模型)                      │
├─────────────────────────────────────────────────────────┤
│                    数据层                                │
│     PostgreSQL / Redis / 对象存储                        │
│        现有 HIS/CRM 系统数据对接                          │
└─────────────────────────────────────────────────────────┘
```

### 技术选型

| 层级 | 技术栈 | 说明 |
|------|--------|------|
| 前端 | Vue3 + Vite + Pinia + Vue Router | 响应式工作台，支持 Web/移动端 |
| 后端 | NestJS (TypeScript) | 处理复杂业务逻辑，模块化架构 |
| 数据库 | PostgreSQL + Redis | 结构化数据 + 缓存/会话 |
| 鉴权 | JWT + RBAC | 基于角色的访问控制（admin / consultant） |
| AI/LLM | DeepSeek API | 文本理解与生成 |
| ASR | 第三方 ASR API（如讯飞/阿里） | 语音转文本 |
| Agent 框架 | 自研 Agent 逻辑链 | 触发条件 → 数据读取 → LLM处理 → 结果输出 |

---

## 4. 用户角色与权限模型

### 4.1 角色定义

```typescript
enum UserRole {
  ADMIN = 'admin',           // 管理员（全局唯一）
  CONSULTANT = 'consultant', // 咨询师（多个）
}

interface User {
  id: string;
  username: string;
  password: string;           // 加密存储
  role: UserRole;
  realName: string;           // 真实姓名
  phone: string;
  avatar?: string;
  isActive: boolean;          // 是否启用
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 权限矩阵

| 功能 | 管理员 (admin) | 咨询师 (consultant) |
|------|:---:|:---:|
| **仪表盘** | 全局业务数据概览 | 个人工作数据概览 |
| **咨询师管理** — 增/删/改/查 | ✅ | ❌ |
| **跟进策略管理** — 创建/编辑/删除/启用 | ✅ | ❌（仅查看和使用） |
| **客户管理** — 查看所有客户 | ✅ | ❌（仅查看自己的客户） |
| **客户管理** — 查看/编辑自己的客户 | ✅ | ✅ |
| **会话记录** — 查看所有咨询师的会话 | ✅ | ❌（仅查看自己的会话） |
| **会话记录** — 上传录音/查看分析 | ✅ | ✅ |
| **任务中心** — 查看所有任务 | ✅ | ❌（仅查看自己的任务） |
| **话术库** — 管理（增删改） | ✅ | ❌（仅查看和使用） |
| **营销活动** — 创建/管理 | ✅ | ❌（仅执行触达） |
| **SOP 模板配置** | ✅ | ❌ |
| **系统设置** | ✅ | ❌ |

### 4.3 数据隔离规则

- **管理员**：可查看系统中所有数据（所有客户、所有会话、所有任务）
- **咨询师**：只能查看和操作自己名下的数据（自己负责的客户、自己的会话、自己的任务）
- 客户与咨询师通过 `consultantId` 字段建立归属关系

---

## 5. 核心功能模块

### 模块零：管理员后台（新增）

#### 0.1 咨询师账号管理

**需求痛点**：机构管理者需要统一管理咨询师团队，掌控人员变动。

**功能清单**：
- **新增咨询师**：填写姓名、手机号、初始密码，系统自动创建账号
- **编辑咨询师信息**：修改姓名、手机号、头像、启用/停用状态
- **删除咨询师**：软删除（标记为已离职），保留历史数据关联
- **咨询师列表**：查看所有咨询师及其关键指标（客户数、本月会话数、任务完成率）
- **咨询师详情**：查看单个咨询师的客户列表、会话记录、任务执行情况
- **重置密码**：管理员可重置咨询师密码

**数据模型**：

```typescript
// 咨询师扩展信息（关联 User 表）
interface ConsultantProfile {
  id: string;
  userId: string;                 // 关联 User 表
  employeeNo?: string;            // 工号
  speciality: string[];           // 擅长领域（如：抗衰/塑形/皮肤）
  customerCount: number;          // 当前负责客户数
  isActive: boolean;
  joinedAt: Date;
  leftAt?: Date;                  // 离职日期
  notes?: string;                 // 管理员备注
}

// 咨询师绩效概览（仪表盘用）
interface ConsultantMetrics {
  consultantId: string;
  consultantName: string;
  totalCustomers: number;         // 客户总数
  newCustomersThisMonth: number;  // 本月新增客户
  sessionsThisMonth: number;      // 本月面诊数
  taskCompletionRate: number;     // 任务完成率 (0-1)
  followUpRate: number;           // 跟进率 (0-1)
  conversionRate: number;         // 转化率 (0-1)
}
```

#### 0.2 跟进策略模板管理

**需求痛点**：跟进策略不能只靠咨询师个人经验，管理方需要沉淀"最佳实践"并统一推行。

**功能清单**：
- **策略模板列表**：查看所有跟进策略模板，按项目类型/客户类型分类
- **创建策略模板**：定义策略名称、适用场景、跟进步骤、话术建议、注意事项
- **编辑策略模板**：修改已有模板内容
- **删除策略模板**：移除不再适用的模板
- **启用/停用模板**：控制模板是否在 AI 策略生成中被引用
- **AI 关联**：当 AI 生成跟进策略时，优先参考管理员配置的策略模板作为"企业最佳实践"

**数据模型**：

```typescript
// 跟进策略模板（管理员配置）
interface FollowUpStrategyTemplate {
  id: string;
  name: string;                   // 策略名称（如：热玛吉术后跟进策略）
  category: string;               // 分类：术前/术中/术后/升单
  applicableProjectTypes: string[]; // 适用项目类型
  applicableBlockerTypes: string[]; // 适用卡点类型（价格/疼痛/信任等）
  steps: StrategyStep[];          // 跟进步骤
  isActive: boolean;              // 是否启用
  createdBy: string;              // 创建者（管理员ID）
  createdAt: Date;
  updatedAt: Date;
}

interface StrategyStep {
  order: number;                  // 步骤顺序
  dayOffset: number;              // 距面诊/手术天数
  action: string;                 // 行动描述
  talkingPoints: string[];        // 话术要点
  exampleScript: string;          // 示例话术
  notes: string;                  // 注意事项
}
```

---

### 模块一：全息客户记忆体（VIP 深度画像引擎）

**需求痛点**：高端客户需要被"记住"，咨询师客户过多导致记忆混乱。

**功能清单**：

#### 1.1 动态标签管理
- 记录客户面部/身体基础条件
- 记录抗衰/塑形等核心诉求
- 记录预算敏感度等级（高/中/低）
- 支持自定义标签扩展

#### 1.2 私人喜好备忘录
- 记录非业务信息：
  - 饮食偏好（如：喜欢喝温水）
  - 忌讳事项（如：忌讳提年龄）
  - 职业背景
  - 偏好的咨询师风格
- 备忘录支持分类管理与快速检索

#### 1.3 历史项目时间轴
- 可视化展示客户做过的所有项目
- 时间节点标记（术前/术后/复诊）
- 支持按项目类型筛选
- 关联面诊记录与跟进记录

**数据模型**：

```typescript
// 客户画像
interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  consultantId: string;           // 归属咨询师
  tags: Tag[];                    // 动态标签
  preferences: Preference[];      // 私人喜好备忘录
  projects: ProjectTimeline[];    // 历史项目时间轴
  budgetSensitivity: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

interface Tag {
  id: string;
  category: string;    // 标签分类：身体条件/诉求/预算等
  value: string;
}

interface Preference {
  id: string;
  category: string;    // 分类：饮食/忌讳/职业/风格偏好
  content: string;
  importance: 'normal' | 'important' | 'critical';
}

interface ProjectTimeline {
  id: string;
  projectName: string;
  projectType: string;    // 项目类型：抗衰/塑形/皮肤等
  date: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'follow_up';
  notes: string;
  consultantId: string;
}
```

---

### 模块二：会话智能解析与策略大脑（AI 录音辅导）

**需求痛点**：面诊录音往往是沉睡数据，咨询师面诊后不知道下一步怎么跟进。

**功能清单**：

#### 2.1 ASR 语音转写与摘要
- 自动识别咨询师与客户的对话
- 提取核心诉求关键词
- 识别客户卡点（如：嫌贵、怕疼、需要问老公）
- 识别关键决策人
- 生成面诊摘要

#### 2.2 跟进策略生成（Agent 核心）
- 依据大模型分析面诊内容
- 自动生成针对性的《1v1 跟进策略指导》
- **策略生成时优先参考管理员配置的策略模板**（企业最佳实践）
- 策略包含：
  - 客户意向分析
  - 卡点应对方案
  - 推荐跟进话术
  - 最佳跟进时间建议
  - 关联的策略模板来源

**示例输出**：
> "客户对热玛吉抗衰有意向但对疼痛极其敏感，建议下次跟进重点强调我院特有的舒适化无痛打法，并分享3个怕疼客户的成功案例。（参考策略模板：《热玛吉术后跟进策略》）"

#### 2.3 金牌话术库沉淀
- 识别高转化率的对话片段
- 自动提炼为企业内部金牌话术库
- 支持话术分类检索
- 管理员可审核和编辑话术库内容

**数据模型**：

```typescript
// 面诊会话记录
interface ConsultationSession {
  id: string;
  customerId: string;
  consultantId: string;
  audioUrl?: string;              // 原始录音
  transcript: string;             // ASR转写文本
  summary: string;                // AI生成摘要
  keyPoints: KeyPoint[];          // 核心诉求
  blockers: Blocker[];            // 客户卡点
  decisionMakers: string[];       // 关键决策人
  followUpStrategy: FollowUpStrategy;
  createdAt: Date;
}

interface KeyPoint {
  topic: string;
  description: string;
  intent: 'high' | 'medium' | 'low';
}

interface Blocker {
  type: 'price' | 'pain' | 'trust' | 'family' | 'other';
  detail: string;
  suggestedResponse: string;
}

interface FollowUpStrategy {
  summary: string;                // 策略概述
  talkingPoints: string[];        // 跟进话术
  bestFollowUpTime: string;       // 最佳跟进时间
  caseReferences: string[];       // 参考案例
  templateId?: string;            // 关联的策略模板ID
  templateName?: string;          // 关联的策略模板名称
}

// 金牌话术
interface GoldenScript {
  id: string;
  category: string;               // 话术分类
  scenario: string;               // 适用场景
  script: string;                 // 话术内容
  conversionRate: number;         // 转化率
  sourceSessionId: string;        // 来源会话
  isApproved: boolean;            // 管理员是否已审核
}
```

---

### 模块三：智能任务与时序触发器（SOP 自动化执行）

**需求痛点**：咨询师忘记复诊时间、忘记术后关怀。

**功能清单**：

#### 3.1 多节点任务提醒
- 根据所做项目自动生成日历任务
- 常见提醒节点：
  - 双眼皮拆线（术后7天）
  - 水光针补打（术后1个月）
  - 光电项目按月复诊
  - 填充项目定型期回访
- 通过系统通知/企微推送到咨询师手机
- 支持自定义提醒规则（管理员配置）

#### 3.2 一键生成关怀文案
- 提醒同时，AI 自动生成匹配当前恢复阶段的关怀话术
- 话术包含：专业恢复建议 + 情感关怀

**示例输出**：
> "王姐，今天是您做完超声炮第7天，胶原蛋白正在加速重组，注意防晒哦，现在皮肤感觉怎么样？"

**数据模型**：

```typescript
// 任务提醒
interface TaskReminder {
  id: string;
  customerId: string;
  consultantId: string;
  projectId: string;
  taskType: 'follow_up' | 'recheck' | 'care' | 'promotion';
  triggerDate: Date;
  triggerRule: string;            // 触发规则描述
  status: 'pending' | 'sent' | 'completed' | 'dismissed';
  careMessage?: string;           // AI生成的关怀文案
  channel: 'system' | 'wecom' | 'sms';
}

// SOP模板（管理员配置）
interface SOPTemplate {
  id: string;
  name: string;                   // 模板名称
  projectType: string;            // 适用项目类型
  nodes: SOPNode[];               // 提醒节点列表
  isActive: boolean;
  createdBy: string;              // 管理员ID
}

interface SOPNode {
  dayOffset: number;              // 距手术天数
  taskType: string;
  messageTemplate: string;        // 话术模板
  channel: 'system' | 'wecom' | 'sms';
}
```

---

### 模块四：情绪价值与精准营销触达引擎

**需求痛点**：回访干瘪乏味；出新产品/降价时群发打扰客户，不够精准。

**功能清单**：

#### 4.1 情绪周期回访
- 记录客户生日、重要纪念日
- 结合术后焦虑期（如整容术后消肿期的容貌焦虑）
- AI 提醒咨询师进行心理安抚
- 生成个性化安抚话术

#### 4.2 升单/降价智能匹配
- 当推出新产品（如"二代热玛吉升级三代"）或促销活动时
- AI 自动从数据库检索匹配客户：
  - 历史购买过相关产品的客户
  - 咨询过但因价格流失的客户
- 为每个人生成独一无二的"专属特权"邀约话术
- 避免群发感，强调个性化

**数据模型**：

```typescript
// 营销活动
interface MarketingCampaign {
  id: string;
  name: string;
  type: 'upgrade' | 'promotion' | 'new_product' | 'anniversary';
  targetProduct: string;
  relatedProducts: string[];      // 关联历史产品
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed';
  createdBy: string;              // 管理员ID
}

// 精准触达记录
interface TargetedOutreach {
  id: string;
  campaignId: string;
  customerId: string;
  consultantId: string;
  matchedReason: string;          // 匹配原因
  generatedMessage: string;       // AI生成的个性化话术
  status: 'pending' | 'sent' | 'responded' | 'converted';
  sentAt?: Date;
}
```

---

## 6. 页面结构

### 6.1 管理员工作台（Admin Dashboard）

```
┌──────────────────────────────────────────────────────────┐
│  顶部导航：Logo | 全局搜索 | 系统通知 | 管理员头像 ▼      │
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  侧边栏     │           主内容区                          │
│            │                                             │
│  📊 仪表盘  │  ┌─────────────────────────────────────┐   │
│  👨‍💼 咨询师 │  │  核心业务指标                        │   │
│    管理    │  │  总客户数 | 本月新增 | 活跃率 | 转化率  │   │
│  📋 策略   │  └─────────────────────────────────────┘   │
│    模板    │                                             │
│  👥 全部   │  ┌─────────────────────────────────────┐   │
│    客户    │  │  咨询师业绩排行                      │   │
│  📞 全部   │  │  张三 ████████ 45客户 92%完成率       │   │
│    会话    │  │  李四 ██████   38客户 87%完成率       │   │
│  📋 全部   │  │  王五 █████    31客户 78%完成率       │   │
│    任务    │  └─────────────────────────────────────┘   │
│  💬 话术库 │                                             │
│  📢 营销   │  ┌─────────────────────────────────────┐   │
│    中心    │  │  待处理事项                          │   │
│  ⚙️ SOP   │  │  - 5条待审核话术                      │   │
│    配置    │  │  - 3个咨询师任务逾期                  │   │
│  ⚙️ 系统  │  │  - 2个待处理营销活动                  │   │
│    设置    │  └─────────────────────────────────────┘   │
│            │                                             │
│            │  ┌─────────────────────────────────────┐   │
│            │  │  趋势图表（客户增长/会话量/转化率）   │   │
│            │  └─────────────────────────────────────┘   │
├────────────┴─────────────────────────────────────────────┤
│  底部：系统状态 | 版本信息                                │
└──────────────────────────────────────────────────────────┘
```

**管理员仪表盘核心卡片**：
1. **全局业务指标**：总客户数、本月新增客户、客户活跃率、整体转化率
2. **咨询师业绩排行**：按客户数/转化率/任务完成率排序
3. **待处理事项**：待审核话术、逾期任务、待处理营销活动
4. **趋势图表**：客户增长趋势、月度会话量、品项分布
5. **团队健康度**：各咨询师任务完成率、客户跟进及时率

### 6.2 咨询师工作台（Consultant Dashboard）

```
┌──────────────────────────────────────────────────────────┐
│  顶部导航：Logo | 搜索客户 | 消息通知 | 咨询师头像 ▼      │
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  侧边栏     │           主内容区                          │
│            │                                             │
│  📊 仪表盘  │  ┌─────────────────────────────────────┐   │
│  👥 我的   │  │  今日待办任务                        │   │
│    客户    │  │  - 3个客户需要跟进                    │   │
│  📞 我的   │  │  - 2个复诊提醒                        │   │
│    会话    │  │  - 1个生日关怀                        │   │
│  📋 我的   │  └─────────────────────────────────────┘   │
│    任务    │                                             │
│  💬 话术库 │  ┌─────────────────────────────────────┐   │
│  📢 营销   │  │  最近活跃客户                        │   │
│    执行    │  │  客户卡片列表（头像/标签/最近动态）    │   │
│  ⚙️ 个人  │  └─────────────────────────────────────┘   │
│    设置    │                                             │
│            │  ┌─────────────────────────────────────┐   │
│            │  │  AI 助手悬浮窗                       │   │
│            │  │  快速查看策略/生成话术/分析会话       │   │
│            │  └─────────────────────────────────────┘   │
├────────────┴─────────────────────────────────────────────┤
│  底部：系统状态 | 版本信息                                │
└──────────────────────────────────────────────────────────┘
```

**咨询师仪表盘核心卡片**：
1. **今日待办**：待跟进客户、复诊提醒、关怀任务
2. **我的客户概览**：客户总数、本周新增、待激活客户
3. **最近活跃客户**：最近有互动的客户卡片（头像/标签/最近动态）
4. **AI 助手入口**：快速查看策略、生成话术、分析会话
5. **个人业绩**：本月面诊数、任务完成率、跟进率

### 6.3 核心页面列表

| 页面 | 路由 | 可见角色 | 说明 |
|------|------|----------|------|
| **管理员仪表盘** | `/admin/dashboard` | admin | 全局业务数据、团队业绩排行 |
| **咨询师管理** | `/admin/consultants` | admin | 咨询师列表、增删改查 |
| **咨询师详情** | `/admin/consultants/:id` | admin | 咨询师信息、客户/会话/任务概览 |
| **策略模板管理** | `/admin/strategy-templates` | admin | 跟进策略模板的增删改查 |
| **SOP配置** | `/admin/sop-config` | admin | 提醒规则、话术模板配置 |
| **全部客户** | `/admin/customers` | admin | 查看所有客户（管理员视角） |
| **全部会话** | `/admin/sessions` | admin | 查看所有会话（管理员视角） |
| **全部任务** | `/admin/tasks` | admin | 查看所有任务（管理员视角） |
| **话术库管理** | `/admin/scripts` | admin | 话术审核、编辑、分类管理 |
| **营销中心** | `/admin/campaigns` | admin | 活动创建/管理/数据分析 |
| **系统设置** | `/admin/settings` | admin | 系统参数配置 |
| | | | |
| **咨询师仪表盘** | `/dashboard` | consultant | 今日待办、最近活跃客户 |
| **我的客户** | `/customers` | consultant | 自己负责的客户列表 |
| **客户详情** | `/customers/:id` | consultant | 全息画像、时间轴、备忘录 |
| **我的会话** | `/sessions` | consultant | 自己的面诊录音列表 |
| **会话详情** | `/sessions/:id` | consultant | 转写文本、AI摘要、跟进策略 |
| **我的任务** | `/tasks` | consultant | 待办任务、日历视图 |
| **话术库** | `/scripts` | consultant | 金牌话术浏览、搜索（只读） |
| **营销执行** | `/campaigns` | consultant | 执行管理员分配的触达任务 |
| **个人设置** | `/settings` | consultant | 个人信息、密码修改 |

---

## 7. API 设计（RESTful）

### 7.1 认证模块

```
POST   /api/auth/login                 # 登录（返回JWT + 角色信息）
POST   /api/auth/logout                # 登出
GET    /api/auth/profile               # 获取当前用户信息
PUT    /api/auth/password              # 修改密码
```

### 7.2 管理员 — 咨询师管理

```
GET    /api/admin/consultants               # 咨询师列表（含绩效指标）
POST   /api/admin/consultants               # 新增咨询师
GET    /api/admin/consultants/:id           # 咨询师详情（含客户/会话/任务概览）
PUT    /api/admin/consultants/:id           # 编辑咨询师信息
DELETE /api/admin/consultants/:id           # 删除咨询师（软删除）
PUT    /api/admin/consultants/:id/status    # 启用/停用咨询师
POST   /api/admin/consultants/:id/reset-pwd # 重置咨询师密码
```

### 7.3 管理员 — 策略模板管理

```
GET    /api/admin/strategy-templates             # 策略模板列表
POST   /api/admin/strategy-templates             # 创建策略模板
GET    /api/admin/strategy-templates/:id         # 策略模板详情
PUT    /api/admin/strategy-templates/:id         # 编辑策略模板
DELETE /api/admin/strategy-templates/:id         # 删除策略模板
PUT    /api/admin/strategy-templates/:id/status  # 启用/停用模板
```

### 7.4 管理员 — SOP 模板管理

```
GET    /api/admin/sop-templates              # SOP模板列表
POST   /api/admin/sop-templates              # 创建SOP模板
PUT    /api/admin/sop-templates/:id          # 编辑SOP模板
DELETE /api/admin/sop-templates/:id          # 删除SOP模板
```

### 7.5 管理员 — 全局数据查看

```
GET    /api/admin/dashboard/metrics          # 全局业务指标
GET    /api/admin/dashboard/ranking          # 咨询师业绩排行
GET    /api/admin/dashboard/trends           # 趋势图表数据
GET    /api/admin/dashboard/alerts           # 待处理事项/告警
```

### 7.6 客户模块

```
GET    /api/customers                  # 客户列表（admin看全部，consultant看自己的）
GET    /api/customers/:id              # 客户详情（含画像）
POST   /api/customers                  # 创建客户
PUT    /api/customers/:id              # 更新客户信息
POST   /api/customers/:id/tags         # 添加标签
DELETE /api/customers/:id/tags/:tagId  # 删除标签
POST   /api/customers/:id/preferences  # 添加喜好备忘
GET    /api/customers/:id/timeline     # 获取项目时间轴
```

### 7.7 会话模块

```
POST   /api/sessions                   # 创建面诊会话（上传录音）
GET    /api/sessions                   # 会话列表（admin看全部，consultant看自己的）
GET    /api/sessions/:id               # 会话详情（含转写/摘要/策略）
POST   /api/sessions/:id/analyze       # 触发AI分析
GET    /api/sessions/:id/strategy      # 获取跟进策略
```

### 7.8 任务模块

```
GET    /api/tasks                      # 任务列表（admin看全部，consultant看自己的）
PUT    /api/tasks/:id                  # 更新任务状态
POST   /api/tasks/generate             # 根据项目自动生成SOP任务
GET    /api/tasks/calendar             # 日历视图数据
```

### 7.9 话术模块

```
GET    /api/scripts                    # 话术列表（分类/搜索）
GET    /api/scripts/:id                # 话术详情
POST   /api/scripts/generate           # AI生成话术
PUT    /api/scripts/:id                # 管理员编辑话术
PUT    /api/scripts/:id/approve        # 管理员审核话术
```

### 7.10 营销模块

```
GET    /api/campaigns                  # 活动列表
POST   /api/campaigns                  # 创建活动（管理员）
POST   /api/campaigns/:id/match        # AI匹配目标客户
POST   /api/campaigns/:id/generate     # AI生成个性化话术
GET    /api/campaigns/:id/outreaches   # 触达记录
```

---

## 8. 非功能需求

### 8.1 数据安全
- 医美行业数据极其敏感，必须实现数据脱敏
- 客户手机号、面部照片等 PII 数据加密存储
- API 访问需要鉴权（JWT）
- 基于角色的访问控制（RBAC），防止越权访问
- 操作日志审计（特别是管理员对咨询师的增删改操作）

### 8.2 性能要求
- 页面首屏加载 < 2s
- AI 分析响应 < 10s（ASR转写可能更长，支持异步处理）
- 支持 100+ 并发咨询师使用

### 8.3 可扩展性
- 模块化设计，各功能模块可独立部署/升级
- LLM 层抽象，可切换不同大模型
- ASR 接口抽象，可对接不同语音服务商

---

## 9. 开发阶段规划

### Phase 1：需求确认与架构设计（1周）
- [ ] 梳理现有 HIS/CRM 系统数据接口
- [ ] 完成 UI/UX 原型设计（含管理员/咨询师双视角）
- [ ] 完成数据库表结构搭建
- [ ] 确定技术栈版本与开发规范
- [ ] 用户体系与 RBAC 权限模型设计

### Phase 2：核心业务流与工作台开发（3周）
- [ ] 用户认证与权限模块（JWT + RBAC）
- [ ] 管理员后台 — 咨询师管理
- [ ] 管理员后台 — 策略模板管理
- [ ] 管理员后台 — SOP模板配置
- [ ] 管理员仪表盘（全局数据概览）
- [ ] Vue3 前端咨询师工作台开发
- [ ] NestJS 后端基础架构搭建
- [ ] 客户画像模块（标签/备忘录/时间轴）
- [ ] 任务提醒模块

### Phase 3：AI Agent 与大模型深度接入（2周）
- [ ] ASR 语音转文本 API 接入与调试
- [ ] Prompt 工程调优（医美场景策略生成/话术生成）
- [ ] Agent 逻辑链条跑通（触发→读取→LLM→输出）
- [ ] 会话分析与跟进策略生成（关联管理员策略模板）
- [ ] 精准营销匹配算法

### Phase 4：内测、打磨与上线（1-2周）
- [ ] 数据安全与隐私脱敏测试
- [ ] 权限越级测试（确保咨询师无法访问管理员功能）
- [ ] 灰度测试（管理员 + 1-2个咨询师团队）
- [ ] AI 策略微调
- [ ] 系统部署与培训

---

## 10. 验收标准

### 功能验收
- [ ] **管理员**：可正常增删改查咨询师账号
- [ ] **管理员**：可创建/编辑/删除跟进策略模板
- [ ] **管理员**：仪表盘显示全局业务数据（客户总数/团队业绩/趋势图表）
- [ ] **管理员**：可查看所有客户/会话/任务
- [ ] **咨询师**：仪表盘显示个人工作数据（今日待办/我的客户/个人业绩）
- [ ] **咨询师**：只能查看自己名下的客户/会话/任务
- [ ] 客户画像完整展示（标签/备忘录/时间轴）
- [ ] 录音上传 → ASR转写 → AI摘要 → 跟进策略 全链路跑通
- [ ] AI 跟进策略生成时正确引用管理员配置的策略模板
- [ ] SOP任务自动生成与提醒推送正常
- [ ] 精准营销活动创建 → 客户匹配 → 话术生成 全流程可用
- [ ] 金牌话术库可浏览、可搜索、管理员可审核

### 安全验收
- [ ] PII数据加密存储
- [ ] JWT鉴权正常
- [ ] RBAC权限隔离正常（咨询师无法访问管理员接口）
- [ ] 操作日志可追溯
- [ ] 通过隐私脱敏测试

### 性能验收
- [ ] 首屏加载 < 2s
- [ ] AI分析响应 < 10s
- [ ] 100并发无明显性能下降
