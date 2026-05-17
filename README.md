# edge-mail

基于 Cloudflare Email Routing + Workers + D1 + Pages 的域名信箱系统。通过 Email Routing 捕获域名下的所有入站邮件，Worker 处理后存入 D1，Vue SPA 供用户在浏览器中管理邮件。

## 架构

```text
外部邮件 → Cloudflare Email Routing (*@domain.com)
                ↓
         Worker (Hono: email handler + REST API)
                ↓
         D1 数据库 (emails + email_bodies)
                ↑
         Cloudflare Pages (Vue 3 SPA)
```

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | [Hono](https://hono.dev) on [Cloudflare Workers](https://workers.cloudflare.com), [D1](https://developers.cloudflare.com/d1) |
| 前端 | [Vue 3](https://vuejs.org) + Composition API, [Naive UI](https://www.naiveui.com), [TailwindCSS v4](https://tailwindcss.com) |
| 邮件 | [Cloudflare Email Routing](https://developers.cloudflare.com/email-routing/) → Worker `email()` 入口, [postal-mime](https://github.com/postal-mime) 解析 |
| 认证 | HMAC-SHA256 自实现（无 JWT 依赖） |
| 测试 | [Vitest](https://vitest.dev) |
| CI/CD | GitHub Actions（`wrangler deploy` + `wrangler pages deploy`） |

## 快速开始

```bash
git clone <repo>
cd edge-mail
pnpm install

# 终端 1 — Worker
pnpm dev:worker    # → http://localhost:8787

# 终端 2 — Web
pnpm dev:web       # → http://localhost:5173（Vite 代理 /api 到 :8787）
```

首次使用先初始化本地 D1：`pnpm --filter worker db:local`

## 文档

| 文档 | 说明 |
|------|------|
| [DEPLOY.md](docs/DEPLOY.md) | 本地开发环境配置 + 手动/CI 部署全流程 |
| [docs/rules/](docs/rules/) | 项目规则文件（架构、测试、迁移、开发规范） |
| [DESIGN.md](DESIGN.md) | UI 设计规范（色彩、字体、组件风格） |
| [AGENTS.md](AGENTS.md) | AI 认知上下文（核心 gotchas + 规则索引） |
| [CHANGELOG.md](docs/CHANGELOG.md) | 版本变更日志 |
