# Changelog

## [0.0.1] - 2026-05-17

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

### Changed
- 使用 Hono 框架重构 API 路由，替代手动路由分发
- 根据 DESIGN.md 重构前端：暖粉主题、Nunito 字体、composable 架构
- 移除 Email Routing CI 自动化，改为手动 Dashboard 配置

### Removed
- 删除 `.github/scripts/configure-email-routing.sh`
- 删除自动化 Email Routing 启用/配置逻辑

### Fixed
- Worker 入口类型兼容（`any` cast at boundary）
- `message-id` 兜底为 `crypto.randomUUID()`
- 404 语义修正
- 邮件去重（`UNIQUE(message_id)`）

[0.0.1]: https://github.com/your-org/edge-mail/releases/tag/v0.0.1
