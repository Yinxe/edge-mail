# edge-mail — 基于 Cloudflare 的域名信箱系统设计文档

## 概述

基于 Cloudflare Email Routing + Workers + D1 构建个人域名信箱系统。
MVP 阶段：任何外部邮箱向 `*@yourdomain.com` 发送邮件 → 系统接收并存库 → Web 界面查看。

## 需求

| 项目 | 决策 |
|------|------|
| 场景 | 个人邮件中转站，只收不发（MVP 不实现回复/发送） |
| 域名 | Cloudflare 域名，Email Routing 待配置 |
| 前端 | Vue 3 + TailwindCSS + Naive UI |
| 后端 | Cloudflare Worker (email handler + HTTP API) |
| 存储 | Cloudflare D1 (emails + email_bodies 双表) |
| 鉴权 | 简单密码鉴权，HMAC Token 24h 过期 |
| 架构 | Monorepo (pnpm workspace)，前端 Pages + 后端 Worker 分离部署 |

## 系统架构

```
外部发件人
    │
    ▼
Cloudflare Email Routing (*@domain.com)
    │
    ▼
┌──── Worker ─────────────────────────────────┐
│                                              │
│  email(ForwardableEmailMessage)              │
│    ├─ postal-mime 解析 MIME                  │
│    ├─ 提取 Message-ID 去重                    │
│    └─ 写入 D1（emails + email_bodies）        │
│                                              │
│  fetch(Request)                              │
│    ├─ POST /api/auth      密码→HMAC token    │
│    ├─ GET  /api/emails    邮件列表（分页）     │
│    ├─ GET  /api/emails/:id 邮件详情（已读标记） │
│    └─ PUT  /api/emails/:id/read 标记已读      │
│                                              │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
              D1 Database
         ┌──────────────────┐
         │      emails      │── 元数据（from/to/subject/date/is_read）
         │   email_bodies   │── 正文（text/html + headers JSON）
         └──────────────────┘

┌──── Cloudflare Pages ────────────────────────┐
│                                              │
│  Vue 3 SPA                                   │
│    ├─ /login         密码登录                 │
│    └─ /inbox         邮件列表 + 详情面板       │
│                                              │
│  VITE_API_BASE → Worker 地址                │
│                                              │
└──────────────────────────────────────────────┘
```

## 项目结构 (Monorepo)

```
edge-mail/
├── packages/
│   ├── worker/                 # Cloudflare Worker
│   │   ├── src/
│   │   │   ├── index.ts              # email() + fetch() 入口
│   │   │   ├── email-handler.ts      # 收邮件解析存储
│   │   │   ├── api/
│   │   │   │   ├── auth.ts           # HMAC 鉴权
│   │   │   │   ├── emails.ts         # 邮件 CRUD API
│   │   │   │   └── router.ts         # URL 路由分发
│   │   │   ├── db.ts                 # D1 查询封装
│   │   │   └── types.ts              # 类型定义
│   │   ├── schema.sql                # D1 建表语句
│   │   ├── wrangler.jsonc
│   │   └── package.json
│   │
│   └── web/                    # Vue 3 前端
│       ├── src/
│       │   ├── App.vue
│       │   ├── views/
│       │   │   ├── LoginView.vue
│       │   │   └── InboxView.vue
│       │   ├── components/
│       │   │   ├── EmailSidebar.vue
│       │   │   └── EmailDetail.vue
│       │   ├── api.ts
│       │   ├── router.ts
│       │   └── store.ts
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── .env                       # VITE_API_BASE
│       ├── wrangler.jsonc
│       └── package.json
│
├── package.json                # workspace root
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 数据库设计

### 表结构 (D1 / SQLite)

```sql
-- 邮件元数据（列表查询轻量）
CREATE TABLE emails (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id  TEXT NOT NULL UNIQUE,
  sender      TEXT NOT NULL,
  recipient   TEXT NOT NULL,
  subject     TEXT NOT NULL DEFAULT '',
  raw_size    INTEGER,
  is_read     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 邮件正文 + 原始头（详情查询，大字段隔离）
CREATE TABLE email_bodies (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  email_id  INTEGER NOT NULL UNIQUE REFERENCES emails(id),
  text_body TEXT,
  html_body TEXT,
  headers   TEXT   -- JSON
);

CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
```

- `message_id` 做唯一约束，利用 SMTP Message-ID 防重
- 列表页只查 `emails` 表，分页高效
- 详情页 JOIN `email_bodies`，只查一条

## API 设计

| Method | Path | Request | Response | Auth |
|--------|------|---------|----------|------|
| POST | `/api/auth` | `{password}` | `{token, expiresAt}` | 无 |
| GET | `/api/emails?page=&limit=` | — | `{items[], total, page, limit}` | Token |
| GET | `/api/emails/:id` | — | `{item, body}` | Token |
| PUT | `/api/emails/:id/read` | `{is_read: bool}` | `{ok: true}` | Token |

### Auth 流程

1. Worker 环境变量配置 `AUTH_PASSWORD`（Secret）和 `AUTH_SECRET`（Secret，用于 HMAC 签名）
2. 前端 POST `/api/auth` 提交密码
3. Worker 比对密码，用 `AUTH_SECRET` 生成 HMAC token（24h 过期）
4. 前端 localStorage 存储 token，后续请求带 `Authorization: Bearer <token>`
5. 所有 API（除 `/api/auth`）由鉴权中间件校验

### CORS

Worker 响应加 `Access-Control-Allow-Origin: Pages 域名`，允许前端跨域。

## 前端设计

### 路由

| Path | 组件 | 说明 |
|------|------|------|
| `/login` | LoginView | 密码输入框 |
| `/inbox` | InboxView | 邮件列表（左侧）+ 详情面板（右侧） |
| `/inbox/:id` | InboxView | 选中指定邮件展开详情 |

### 组件树

```
App.vue
├─ LoginView
│   └─ n-input (password) + n-button (登录)
│
└─ InboxView
    ├─ EmailSidebar
    │   ├─ n-list (邮件条目：sender | subject | date)
    │   └─ n-pagination
    │
    └─ EmailDetail
        ├─ 邮件头: from / to / subject / created_at
        ├─ n-tag (已读/未读)
        └─ 正文渲染: html_body 用 v-html 或 iframe, text_body 用 <pre>
```

### 状态管理

```typescript
// 简易响应式 store，不需要 Pinia
// store.ts
export const token = ref(localStorage.getItem('token') || '')
export const emails = ref<EmailMeta[]>([])
export const currentEmail = ref<EmailDetail | null>(null)
```

### 前端 API 地址

```bash
# .env
VITE_API_BASE=https://edge-mail-worker.xxx.workers.dev
# 本地开发: VITE_API_BASE=http://localhost:8787
```

## Worker 配置

```jsonc
// packages/worker/wrangler.jsonc
{
  "name": "edge-mail-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-05-16",
  "d1_databases": [{
    "binding": "DB",
    "database_name": "edge-mail-db",
    "database_id": "xxx"            // 执行 d1 create 后填入
  }]
}
```

> Email Routing 不需要在 wrangler.jsonc 中声明 binding，只需在 Dashboard/CLI 配置路由规则 `*@domain.com` → `edge-mail-worker`。

## 部署流程

```bash
# 1. 开通 Email Routing
npx wrangler email routing enable yourdomain.com

# 2. 创建 D1 数据库
npx wrangler d1 create edge-mail-db

# 3. 初始化表结构
npx wrangler d1 execute edge-mail-db --file=packages/worker/schema.sql

# 4. 设置密钥
npx wrangler secret put AUTH_PASSWORD  # 交互输入密码
npx wrangler secret put AUTH_SECRET    # 交互输入 HMAC 密钥

# 5. 部署 Worker
npx wrangler deploy --config packages/worker/wrangler.jsonc

# 6. 配置 Email Routing 规则: *@domain.com → edge-mail-worker (Dashboard 或 CLI)

# 7. 部署前端
cd packages/web && npx wrangler pages deploy dist --project-name=edge-mail-web
```

## 依赖

### Worker: `packages/worker/package.json`
- `postal-mime` — 解析 MIME
- `@cloudflare/workers-types`

### Web: `packages/web/package.json`
- `vue` ^3.5
- `vue-router` ^4
- `naive-ui` ^2
- `tailwindcss` ^4
- `vite`
- `@vitejs/plugin-vue`
