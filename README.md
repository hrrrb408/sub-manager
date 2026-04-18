# SubManager - 订阅管理平台

一个功能完整的 SaaS 订阅管理平台，支持多用户注册登录，追踪和管理各类在线服务订阅支出。

## 功能特性

### 多用户认证

- **邮箱密码注册/登录** — 支持 email + password 注册和登录
- **OAuth 登录** — 支持 GitHub、Google 第三方登录（需配置环境变量）
- **JWT 会话** — 基于 JWT 的无状态会话管理
- **数据隔离** — 每个用户只能看到自己的订阅和配置数据
- **路由保护** — 未登录用户自动跳转到登录页

### 订阅管理

- **订阅 CRUD** — 添加、编辑、删除订阅，支持卡片视图、表格视图和日历视图切换
- **多维度筛选** — 按状态（活跃/试用中/已取消/已过期）、分类、平台名称进行筛选，支持关键词搜索（300ms 防抖）
- **表格高级功能** — 支持按名称/金额/日期/平台排序、全选/多选批量操作、分页浏览
- **续费管理** — 一键续费（自动按计费周期延长到期日期）+ 手动编辑
- **到期自动检测** — 访问列表时自动将已过期的活跃订阅标记为「已过期」状态
- **自动推算续费日** — 只需设置开始日期和计费周期，系统自动计算下一次续费日期，无需手动填写到期日期
- **即将到期提醒** — 根据每个订阅的「提前提醒天数」设置，在仪表盘醒目显示即将到期的订阅
- **重复检测** — 添加订阅时实时检测同名同平台的活跃订阅，即时显示警告
- **软删除** — 删除订阅后支持 5 秒内撤销，防止误操作
- **批量导入** — 支持 CSV / JSON 文件拖拽导入，自动中英文字段映射和数据预览

### 日历视图

- **月度日历** — 在日历网格中直观展示订阅续费日期
- **分类色彩** — 不同分类的订阅用不同颜色标记，一目了然
- **月份导航** — 前后月份切换，点击日期查看当天到期的订阅详情

### 财务分析

- **支出总览** — 月度总支出、年度预算、活跃订阅数、即将续费数
- **分类分析** — 按分类维度的月度支出占比饼图
- **平台排名** — 按平台维度的支出柱状图
- **趋势图** — 最近 6 个月的支出趋势面积图
- **多币种支持** — USD / EUR / GBP / CNY / JPY，自动汇率换算
- **预算告警** — 设置月度/年度预算，实时显示预算使用进度
- **年度报告** — 生成年度订阅消费总结，按分类和平台维度分析全年支出

### 到期通知

- **邮件通知** — 通过 SMTP 发送到期提醒邮件（支持 QQ 邮箱、163、Gmail、Outlook 等）
- **Webhook 通知** — 推送到钉钉群机器人、企业微信群机器人、飞书群机器人
- **自动定时检查** — 服务端内置 node-cron 定时任务，每天在设定时间自动检查并发送通知
- **手动触发** — 支持随时手动检查并发送通知
- **测试发送** — 配置完成后可发送测试邮件/通知验证配置是否正确
- **通知记录** — 查看历史通知的发送状态、时间、内容

### 账号凭证管理

- **加密存储** — 密码使用 AES 算法加密存储，API 端永远不接触明文
- **主密钥机制** — 加密密钥存储在浏览器 localStorage 中，不会上传服务器
- **凭证查看** — 点击查看加密密码，需输入主密钥解密，支持一键复制

### 数据管理

- **数据导出** — 导出为 CSV（带 BOM 支持中文）或 JSON 格式
- **数据备份与恢复** — 全量数据库备份（下载 JSON 文件）和一键恢复（上传备份文件），使用数据库事务确保原子性
- **演示数据** — 内置 seed 接口，一键生成演示订阅数据

### 用户体验

- **深色/浅色主题** — 支持明暗主题切换
- **命令面板** — `Cmd+K` 快速搜索订阅、跳转功能、切换主题
- **键盘快捷键** — `N` 新建订阅、`/` 聚焦搜索、`Cmd+K` 打开命令面板
- **PWA 支持** — 可安装为桌面/移动应用，离线访问基础页面
- **骨架屏** — 数据加载时显示骨架占位，避免布局跳动
- **乐观更新** — 操作后立即更新 UI，无需等待服务器响应，失败自动回滚
- **错误边界** — 单个组件崩溃不影响整个页面，支持一键重试
- **移动端适配** — 响应式布局，头部精简，移动端下拉菜单操作

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router, Turbopack) |
| 语言 | TypeScript 5 |
| 数据库 | MySQL (Prisma 6 ORM) |
| 认证 | NextAuth.js v5 (Auth.js) |
| UI 组件 | shadcn/ui (base-nova 风格, Radix v2) |
| 样式 | Tailwind CSS v4 (OKLCH 色彩空间) |
| 图表 | Recharts 3 |
| 邮件 | Nodemailer 8 |
| 定时任务 | node-cron 4 |
| 客户端加密 | crypto-js (AES) |
| 日期 | date-fns 4 |
| 命令面板 | cmdk |
| 通知 | Sonner |
| 图标 | Lucide React |

## 环境要求

- Node.js 18+
- MySQL 5.7+ 或 8.0+
- npm 9+

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd 订阅管理
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# 数据库
DATABASE_URL="mysql://用户名:密码@localhost:3306/sub_manager"

# NextAuth 认证（必填）
AUTH_SECRET="生成一个随机密钥"
AUTH_URL="http://localhost:3000"

# OAuth 登录（可选，不配置则仅支持邮箱密码登录）
# GITHUB_ID=""
# GITHUB_SECRET=""
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
```

### 4. 初始化数据库

```bash
npx prisma db push
```

### 5. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 http://localhost:3000，首次使用需注册账号。

### 6. 生成演示数据（可选）

登录后，通过 API 一键生成演示数据：

```bash
curl -X POST http://localhost:3000/api/seed -b <your-auth-cookie>
```

## 使用指南

### 注册与登录

1. 首次访问会自动跳转到登录页
2. 点击「注册账号」创建新用户（邮箱 + 密码，密码至少 6 位）
3. 注册成功后自动跳转到登录页，输入邮箱密码登录
4. 如果配置了 GitHub / Google OAuth，也可以直接点击第三方登录

### 添加订阅

1. 点击右上角「添加订阅」按钮，或按 `N` 键
2. 填写订阅信息：
   - **必填项**：服务名称、平台、金额、开始日期
   - **选填项**：订阅计划、分类、币种、计费周期、到期日期、状态、支付方式、服务网址、备注
   - **凭证（可选）**：登录账号、密码（AES 加密存储）
3. 如果存在同名同平台的活跃订阅，表单顶部会显示黄色警告
4. 点击「添加」完成

### 续费订阅

- **一键续费**：在订阅卡片/表格中点击「续费」按钮，系统自动按计费周期延长到期日期
- **手动编辑**：点击「编辑」按钮，手动修改到期日期和其他信息

### 配置到期通知

1. 切换到「设置」标签页
2. 配置邮件通知或 Webhook 通知
3. 设置定时检查时间（默认每天 9 点）
4. 点击「保存设置」

### 常见 SMTP 配置

| 邮箱 | SMTP 服务器 | 端口 | 密码说明 |
|------|------------|------|---------|
| QQ 邮箱 | `smtp.qq.com` | 465 | 需在邮箱设置中开启 SMTP 并获取授权码 |
| 163 邮箱 | `smtp.163.com` | 465 | 需在邮箱设置中开启 SMTP 并获取授权码 |
| Gmail | `smtp.gmail.com` | 587 | 需生成应用专用密码 |
| Outlook | `smtp.office365.com` | 587 | 直接使用账号密码 |

### 设置主密钥

主密钥用于加密和解密存储的密码：

1. 点击右上角盾牌/钥匙图标
2. 首次使用：设置主密钥（至少 6 个字符）并确认
3. 已配置：输入当前主密钥验证后可更新

> 主密钥仅存储在浏览器 localStorage 中，清除浏览器数据后需重新输入。

### 数据备份与恢复

- **备份**：设置页 → 数据管理 → 下载数据备份（全量 JSON 文件）
- **恢复**：上传备份文件，确认后覆盖当前数据（使用数据库事务确保原子性）

### 命令面板

按 `Cmd+K`（Windows: `Ctrl+K`）打开命令面板，支持：
- 搜索订阅并跳转
- 快速执行操作（新建、导入、导出、切换主题）
- 通过关键词快速导航

## 项目结构

```
├── prisma/
│   └── schema.prisma          # 数据库模型定义
├── public/
│   ├── manifest.json          # PWA 配置
│   ├── sw.js                  # Service Worker
│   └── icon.svg               # 应用图标
├── src/
│   ├── app/
│   │   ├── layout.tsx         # 根布局（主题、Toast、AuthProvider）
│   │   ├── page.tsx           # 主页面（三标签页）
│   │   ├── login/page.tsx     # 登录页
│   │   ├── register/page.tsx  # 注册页
│   │   ├── instrumentation.ts # 服务启动钩子（初始化定时任务）
│   │   ├── middleware.ts      # 路由保护（认证检查）
│   │   └── api/
│   │       ├── auth/[...nextauth]/  # NextAuth API
│   │       ├── register/            # 用户注册
│   │       ├── subscriptions/       # 订阅 CRUD + 续费 + 导入
│   │       ├── stats/               # 统计数据
│   │       ├── budget/              # 预算配置
│   │       ├── exchange-rate/       # 汇率查询
│   │       ├── report/              # 年度报告
│   │       ├── backup/              # 数据备份/恢复
│   │       ├── notify-config/       # 通知配置
│   │       ├── notify-check/        # 触发检查 + 发送通知
│   │       ├── notify-test/         # 发送测试通知
│   │       ├── notify-logs/         # 通知日志
│   │       └── seed/                 # 演示数据
│   ├── components/
│   │   ├── subscriptions/     # 业务组件（表单、卡片、表格等）
│   │   ├── dashboard/         # 仪表盘组件
│   │   ├── charts/            # 图表组件
│   │   ├── ui/                # shadcn/ui 基础组件
│   │   ├── error-boundary.tsx # 错误边界
│   │   └── theme-provider.tsx # 主题上下文
│   └── lib/
│       ├── auth.ts            # NextAuth v5 配置
│       ├── auth-context.tsx   # 客户端 AuthProvider + useAuth
│       ├── get-user.ts        # 服务端获取当前用户 ID
│       ├── prisma.ts          # Prisma 单例
│       ├── types.ts           # 类型定义、常量、工具函数
│       ├── crypto.ts          # 客户端 AES 加密/解密
│       ├── notify.ts          # 通知发送服务
│       ├── scheduler.ts       # 定时任务调度器
│       ├── register-sw.ts     # Service Worker 注册
│       └── utils.ts           # 通用工具
├── .env                       # 环境变量
├── package.json
└── next.config.ts
```

## 数据库模型

### User（用户）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (CUID) | 主键 |
| email | String | 邮箱（唯一） |
| name | String? | 显示名称 |
| password | String? | 密码哈希（bcrypt） |
| image | String? | 头像 |
| createdAt | DateTime | 创建时间 |

### Subscription（订阅）

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | String | 所属用户 |
| name | String | 服务名称 |
| platform | String | 平台名称 |
| plan | String | 订阅计划 |
| amount | Float | 金额 |
| currency | String | 币种（USD/EUR/GBP/CNY/JPY） |
| billingCycle | String | 计费周期（monthly/yearly/weekly） |
| status | String | 状态（active/trialing/cancelled/expired） |
| category | String | 分类 |
| startDate | DateTime | 开始日期 |
| endDate | DateTime? | 到期日期（可选，系统可自动推算） |
| encryptedPassword | String? | AES 加密后的密码 |
| remindDays | Int | 提前提醒天数（默认 7） |

### 其他模型

- **NotificationConfig** — 每用户通知配置（SMTP、Webhook、定时检查时间）
- **NotificationLog** — 通知发送日志
- **BudgetConfig** — 每用户预算配置
- **Account / Session / VerificationToken** — NextAuth.js 所需的标准模型

## API 接口

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/register` | 注册新用户 |
| POST | `/api/auth/[...nextauth]` | NextAuth 登录/登出/会话 |

### 订阅管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/subscriptions` | 获取订阅列表 |
| POST | `/api/subscriptions` | 创建订阅（含重复检测） |
| PUT | `/api/subscriptions/[id]` | 更新订阅 |
| DELETE | `/api/subscriptions/[id]` | 删除订阅 |
| POST | `/api/subscriptions/[id]/renew` | 续费 |
| POST | `/api/subscriptions/import` | 批量导入 |

### 统计分析

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats` | 获取统计数据 |
| GET | `/api/exchange-rate` | 获取实时汇率 |
| GET | `/api/report` | 获取年度报告 |
| GET | `/api/budget` | 获取预算配置 |
| PUT | `/api/budget` | 更新预算配置 |

### 通知

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notify-config` | 获取通知配置 |
| PUT | `/api/notify-config` | 更新通知配置 |
| POST | `/api/notify-check` | 手动触发通知 |
| POST | `/api/notify-test` | 发送测试通知 |
| GET | `/api/notify-logs` | 获取通知日志 |

### 数据管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/backup` | 导出全量备份 |
| POST | `/api/backup` | 从备份恢复 |
| POST | `/api/seed` | 生成演示数据 |

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run lint             # ESLint 代码检查

# 测试
npm test                 # 运行所有测试
npm run test:watch       # 监听模式运行测试

# 数据库
npx prisma db push       # 推送 schema 变更到数据库
npx prisma generate      # 重新生成 Prisma Client

# 类型检查
npx tsc --noEmit         # TypeScript 类型检查（推荐）
```

## 测试

项目使用 **Vitest** 作为测试框架，包含单元测试和 API 路由集成测试。

### 测试结构

```
src/
├── lib/__tests__/
│   ├── types.test.ts            # getNextRenewalDate, formatAmount 等纯函数测试
│   └── server-crypto.test.ts    # AES-256-GCM 加解密测试
├── app/api/__tests__/
│   ├── subscriptions.test.ts    # 订阅 CRUD API 测试（认证、过滤、重复检测）
│   ├── budget.test.ts           # 预算 API 测试（默认值、upsert）
│   └── register.test.ts         # 注册 API 测试（验证、重复邮箱）
└── __tests__/
    ├── setup.ts                 # 全局测试配置
    └── helpers.ts               # Mock 工具函数
```

### 运行测试

```bash
npm test                 # 运行全部测试
npm run test:watch       # 监听模式（开发时使用）
npx vitest run src/lib/  # 只运行单元测试
```

## Docker 部署

### 一键启动（推荐）

```bash
# 1. 复制环境变量文件并填入配置
cp .env.example .env
# 编辑 .env，至少设置 AUTH_SECRET 和 DATABASE_URL

# 2. 启动服务（包含 MySQL + 应用）
docker compose up -d

# 3. 查看日志
docker compose logs -f app
```

启动后访问 http://localhost:3000。

### 手动 Docker 构建

```bash
# 构建镜像
docker build -t sub-manager .

# 运行（需要外部 MySQL）
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://root:password@mysql-host:3306/sub_manager" \
  -e AUTH_SECRET="your-secret" \
  -e AUTH_URL="http://localhost:3000" \
  sub-manager
```

### 开发模式 Docker

```bash
# 使用开发配置（支持热重载）
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Docker Compose 服务说明

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| mysql | mysql:8.0 | 3307:3306 | 数据库，数据持久化到 Docker volume |
| app | 自构建 | 3000:3000 | Next.js 应用，依赖 MySQL 健康检查后启动 |

## 注意事项

1. **Turbopack 中文路径问题**：项目路径包含中文字符时，Turbopack 生成内部标识符可能出现 UTF-8 字节切割错误。已在 `next.config.ts` 中设置 `turbopack.root` 为项目目录来规避此问题。
2. **密码安全**：订阅密码在客户端通过 AES 加密后才发送到服务器，服务端永远不接触明文。
3. **数据隔离**：所有 API 路由均通过 `getUserId()` 获取当前用户 ID，所有数据库查询都按 userId 过滤，确保用户间数据完全隔离。
4. **定时任务**：通知检查随 Next.js 服务启动自动运行，无需额外配置 cron job。
5. **时区处理**：所有日期比较均规范化为当天零点后进行，避免 UTC 与本地时间差异导致的天数计算不一致。
6. **PWA**：生产环境部署后可通过浏览器「安装到桌面」功能作为独立应用使用。
