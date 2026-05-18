# 更新日志

所有 notable 变更均记录在此文件。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增

- AGENTS.md：项目描述、架构说明、开发规范（模块化解耦、规格驱动+测试驱动）
- 集成 ESLint（flat config），支持 `npm run lint` / `npm run lint:fix`
- 集成 Prettier，支持 `npm run format` / `npm run format:fix`
- docs/SCRIPT.md：常用命令参考文档
- docs/CHANGELOG.md：版本更新日志

### 变更

- 后端框架从原生 `ExportedHandler` 迁移至 Hono
- Prettier 格式化所有源代码文件
- 修复 `App.vue` 中属性顺序的 ESLint 警告

## [0.0.0] — 2026-05-18

### 新增

- 通过 `create-cloudflare` CLI 初始化项目（Vue + Cloudflare Worker 模板）
- Vue 3 SPA 前端（Vue Router v5、TypeScript、Vite）
- Cloudflare Worker 后端（`server/index.ts`，处理 `/api/*`）
- Tailwind CSS v4 集成，替换默认 scaffold 组件为 Tailwind 样式
- 基础路由：首页（`/`）和关于页（`/about`）

