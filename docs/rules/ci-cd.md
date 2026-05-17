# CI/CD 流水线

## 流程

配置文件：`.github/workflows/deploy.yml`
触发条件：推送到 `master` 或手动 dispatch

### validate（前置检查）

检查所有必需的 Secrets 和 Variables 是否已设置。缺失则快速失败。

### deploy-worker（依赖 validate）

1. 通过 Node.js 脚本将 `database_id` 注入 `wrangler.jsonc`（比 sed 更健壮）
2. 执行 D1 migrations
3. `wrangler deploy`
4. 通过 `wrangler secret put` 注入 Secrets

### deploy-web（依赖 deploy-worker）

1. 使用 GitHub Variables 中的 `VITE_API_BASE` 执行 `vite build`
2. `wrangler pages deploy`（项目创建使用 `|| true` 抑制"已存在"错误）

## 必需的 GitHub Secrets

| Secret | 用途 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Workers + D1 + Pages + Email Routing |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID |
| `AUTH_PASSWORD` | API 认证密码 |
| `AUTH_SECRET` | HMAC 签名密钥 |

## 必需的 GitHub Variables

| Variable | 用途 |
|----------|------|
| `D1_DATABASE_ID` | 生产环境 D1 数据库 UUID |
| `VITE_API_BASE` | Web API 基础 URL（生产环境） |
