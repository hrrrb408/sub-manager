# SubManager - 订阅管理平台

一个功能完整的 SaaS 订阅管理平台，用于追踪和管理你在各类在线服务上的订阅支出，包括 Stripe、LangSmith、Supabase、Vercel、OpenAI、Anthropic、GitHub Copilot 等平台。

## 功能特性

### 订阅管理

- **订阅 CRUD** — 添加、编辑、删除订阅，支持卡片视图和表格视图切换
- **多维度筛选** — 按状态（活跃/试用中/已取消/已过期）、分类（开发工具/AI 服务/设计工具/营销工具/效率工具/基础设施/其他）、平台名称进行筛选，支持关键词搜索（300ms 防抖）
- **续费管理** — 一键续费（自动按计费周期延长到期日期）+ 手动编辑
- **到期自动检测** — 访问列表时自动将已过期的活跃订阅标记为「已过期」状态
- **自动推算续费日** — 只需设置开始日期和计费周期，系统自动计算下一次续费日期，无需手动填写到期日期
- **即将到期提醒** — 根据每个订阅的「提前提醒天数」设置，在仪表盘醒目显示即将到期的订阅

### 财务分析

- **支出总览** — 月度总支出、年度预算、活跃订阅数、即将续费数
- **分类分析** — 按分类维度的月度支出占比饼图
- **平台排名** — 按平台维度的支出柱状图
- **趋势图** — 最近 6 个月的支出趋势面积图
- **多币种支持** — USD / EUR / GBP / CNY / JPY

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

### 其他

- **深色/浅色主题** — 支持明暗主题切换
- **数据导出** — 导出为 CSV（带 BOM 支持中文）或 JSON 格式
- **移动端适配** — 响应式布局，支持手机和平板访问
- **演示数据** — 内置 seed 接口，一键生成 12 条演示订阅数据

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 5 |
| 数据库 | MySQL (Prisma 6 ORM) |
| UI 组件 | shadcn/ui (base-nova 风格, Radix v2) |
| 样式 | Tailwind CSS v4 (OKLCH 色彩空间) |
| 图表 | Recharts 3 |
| 邮件 | Nodemailer 8 |
| 定时任务 | node-cron 4 |
| 加密 | crypto-js (AES) |
| 日期 | date-fns 4 |
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

### 3. 配置数据库

在项目根目录创建 `.env` 文件：

```env
DATABASE_URL="mysql://用户名:密码@localhost:3306/sub_manager"
```

然后推送数据库结构：

```bash
npx prisma db push
```

### 4. 启动开发服务器

```bash
npm run dev
```

默认端口 3000，也可以指定端口：

```bash
npx next dev --port 3999
```

打开浏览器访问 http://localhost:3000 即可使用。

### 5. 生成演示数据（可选）

启动后，通过 API 一键生成演示数据：

```bash
curl -X POST http://localhost:3000/api/seed
```

将生成 12 条涵盖各分类的演示订阅数据。

## 使用指南

### 添加订阅

1. 点击右上角「添加订阅」按钮
2. 填写订阅信息：
   - **必填项**：服务名称、平台、金额、开始日期
   - **选填项**：订阅计划、分类、币种、计费周期（月付/年付/周付）、到期日期、状态、支付方式、服务网址、备注
   - **凭证（可选）**：登录账号、密码（AES 加密存储）
3. 点击「添加」完成

### 续费订阅

有两种方式：

- **一键续费**：在订阅卡片/表格中点击「续费」按钮，系统自动按计费周期延长到期日期（月付 +1 月，年付 +1 年，周付 +1 周）
- **手动编辑**：点击「编辑」按钮，手动修改到期日期和其他信息

### 配置到期通知

1. 切换到「设置」标签页
2. 配置邮件通知：
   - 开启邮件通知开关
   - 填写 SMTP 服务器信息（见下方常见 SMTP 配置）
   - 点击「发送测试邮件」验证配置
3. 配置 Webhook 通知：
   - 开启 Webhook 通知开关
   - 选择推送平台（钉钉/企业微信/飞书）
   - 填写 Webhook URL
   - 点击「发送测试通知」验证配置
4. 设置定时检查时间（默认每天 9 点）
5. 点击「保存设置」

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

> 主密钥仅存储在浏览器 localStorage 中，清除浏览器数据后需重新输入。请务必记住你的主密钥，丢失后无法恢复已加密的密码。

### 导出数据

点击右上角下载图标，选择导出格式：

- **CSV**：带 BOM 头，Excel 可直接打开，支持中文字符
- **JSON**：结构化数据，方便程序处理

## 项目结构

```
├── prisma/
│   └── schema.prisma          # 数据库模型定义
├── src/
│   ├── app/
│   │   ├── layout.tsx         # 根布局（主题、Toast）
│   │   ├── page.tsx           # 主页面（三标签页）
│   │   ├── instrumentation.ts # 服务启动钩子（初始化定时任务）
│   │   └── api/
│   │       ├── subscriptions/   # 订阅 CRUD + 续费
│   │       ├── stats/           # 统计数据
│   │       ├── notify-config/   # 通知配置 GET/PUT
│   │       ├── notify-check/    # 触发检查 + 发送通知
│   │       ├── notify-test/     # 发送测试通知
│   │       ├── notify-logs/     # 通知日志
│   │       └── seed/            # 演示数据
│   ├── components/
│   │   ├── subscriptions/     # 业务组件
│   │   ├── dashboard/         # 仪表盘组件
│   │   ├── charts/            # 图表组件
│   │   ├── ui/                # shadcn/ui 基础组件
│   │   └── theme-provider.tsx # 主题上下文
│   └── lib/
│       ├── prisma.ts          # Prisma 单例
│       ├── types.ts           # 类型定义、常量、工具函数
│       ├── crypto.ts          # AES 加密/解密
│       ├── notify.ts          # 通知发送服务
│       ├── scheduler.ts       # 定时任务调度器
│       └── utils.ts           # 通用工具
├── .env                       # 环境变量（DATABASE_URL）
├── package.json
└── next.config.ts
```

## 数据库模型

### Subscription（订阅）

| 字段 | 类型 | 说明 |
|------|------|------|
| name | String | 服务名称 |
| platform | String | 平台名称 |
| plan | String | 订阅计划 |
| amount | Float | 金额 |
| currency | String | 币种（USD/EUR/GBP/CNY/JPY） |
| billingCycle | String | 计费周期（monthly/yearly/weekly） |
| status | String | 状态（active/trialing/cancelled/expired） |
| category | String | 分类（development/ai/design/marketing/productivity/infrastructure/other） |
| startDate | DateTime | 开始日期 |
| endDate | DateTime? | 到期日期（可选，系统可自动推算） |
| account | String? | 登录账号 |
| encryptedPassword | String? | AES 加密后的密码 |
| remindDays | Int | 提前提醒天数（默认 7） |

### NotificationConfig（通知配置）

单例模型（id 固定为 "default"），存储邮件 SMTP 配置、Webhook 配置和定时检查时间。

### NotificationLog（通知日志）

记录每次通知发送的类型（email/webhook）、状态（success/failed）、标题和错误信息。

## 通知工作流程

```
服务启动 → instrumentation.ts → scheduler.ts (node-cron)
                                      │
                              每分钟检查一次
                                      │
                          当前时间 == 配置的检查小时？
                             │                │
                            是               否
                             │                │
                    checkAndNotify()      等待下一分钟
                             │
                   查询所有活跃订阅
                             │
              根据 startDate + billingCycle
              自动计算下次续费日期
                             │
              续费日期 - 今天 <= remindDays？
                    │              │
                   是             否
                    │              │
           邮件通知已启用？    跳过
           Webhook已启用？   跳过
                    │
              发送通知并记录日志
```

## API 接口

### 订阅管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/subscriptions` | 获取订阅列表（支持 status/category/platform/search 参数） |
| POST | `/api/subscriptions` | 创建订阅 |
| PUT | `/api/subscriptions/[id]` | 更新订阅 |
| DELETE | `/api/subscriptions/[id]` | 删除订阅 |
| POST | `/api/subscriptions/[id]/renew` | 续费（自动延长一个计费周期） |

### 统计分析

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats` | 获取统计数据（月/年支出、分类/平台分布、趋势、即将续费） |

### 通知

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notify-config` | 获取通知配置 |
| PUT | `/api/notify-config` | 更新通知配置 |
| POST | `/api/notify-check` | 手动触发检查并发送通知 |
| POST | `/api/notify-test` | 发送测试邮件/Webhook |
| GET | `/api/notify-logs` | 获取通知日志 |

### 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/seed` | 生成演示数据 |

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run lint             # ESLint 代码检查

# 数据库
npx prisma db push       # 推送 schema 变更到数据库
npx prisma generate      # 重新生成 Prisma Client

# 类型检查
npx tsc --noEmit         # TypeScript 类型检查（推荐）
```

## 注意事项

1. **Turbopack 中文路径问题**：Next.js 16 默认使用 Turbopack，项目路径包含中文字符可能导致部分路由编译失败。如遇此问题，API 路由应使用扁平路径（如 `/api/notify-config` 而非 `/api/notifications/config`）。
2. **密码安全**：密码在客户端通过 AES 加密后才发送到服务器，服务端永远不接触明文密码。主密钥仅存在于浏览器 localStorage 中。
3. **定时任务**：定时检查随 Next.js 服务启动自动运行，无需额外配置 cron job。服务停止后定时任务也会停止。
4. **时区处理**：所有日期比较均规范化为当天零点后进行，避免 UTC 与本地时间差异导致的天数计算不一致。
