# edge-mail 部署文档

基于 Cloudflare Email Routing + Workers + D1 + Pages 的域名信箱系统部署指南。

## 架构

```
外部邮件 → Cloudflare Email Routing (*@domain.com)
                ↓
         Worker (email handler + HTTP API)
                ↓
         D1 数据库 (emails + email_bodies)
                ↑
         Cloudflare Pages (Vue 3 SPA)
```

## 前置条件

| 条件 | 说明 |
|------|------|
| Cloudflare 账号 | 域名 DNS 托管在 Cloudflare |
| Node.js ≥ 20 | 开发环境 |
| pnpm ≥ 10 | 包管理器 |
| Cloudflare API Token | Workers、D1、Pages、Email Routing 权限 |

### 创建 Cloudflare API Token

1. 打开 [Cloudflare Dashboard → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. 创建 Token → 自定义模板
3. 权限勾选：**Account** → **Workers** (Edit)、**D1** (Edit)、**Email Routing** (Edit)、**Cloudflare Pages** (Edit)
4. 复制 Token，接下来的部署会用到

---

## 一、本地开发

### 1.1 安装依赖

```bash
pnpm install
```

### 1.2 配置本地环境变量

```bash
cp packages/web/.env.example packages/web/.env
```

密码和 HMAC 密钥写在 Worker 的 `.dev.vars` 中（不会提交到 git）：

```bash
# packages/worker/.dev.vars
AUTH_PASSWORD=你的密码
AUTH_SECRET=openssl rand -hex 32
```

### 1.3 初始化本地 D1 数据库

`wrangler dev` 使用本地 SQLite 模拟 D1，首次需要建表：

```bash
pnpm --filter worker db:local
```

### 1.4 启动开发服务

终端 1 — Worker：
```bash
pnpm dev:worker
# 监听 http://localhost:8787
```

终端 2 — 前端：
```bash
pnpm dev:web
# 监听 http://localhost:5173
```

前端通过 Vite 代理将 `/api` 请求转发到 Worker，无需手动配置跨域。

### 1.5 运行测试

```bash
pnpm --filter worker test
```

### 1.6 本地开发常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev:worker` | 启动 Worker 开发服务器 |
| `pnpm dev:web` | 启动前端开发服务器 |
| `pnpm --filter worker db:local` | 本地 D1 建表/重置 |
| `pnpm --filter worker test` | 运行单元测试 |
| `pnpm --filter worker tsc --noEmit` | Worker 类型检查 |
| `pnpm --filter web build` | 构建前端（输出到 dist/） |

---

## 二、手动部署（Cloudflare）

### 2.1 登录

```bash
npx wrangler login
```

### 2.2 开通 Email Routing

```bash
npx wrangler email routing enable yourdomain.com
```

> 替换 `yourdomain.com` 为你的实际域名。

### 2.3 创建 D1 数据库

```bash
npx wrangler d1 create edge-mail-db
```

输出示例：
```
✅ Created database 'edge-mail-db' with id: a1b2c3d4-...
```

将返回的 `database_id` 填入 `packages/worker/wrangler.jsonc`：

```jsonc
{
  "d1_databases": [{
    "binding": "DB",
    "database_name": "edge-mail-db",
    "database_id": "a1b2c3d4-..."   // ← 替换 xxx
  }]
}
```

### 2.4 初始化表结构

```bash
cd packages/worker
npx wrangler d1 execute edge-mail-db --file=schema.sql
```

### 2.5 设置 Worker 密钥

```bash
cd packages/worker
npx wrangler secret put AUTH_PASSWORD   # 输入登录密码
npx wrangler secret put AUTH_SECRET     # 输入 HMAC 密钥（推荐 openssl rand -hex 32）
```

### 2.6 部署 Worker

```bash
cd packages/worker
npx wrangler deploy
```

部署成功后输出类似：
```
Deployed email-worker (id: email-worker)
  https://email-worker.<你的子域名>.workers.dev
```

### 2.7 配置 Email Routing 规则

在 [Cloudflare Dashboard → Email Routing → Routing Rules](https://dash.cloudflare.com/) 中添加规则：

- **Custom address**: `*` (或 `*@yourdomain.com`)
- **Action**: Send to Worker → 选择 `email-worker`

也可以用 CLI：
```bash
npx wrangler email routing rules create yourdomain.com --action=worker --destination=email-worker
```

### 2.8 部署前端

```bash
cd packages/web

# 构建（注入 Worker 地址）
VITE_API_BASE=https://email-worker.<子域名>.workers.dev npx vite build

# 部署到 Cloudflare Pages
npx wrangler pages deploy dist --project-name=edge-mail-web
```

> 首次部署前需要创建 Pages 项目：
> ```bash
> npx wrangler pages project create edge-mail-web --production-branch=master
> ```

### 2.9 验证

访问 Pages 分配的域名（如 `https://edge-mail-web.pages.dev`），用设置的密码登录。

发送测试邮件到 `test@yourdomain.com`，确认能在收件箱中看到。

---

## 三、GitHub Actions 自动部署

### 3.1 配置 GitHub Secrets & Variables

进入仓库页面 → 顶部 **Settings** → 左侧 **Secrets and variables** → **Actions**。

你会看到页面顶部有两个标签页：

| 标签页 | 用途 | 引用方式 | 值是否加密 |
|--------|------|---------|-----------|
| **Secrets** | Token、密码等敏感信息 | `${{ secrets.NAME }}` | ✅ 日志中自动隐藏 |
| **Variables** | 非敏感的配置值（如 URL、ID） | `${{ vars.NAME }}` | ❌ 明文可见 |

> ⚠️ 页面还会看到 "Environment secrets/variables" 分区 — **不要用**。我们只需要 **Repository** 级别的配置，所有 job 都能访问。

---

**在 Secrets 标签页**点击 New repository secret，创建 4 个：

| Name | 说明 |
|------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（Workers + D1 + Pages + Email Routing 权限） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID（Dashboard 地址栏 `accounts/` 后面的 32 位 hex） |
| `AUTH_PASSWORD` | 登录密码（如 `123456`） |
| `AUTH_SECRET` | HMAC 签名密钥（`openssl rand -hex 32` 生成） |

**切换到 Variables 标签页**点击 New repository variable，创建 2 个：

| Name | 说明 |
|------|------|
| `D1_DATABASE_ID` | D1 数据库 UUID（`npx wrangler d1 create edge-mail-db` 返回的字符串） |
| `VITE_API_BASE` | Worker 部署后的 URL，如 `https://email-worker.xxx.workers.dev` |

### 3.2 一次性前置操作

```bash
# 1. 创建 Cloudflare Pages 项目（仅第一次）
npx wrangler pages project create edge-mail-web --production-branch=master

# 2. 在 Dashboard 配置 Email Routing 规则
#    *@yourdomain.com → email-worker
```

### 3.3 触发部署

- **Push to master** — 自动触发
- **手动触发** — Actions → Deploy → Run workflow

每次部署执行：

| 阶段 | 操作 |
|------|------|
| `deploy-worker` | 注入 `database_id` → D1 迁移 → `wrangler deploy` → `secret put` |
| `deploy-web` | `vite build` (注入 `VITE_API_BASE`) → `wrangler pages deploy` |

> Pages 部署依赖 Worker 先完成（`needs: deploy-worker`），确保前端绑定的 Worker 地址有效。

### 3.4 工作流文件

`.github/workflows/deploy.yml` — 完整配置见仓库文件，开箱即用。

---

## 四、环境变量参考

### Worker Secrets (`packages/worker/.dev.vars` 或 `wrangler secret put`)

| 变量 | 说明 | 示例 |
|------|------|------|
| `AUTH_PASSWORD` | 登录密码 | `my-secret-pw` |
| `AUTH_SECRET` | HMAC-SHA256 签名密钥 | `openssl rand -hex 32` |
| `ALLOWED_ORIGINS` | CORS 允许的域名（可选，默认 `*`） | `https://edge-mail-web.pages.dev` |

### 前端环境变量 (`packages/web/.env`)

| 变量 | 说明 | 本地开发 | 生产 |
|------|------|---------|------|
| `VITE_API_BASE` | Worker API 地址 | 留空（Vite 代理转发） | `https://email-worker.xxx.workers.dev` |

---

## 五、常见问题

### Q: 本地开发提示"密码错误"但密码正确

检查 `packages/worker/.dev.vars` 是否存在，内容格式正确（`KEY=VALUE`）。重启 `wrangler dev`。

### Q: 本地开发 `no such table: emails` 报错

运行 `pnpm --filter worker db:local` 初始化本地 D1。

### Q: wrangler deploy 失败（Database not found）

`wrangler.jsonc` 中的 `database_id` 仍为 `xxx`，未替换为实际的 D1 UUID。

### Q: 收不到邮件

确认 Email Routing 规则已配置，且域名 DNS 在 Cloudflare 管理下（SPF 会自动配置）。

### Q: 前端部署后访问报 CORS 错误

部署时 `VITE_API_BASE` 未设置为 Worker 的实际 URL。或 Worker 的 `ALLOWED_ORIGINS` 未包含 Pages 域名。
