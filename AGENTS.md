# edge-mail — 项目概览

Monorepo（`pnpm workspace`），两个包：`packages/worker`（Cloudflare Worker）和 `packages/web`（Vue 3 SPA）。

## Worker

Hono + D1 + postal-mime + HMAC 认证。双入口：`email()` 处理入站邮件，`fetch()` 提供 REST API。

## Web

Vue 3 Composition API + Naive UI + TailwindCSS v4。Vite 代理 `/api` 到 Worker（:8787）。

## 关键注意事项（编辑前必读）

- **`wrangler.jsonc` 是 JSONC 格式**：支持 `//` 注释。`database_id` 是 CI 占位符，本地 deploy 会失败。
- **Worker 入口用 `any` 类型转换**：有意为之，运行时类型与 DOM 类型冲突。
- **HMAC 认证是自实现**：无 JWT 依赖。Token 格式：`<过期时间戳>.<hex签名>`。
- **邮件去重**：依赖 SQL `UNIQUE( message_id )`，`insertEmail` 重复时返回 `null`。
- **pnpm `allowBuilds`**：允许 esbuild、sharp、workerd 原生构建。

---

## 规则文件指引

| 场景 | 应该先读 |
|------|----------|
| 项目架构 / 目录结构 | `docs/rules/architecture.md` |
| 本地开发 / 启动流程 | `docs/rules/local-dev.md` |
| 写测试 / 跑测试 | `docs/rules/testing.md` |
| CI 部署 / 发布流程 | `docs/rules/ci-cd.md` |
| 建表 / 改表 / D1 迁移 | `docs/rules/sql-migrations.md` |
| 开发流程（SDD+TDD/TODO 规范） | `docs/rules/development-practices.md` |
| 数据库业务规范 / 事务规范 | `docs/rules/database-practices.md` |
| UI 设计规范 | `DESIGN.md`（根目录） |
| Bug 记录 / 排查方案 | `docs/bugs/` 目录 |

> 以上规则文件通过 `opencode.jsonc` 的 `instructions` 自动加载到 AI system prompt。
