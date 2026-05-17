# 本地开发

## 启动开发服务器

需要两个终端：

```bash
# 终端 1 — Worker（Hono + D1）
pnpm dev:worker     # → http://localhost:8787

# 终端 2 — Web（Vue 3 + Vite）
pnpm dev:web        # → http://localhost:5173
```

Web 的 Vite 开发服务器会自动将 `/api/*` 请求代理到 `localhost:8787`。

## 密钥（Worker）

文件 `packages/worker/.dev.vars`（已 `.gitignore`，不提交）：

```
AUTH_PASSWORD=<你的密码>
AUTH_SECRET=<你的密钥>
```

## 配置（Web）

文件 `packages/web/.env`。开发环境留空 `VITE_API_BASE=`，Vite 代理会处理。

## 本地 D1 数据库

首次使用或重置 schema：

```bash
pnpm --filter worker db:local
```

实际执行 `wrangler d1 execute edge-mail-db --local --file=schema.sql`。

## TypeScript 类型检查

```bash
pnpm --filter worker tsc --noEmit  # Worker
pnpm --filter web build            # Web：vue-tsc -b + vite build（类型检查 + 构建）
```
