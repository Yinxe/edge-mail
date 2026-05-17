# 架构说明

## Monorepo

pnpm workspace。两个包都继承根目录的 `tsconfig.base.json`。

## packages/worker

- **运行环境:** Cloudflare Worker
- **Web框架:** Hono
- **存储:** D1（绑定名 `DB`）
- **邮件解析:** postal-mime（MIME）
- **认证:** HMAC-SHA256（自定义实现，无 JWT 依赖）
- **双入口:** `email()` 处理入站邮件（Email Routing）；`fetch()` 提供 REST API

## packages/web

- **技术栈:** Vue 3 Composition API + `<script setup>`
- **组件库:** Naive UI
- **样式:** TailwindCSS v4
- **构建:** Vite + vue-tsc
- **开发代理:** Vite 代理 `/api` → `localhost:8787`
- **无测试**

## 关键文件

| 路径 | 用途 |
|------|------|
| `packages/worker/src/index.ts` | Worker 入口 |
| `packages/worker/src/api/router.ts` | Hono 路由 + API 处理器 |
| `packages/worker/src/email-handler.ts` | 入站邮件处理 |
| `packages/worker/src/api/auth.ts` | HMAC 认证逻辑 |
| `packages/worker/src/api/__tests__/` | Vitest 单元测试（node 环境） |
| `packages/web/src/` | Vue SPA 源码 |
| `.github/workflows/deploy.yml` | CI/CD 流水线 |
| `packages/worker/wrangler.jsonc` | Worker 配置（JSONC 格式） |
