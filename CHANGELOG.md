# Changelog

## [Unreleased]

### Changed
- 使用 Hono 框架重构 API 路由，替代手动路由分发
- 移除 Email Routing CI 自动化，改为手动 Dashboard 配置
- AGENTS.md 精简为只保留核心 gotchas
- 合并 DEPLOY.md 内容到 README.md

### Removed
- 删除 `.github/scripts/configure-email-routing.sh`
- 删除自动化 Email Routing 启用/配置逻辑

## [0.2.0] - 2026-05-16

### Added
- CI/CD GitHub Actions 工作流（deploy-worker + deploy-web）
- 自动注入 `database_id` 到 wrangler.jsonc
- D1 数据库迁移支持
- `validate` 前置检查 job（校验 Secrets 和 Variables）
- `EMAIL_SCOPE` 变量用于路由规则粒度控制

### Changed
- Worker 部署流程重构：提取脚本到 `.github/scripts/`
- 部署顺序调整为 validate → deploy-worker → deploy-web
- 前端页面类型检查合并到构建流程（vue-tsc -b || vite build）

### Fixed
- `wrangler pages project create` 重复执行报错（加入 `|| true`）
- Worker 多版本冲突问题
- `${GITHUB_WORKSPACE}` 路径注入问题
- API 双斜杠路径导致登录失败
- CI 中 `workflow_dispatch` 事件过滤

## [0.1.0] - 2026-05-16

### Added
- 项目初始化：pnpm workspace monorepo
- Worker 包：Hono + D1 + postal-mime + HMAC 认证
- Web 包：Vue 3 + Naive UI + TailwindCSS v4
- 完整邮件处理流程：入站 → 解析 → 存储
- REST API：认证、邮件列表、详情、已读切换
- 前端 SPA：登录页 + 收件箱（列表/详情/分页）
- HMAC 自定义认证（无 JWT 依赖）
- D1 数据库 schema（emails + email_bodies 表）
- XSS 防护（DOMPurify）、原子化 batch 操作
- 可配置 CORS（`ALLOWED_ORIGINS`）
- `.dev.vars` 本地密钥支持
- 本地 D1 快速建表脚本（`db:local`）

### Fixed
- Worker 入口类型兼容（`any` cast at boundary）
- `crypto.subtle.timingSafeEqual` 替换为纯 JS 常量比较
- `message-id` 兜底为 `crypto.randomUUID()`
- 404 语义修正
- 邮件去重（`UNIQUE(message_id)`）

[Unreleased]: https://github.com/your-org/edge-mail/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/your-org/edge-mail/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-org/edge-mail/releases/tag/v0.1.0
