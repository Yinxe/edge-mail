# edge-mail — AGENTS.md

## 项目结构

```
server/index.ts      Hono 框架后端 Worker 入口（处理 /api/*）
src/                 Vue 3 SPA 前端（Vite + Tailwind CSS v4）
wrangler.jsonc        Worker 配置：main=server/index.ts, SPA 静态资源, nodejs_compat
vite.config.ts        Vite 配置：tailwindcss, vue, vue-devtools, cloudflare 插件（自动管理 SPA 静态资源路径）
tsconfig.json         引用 3 个子项目（app, worker, node）
```

## 常用命令

| 命令                 | 作用                                                     |
| -------------------- | -------------------------------------------------------- |
| `npm run dev`        | 启动 Vite 开发服务器（含 Cloudflare Worker 集成）        |
| `npm run build`      | 并行执行类型检查 + 构建（`run-p type-check build-only`） |
| `npm run preview`    | 构建后通过 `wrangler dev` 本地预览生产环境               |
| `npm run deploy`     | 构建 + `wrangler deploy` 部署到 Cloudflare               |
| `npm run type-check` | `vue-tsc --build` — 检查 app 和 worker 的 tsconfig       |
| `npm run cf-typegen` | 根据 wrangler 配置重新生成 `worker-configuration.d.ts`   |
| `npm run lint`       | ESLint 检查代码质量                                      |
| `npm run lint:fix`   | ESLint 检查并自动修复                                    |
| `npm run format`     | Prettier 检查代码格式                                    |
| `npm run format:fix` | Prettier 自动格式化所有文件                              |

> **维护提醒：** 增删或修改命令时，同步更新 `docs/SCRIPT.md`，保持两者一致。每个值得记录的版本变更（功能增删、配置变更、依赖更新等）需写入 `docs/CHANGELOG.md`。

## 架构说明

- **Worker**（`server/index.ts`）使用 **Hono** 框架构建 API 路由。`export default app` 导出的 Hono 实例实现了 `ExportedHandler` 接口；SPA 静态资源路径由 `@cloudflare/vite-plugin` 在构建时自动配置。
- **Vue SPA**（`src/`）使用 Vue Router v5（`createWebHistory`），全量使用 Vue 3 `<script setup lang="ts">`。
- **Tailwind CSS v4** — 使用 `@import "tailwindcss"` 语法（非旧版 `@tailwind` 指令）。无需 `tailwind.config.*` 文件，通过 CSS 配置。
- **路径别名**：`@/` 映射到 `src/`（同时在 `vite.config.ts` 和 `tsconfig.app.json` 中配置）。
- **`public/`** 由 Worker 原样托管；**`src/assets/`** 由 Vite 处理。

## TypeScript 工具链说明

- 使用 **TypeScript 6.0**、**vue-tsc 3.2**、**Vite 8.0** — 非常新的工具链版本。
- `vue-tsc --build` 生成的 `.tsbuildinfo` 文件存放在 `node_modules/.tmp/` 下。
- `tsconfig.worker.json` 从 `worker-configuration.d.ts`（由 `npm run cf-typegen` 自动生成）和 `vite/client` 引入 Worker 类型。
- 需要 Node.js >= 20.19.0 或 >= 22.12.0。

## 开发规范

### 代码风格

- 代码注释使用中文，变量/函数命名保持英文
- 每个独立的功能函数必须有对应的单测验证

### 模块化解耦

- 一个文件只做一件事，职责单一
- Worker 路由逻辑、业务处理、数据层按目录分离
- Vue 组件遵循 Container/Presentational 分离原则
- 公共工具函数提取到 `src/utils/` 或 `server/utils/`

### 开发流程：规格驱动 + 测试驱动

遵循 规格（Spec）→ 测试（Test）→ 实现（Code）→ 验证（Verify）的循环：

1. **写规格** — 先确定函数签名、输入输出、边界条件
2. **写测试** — 测试覆盖正常路径、边界、错误情况
3. **实现功能** — 只写让测试通过的最简代码
4. **验证** — 运行测试确保全部通过，然后运行 `npm run build` 确认类型和构建无误

```
规格 → 测试 → 实现 → 验证 → 提交
```

### 测试要求

- 使用 Vitest，测试文件放在对应模块旁（`__tests__/` 目录或 `.test.ts` 后缀）
- Worker 侧测试用 `vitest` + `wrangler` 的 miniflare 环境
- 前端组件测试优先测逻辑（Composables、工具函数），暂不要求 DOM 渲染测试

### 提交前检查清单

- [ ] `npm run lint` 通过（无 error 和 warning）
- [ ] `npm run format` 通过
- [ ] `npm run type-check` 通过
- [ ] `npm run build` 通过
- [ ] 所有测试通过
- [ ] 新增功能有对应的测试覆盖
- [ ] 代码已按模块拆分，无大文件

### Git 提交规则

- 禁止自动推送代码（`git push` 只能手动执行）
- 提交信息简短，中英文均可，描述清楚变更内容
