# CLAUDE.md — 铜雀台医美 AI 智能管家项目管理文件

> 本文件是 Claude Code (CC) 在本项目中的全局行为指南。
> CC 在每次会话开始时应自动读取本文件，理解项目上下文后开始工作。

---

## 项目信息

- **项目名称**：铜雀台医美 AI 智能管家（TongqueTai AI Agent）
- **项目类型**：医美行业 SaaS / AI Agent 系统
- **产品定位**：覆盖"管理-业务"双层场景的 AI 客户资产与策略管理中枢
- **目标用户**：
  - 管理员（全局唯一 1 个）— 机构管理者/运营总监
  - 咨询师（多个）— 现场咨询师/网电咨询师

---

## 技术栈

| 层级 | 技术 | 版本/说明 |
|------|------|-----------|
| 前端 | Vue 3 + Vite + Pinia + Vue Router | 响应式工作台 |
| UI 框架 | Element Plus 或 Ant Design Vue | 企业级组件库 |
| 后端 | NestJS (TypeScript) | 模块化后端架构 |
| 数据库 | PostgreSQL | 主数据库 |
| 缓存 | Redis | 会话缓存/任务队列 |
| 鉴权 | JWT + RBAC | 基于角色的访问控制（admin / consultant） |
| AI/LLM | DeepSeek API | 文本理解与生成 |
| ASR | 第三方 ASR API（讯飞/阿里云） | 语音转文本 |
| 包管理 | pnpm | 前后端统一 |
| API 风格 | RESTful | JSON 通信 |

---

## 角色与权限模型

系统有两种角色，权限严格隔离：

| 角色 | 数量 | 说明 |
|------|------|------|
| `admin` | 全局唯一 1 个 | 机构管理者，掌控全局 |
| `consultant` | 多个 | 咨询师，执行业务 |

### 权限矩阵速查

| 功能 | admin | consultant |
|------|:---:|:---:|
| 管理员仪表盘（全局数据） | ✅ | ❌ |
| 咨询师管理（增删改查） | ✅ | ❌ |
| 跟进策略模板管理 | ✅ | ❌（仅查看/使用） |
| SOP 模板配置 | ✅ | ❌ |
| 查看所有客户 | ✅ | ❌（仅自己的） |
| 查看所有会话 | ✅ | ❌（仅自己的） |
| 查看所有任务 | ✅ | ❌（仅自己的） |
| 话术库管理（增删改审核） | ✅ | ❌（仅查看） |
| 营销活动创建/管理 | ✅ | ❌（仅执行） |
| 咨询师仪表盘（个人数据） | ❌ | ✅ |
| 客户画像操作 | ✅ | ✅（自己的） |
| 会话上传/分析 | ✅ | ✅（自己的） |
| 任务查看/完成 | ✅ | ✅（自己的） |

### 数据隔离规则

- **admin**：可查看系统中所有数据
- **consultant**：只能查看 `consultantId = 当前用户ID` 的数据
- 后端 API 必须在 Service 层强制注入数据隔离逻辑

---

## 项目结构

```
tongquetai-ai-agent/
├── CLAUDE.md                  # 本文件 - CC 全局管理
├── PRD.md                     # 产品需求文档
├── package.json               # 根 package.json (monorepo)
├── pnpm-workspace.yaml        # pnpm 工作区配置
├── .env.example               # 环境变量模板
├── .eslintrc.js               # ESLint 配置
├── .prettierrc                # Prettier 配置
│
├── apps/
│   ├── web/                   # 前端 Vue3 应用
│   │   ├── src/
│   │   │   ├── api/           # API 请求封装
│   │   │   ├── assets/        # 静态资源
│   │   │   ├── components/    # 公共组件
│   │   │   ├── composables/   # 组合式函数
│   │   │   ├── guards/        # 路由守卫（权限控制）
│   │   │   ├── layouts/       # 布局组件
│   │   │   │   ├── AdminLayout.vue      # 管理员布局
│   │   │   │   └── ConsultantLayout.vue # 咨询师布局
│   │   │   ├── pages/
│   │   │   │   ├── admin/             # 管理员页面
│   │   │   │   │   ├── dashboard/     # 管理员仪表盘
│   │   │   │   │   ├── consultants/   # 咨询师管理
│   │   │   │   │   ├── strategy/      # 策略模板管理
│   │   │   │   │   ├── sop/           # SOP配置
│   │   │   │   │   ├── customers/     # 全部客户
│   │   │   │   │   ├── sessions/      # 全部会话
│   │   │   │   │   ├── tasks/         # 全部任务
│   │   │   │   │   ├── scripts/       # 话术库管理
│   │   │   │   │   ├── campaigns/     # 营销中心
│   │   │   │   │   └── settings/      # 系统设置
│   │   │   │   └── consultant/        # 咨询师页面
│   │   │   │       ├── dashboard/     # 咨询师仪表盘
│   │   │   │       ├── customers/     # 我的客户
│   │   │   │       ├── sessions/      # 我的会话
│   │   │   │       ├── tasks/         # 我的任务
│   │   │   │       ├── scripts/       # 话术库（只读）
│   │   │   │       ├── campaigns/     # 营销执行
│   │   │   │       └── settings/      # 个人设置
│   │   │   ├── router/        # 路由配置（含角色守卫）
│   │   │   ├── stores/        # Pinia 状态管理
│   │   │   │   ├── auth.ts    # 认证状态（含角色）
│   │   │   │   ├── admin/     # 管理员相关 store
│   │   │   │   └── consultant/# 咨询师相关 store
│   │   │   ├── styles/        # 全局样式
│   │   │   ├── types/         # TypeScript 类型定义
│   │   │   └── utils/         # 工具函数
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── server/                # 后端 NestJS 应用
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/          # 认证模块（JWT + RBAC）
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── guards/          # 认证守卫
│       │   │   │   │   ├── jwt.guard.ts
│       │   │   │   │   └── roles.guard.ts
│       │   │   │   ├── decorators/      # 自定义装饰器
│       │   │   │   │   └── roles.decorator.ts
│       │   │   │   └── strategies/      # Passport 策略
│       │   │   │       └── jwt.strategy.ts
│       │   │   ├── user/          # 用户模块（管理员+咨询师）
│       │   │   │   ├── user.controller.ts
│       │   │   │   ├── user.service.ts
│       │   │   │   ├── user.module.ts
│       │   │   │   ├── dto/
│       │   │   │   └── entities/
│       │   │   ├── consultant/    # 咨询师管理模块（管理员专用）
│       │   │   │   ├── consultant.controller.ts
│       │   │   │   ├── consultant.service.ts
│       │   │   │   ├── consultant.module.ts
│       │   │   │   ├── dto/
│       │   │   │   └── entities/
│       │   │   ├── customer/      # 客户模块
│       │   │   ├── session/       # 会话模块（面诊记录）
│       │   │   ├── task/          # 任务提醒模块
│       │   │   ├── script/        # 话术模块
│       │   │   ├── campaign/      # 营销模块
│       │   │   ├── strategy/      # 策略模板模块（管理员专用）
│       │   │   │   ├── strategy.controller.ts
│       │   │   │   ├── strategy.service.ts
│       │   │   │   ├── strategy.module.ts
│       │   │   │   ├── dto/
│       │   │   │   └── entities/
│       │   │   ├── sop/           # SOP模板模块（管理员专用）
│       │   │   ├── dashboard/     # 仪表盘模块（admin/consultant 分离）
│       │   │   │   ├── dashboard.controller.ts
│       │   │   │   ├── dashboard.service.ts
│       │   │   │   └── dashboard.module.ts
│       │   │   ├── ai/            # AI Agent 模块
│       │   │   └── asr/           # ASR 语音转写模块
│       │   ├── common/            # 公共模块（守卫/拦截器/过滤器）
│       │   │   ├── interceptors/
│       │   │   │   └── data-isolation.interceptor.ts  # 数据隔离拦截器
│       │   │   └── filters/
│       │   │       └── http-exception.filter.ts
│       │   ├── config/            # 配置模块
│       │   ├── database/          # 数据库（TypeORM 实体/迁移）
│       │   ├── main.ts
│       │   └── app.module.ts
│       ├── test/
│       ├── nest-cli.json
│       └── tsconfig.json
│
├── packages/
│   ├── shared/                # 前后端共享类型/常量
│   │   ├── types/
│   │   │   ├── user.types.ts      # 用户/角色类型
│   │   │   ├── customer.types.ts
│   │   │   ├── session.types.ts
│   │   │   └── ...
│   │   └── constants/
│   │       └── roles.ts           # 角色常量定义
│   └── ai-engine/             # AI 引擎独立包
│       ├── prompts/           # Prompt 模板
│       ├── chains/            # Agent 逻辑链
│       └── services/          # LLM/ASR 服务封装
│
├── docs/                      # 文档
│   ├── api/                   # API 文档
│   └── architecture/          # 架构文档
│
└── scripts/                   # 脚本工具
    ├── dev.sh                 # 开发启动脚本
    ├── build.sh               # 构建脚本
    └── seed.sh                # 数据库种子数据（含默认管理员账号）
```

---

## 编码规范

### 通用规则
- **语言**：所有代码使用 TypeScript，严格模式
- **命名**：
  - 文件名：kebab-case（如 `customer-profile.ts`）
  - 变量/函数：camelCase
  - 类/接口/类型：PascalCase
  - 常量：UPPER_SNAKE_CASE
  - 数据库表名：snake_case，复数（如 `customer_profiles`）
- **注释**：复杂逻辑必须有注释，使用中文注释业务逻辑
- **错误处理**：所有异步操作必须有 try-catch，统一错误响应格式

### 前端规范
- 组件使用 `<script setup lang="ts">` 语法
- 使用 Composition API，不使用 Options API
- 页面组件放在 `pages/` 目录，按角色分 `admin/` 和 `consultant/` 子目录
- API 请求统一在 `api/` 目录封装，使用 axios 实例
- 状态管理使用 Pinia，按功能模块拆分 store
- 样式使用 SCSS，支持 CSS 变量主题切换
- 路由守卫必须检查角色权限，防止越权访问

### 后端规范
- 使用 NestJS 装饰器风格（`@Controller`, `@Service`, `@Module`）
- 每个功能模块包含：controller / service / dto / entity
- 使用 TypeORM 做数据库 ORM
- 使用 class-validator 做请求参数校验
- 使用 Swagger 自动生成 API 文档
- 日志使用 NestJS 内置 Logger
- **管理员专用接口**：使用 `@Roles('admin')` 装饰器 + `RolesGuard` 守卫
- **数据隔离**：consultant 角色的查询必须注入 `consultantId` 过滤条件

### 数据库规范
- 所有表必须包含：`id`, `created_at`, `updated_at`, `deleted_at`（软删除）
- 外键关系使用 TypeORM 的 `@ManyToOne` / `@OneToMany` 装饰器
- 敏感字段（手机号/身份证）加密存储
- 使用数据库迁移管理表结构变更

---

## 开发工作流

### 分支管理
- `main` — 生产分支，只接受 PR 合并
- `develop` — 开发主分支
- `feature/*` — 功能分支（如 `feature/admin-consultant-mgmt`）
- `fix/*` — 修复分支

### 提交规范
使用 Conventional Commits：
```
feat(admin): 添加咨询师账号管理功能
feat(admin): 添加跟进策略模板管理
feat(dashboard): 实现管理员/咨询师双视角仪表盘
fix(auth): 修复角色权限校验漏洞
refactor(ai): 重构 Agent 逻辑链
docs(api): 更新 API 文档
chore: 更新依赖版本
```

### 任务执行顺序
CC 开发时应遵循以下优先级：
1. 用户体系与 RBAC 权限 → 2. 数据库实体与迁移 → 3. 后端 API → 4. 前端页面 → 5. AI 集成

每个功能模块完成后，运行以下检查：
```bash
# 类型检查
pnpm run type-check

# Lint 检查
pnpm run lint

# 构建验证
pnpm run build
```

---

## 开发阶段与任务拆分

CC 应按以下阶段顺序开发，每个阶段完成后更新底部"进度追踪"。

### 阶段一：基础架构（优先级最高）

**任务 1.1：项目初始化**
- 初始化 monorepo（pnpm workspace）
- 创建 apps/web（Vue3 + Vite）
- 创建 apps/server（NestJS）
- 创建 packages/shared
- 配置 ESLint / Prettier / TypeScript

**任务 1.2：用户认证与 RBAC**
- User 实体设计（id/username/password/role/realName/phone/isActive）
- JWT 登录/登出
- Roles 装饰器 + RolesGuard 守卫
- 路由守卫（前端根据角色跳转不同布局）
- 默认管理员种子账号

**任务 1.3：数据库设计**
- 所有实体定义与迁移
- 关键实体：User, ConsultantProfile, CustomerProfile, ConsultationSession, TaskReminder, FollowUpStrategyTemplate, SOPTemplate, GoldenScript, MarketingCampaign

### 阶段二：管理员后台

**任务 2.1：咨询师管理**
- 后端：consultant CRUD API（仅 admin 可访问）
- 后端：重置密码、启用/停用
- 前端：咨询师列表页（含绩效指标）
- 前端：新增/编辑咨询师弹窗

**任务 2.2：策略模板管理**
- 后端：策略模板 CRUD API（仅 admin 可访问）
- 前端：策略模板列表页
- 前端：策略模板编辑器（步骤拖拽排序）

**任务 2.3：SOP 模板配置**
- 后端：SOP 模板 CRUD API
- 前端：SOP 模板配置页

**任务 2.4：管理员仪表盘**
- 后端：全局指标 API（总客户/本月新增/活跃率/转化率）
- 后端：咨询师业绩排行 API
- 后端：趋势图表数据 API
- 前端：仪表盘页面（指标卡片 + 排行表 + 趋势图）

### 阶段三：咨询师工作台

**任务 3.1：客户画像模块**
- 后端：客户 CRUD API（含数据隔离）
- 后端：标签/备忘录/时间轴 API
- 前端：客户列表页
- 前端：客户详情页（全息画像）

**任务 3.2：会话分析模块**
- 后端：会话 CRUD API
- 后端：ASR 接入
- 前端：会话列表页
- 前端：会话详情页（转写/摘要/策略）

**任务 3.3：任务提醒模块**
- 后端：任务 API
- 后端：SOP 任务自动生成逻辑
- 前端：任务中心（列表 + 日历视图）

**任务 3.4：咨询师仪表盘**
- 后端：个人指标 API
- 前端：仪表盘页面（今日待办/我的客户/个人业绩）

### 阶段四：AI Agent 集成

**任务 4.1：跟进策略生成**
- Prompt 模板编写
- Agent 逻辑链：面诊内容 → 关联策略模板 → 生成个性化策略
- 前端：策略展示与一键采纳

**任务 4.2：话术库**
- AI 话术提取逻辑
- 后端：话术 CRUD + 审核 API
- 前端：话术库页面

**任务 4.3：精准营销**
- AI 客户匹配算法
- AI 个性化话术生成
- 后端：营销活动 + 触达记录 API
- 前端：营销中心页面

---

## AI/Agent 开发指南

### Prompt 模板管理
- 所有 Prompt 模板存放在 `packages/ai-engine/prompts/` 目录
- 每个 Prompt 使用 YAML 格式，包含：名称、描述、模板、变量说明
- Prompt 修改需要记录版本号

### Agent 逻辑链
标准处理流程：
```
触发条件 → 数据读取 → 策略模板匹配 → Prompt 组装 → LLM 调用 → 结果解析 → 输出
```

**关键点**：AI 生成跟进策略时，必须先查询管理员配置的策略模板，将匹配到的模板内容注入 Prompt 作为"企业最佳实践"参考。

### LLM 调用规范
- 统一通过 `packages/ai-engine/services/llm.service.ts` 封装调用
- 支持流式输出（streaming）
- 设置合理的超时时间（默认 30s）
- 记录每次调用的 token 消耗
- 实现重试机制（最多 3 次）

### ASR 集成
- 支持上传音频文件（mp3/wav/m4a）
- 异步处理：上传 → 转写队列 → 转写完成通知
- 转写结果存储在会话记录中

---

## 环境变量

```bash
# .env.example

# 应用
APP_PORT=3000
APP_ENV=development

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=tongquetai

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# 默认管理员账号（首次启动自动创建）
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=change_me_in_production

# AI/LLM
DEEPSEEK_API_KEY=your_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com

# ASR（语音转写）
ASR_PROVIDER=xunfei  # xunfei | aliyun
ASR_API_KEY=your_asr_key
ASR_API_SECRET=your_asr_secret

# 文件存储
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=50mb
```

---

## 常用命令

```bash
# 安装依赖
pnpm install

# 启动开发环境（前后端同时启动）
pnpm run dev

# 仅启动前端
pnpm run dev:web

# 仅启动后端
pnpm run dev:server

# 类型检查
pnpm run type-check

# Lint 检查与修复
pnpm run lint
pnpm run lint:fix

# 构建生产版本
pnpm run build

# 运行数据库迁移
pnpm run migration:run

# 生成数据库迁移
pnpm run migration:generate -- -n MigrationName

# 回滚数据库迁移
pnpm run migration:revert

# 运行测试
pnpm run test

# 运行端到端测试
pnpm run test:e2e
```

---

## CC 开发注意事项

1. **每次开始工作前**：先读取本文件和 `PRD.md`，了解当前项目状态和需求
2. **数据安全优先**：医美客户数据极其敏感，任何涉及 PII 的操作必须加密
3. **权限是第一优先级**：所有 API 必须先实现权限控制，再实现业务逻辑
4. **数据隔离不可遗漏**：consultant 角色的每个查询都必须注入 `consultantId` 过滤
5. **模块化开发**：每个功能模块独立开发、独立测试，避免耦合
6. **渐进式实现**：先跑通核心链路，再优化细节
7. **中文优先**：业务注释、提交信息、文档使用中文
8. **不要猜测业务逻辑**：如果 PRD 中没有明确说明，先询问再实现
9. **Prompt 工程**：AI 相关功能需要反复调试 Prompt，记录最佳版本
10. **代码质量**：每个 PR 合并前必须通过 lint 和类型检查
11. **Git 管理**：小步提交，每个 commit 对应一个完整的功能点
12. **文档同步**：API 变更时同步更新 Swagger 文档和 `docs/api/` 目录

---

## 待办事项 / 进度追踪

> CC 在开发过程中应更新此区域，记录当前进度和待解决问题。

### 当前状态：项目初始化阶段

#### 阶段一：基础架构
- [ ] 项目初始化（monorepo 搭建、依赖安装）
- [ ] 用户认证与 RBAC 权限模块
- [ ] 数据库设计与实体定义

#### 阶段二：管理员后台
- [ ] 咨询师管理（增删改查）
- [ ] 跟进策略模板管理
- [ ] SOP 模板配置
- [ ] 管理员仪表盘

#### 阶段三：咨询师工作台
- [ ] 客户画像模块
- [ ] 会话分析模块
- [ ] 任务提醒模块
- [ ] 咨询师仪表盘

#### 阶段四：AI Agent 集成
- [ ] 跟进策略生成（关联策略模板）
- [ ] 话术库
- [ ] 精准营销

#### 阶段五：测试与上线
- [ ] 权限越级测试
- [ ] 数据安全测试
- [ ] 部署上线

---

## 参考资料

- [Vue 3 文档](https://vuejs.org/)
- [NestJS 文档](https://nestjs.com/)
- [TypeORM 文档](https://typeorm.io/)
- [DeepSeek API 文档](https://platform.deepseek.com/api-docs)
- [Element Plus 文档](https://element-plus.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [NestJS RBAC](https://docs.nestjs.com/security/authorization)
