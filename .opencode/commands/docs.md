---
description: 基于近期 Git 变更，同步维护所有项目文档，确保内容准确一致
---

# 文档同步维护

## 核心逻辑

以 **git whatchanged 为驱动**：先分析近期代码/配置变更，再全量检查所有文档文件是否需要对应更新，确保文档始终反映项目最新状态。

维护范围：

| 文件 | 说明 |
|------|------|
| `README.md` | 项目首页、快速开始、架构 |
| `AGENTS.md` | AI 认知文件（仅 core gotchas） |
| `DESIGN.md` | UI/UX 设计风格统一规范 |
| `docs/CHANGELOG.md` | 版本变更日志（活跃版） |
| `docs/changelogs/` | 版本变更日志归档 |
| `docs/DEPLOY.md` | 部署指南 |
| `docs/rules/*.md` | opencode 领域规则 |
| `docs/` 目录 | 其他补充文档 |

## 通用规范

- **语言：** 中文（代码/配置片段除外）
- **语气：** 简洁平实，无营销口吻，无多余空行
- **格式：** markdown，代码块标注语言，路径用相对路径
- **不添加表情符号**（除非项目已有此风格）

## 各文件规范

### README.md

项目首页。应包含：
- 一句话项目定位
- 技术栈标签（Hono、Vue 3、D1、TailwindCSS 等）
- 快速开始（clone → pnpm install → 双终端启动）
- 关键目录结构
- 相关链接

### AGENTS.md

**必须保持精简**。只需：
- 架构一句话概览
- 关键注意事项（gotchas），编辑前必读
- 指引 AI 去 `docs/rules/` 查看详细规则

### DESIGN.md

UI 设计统一规范。应包含：
- 设计语言 / 风格定位
- 色彩体系（主色、辅助色、语义色）
- 排版规范（字体、字号层级）
- 组件风格指引（按钮、表单、卡片、导航等）
- 布局 / 间距规则
- 响应式断点约定
- 暗色模式规则（如有）
- 与 Naive UI / TailwindCSS 的配合方式

随前端组件变更而同步更新。

### docs/CHANGELOG.md（活跃版）

当前版本变更日志，顶部保留 `[Unreleased]` 段用于新条目。每次发版：
1. 将 `Unreleased` 内容归档到版本号下
2. 将已发布版本移入 `docs/changelogs/v{version}.md`
3. 清空 `Unreleased`

### docs/changelogs/（归档版）

历史版本归档，如 `v0.0.1.md`。语义化版本 + Keep a Changelog：
- `## [版本号] - 日期`
- 分类：Added / Changed / Deprecated / Removed / Fixed / Security
- 每个版本链接到 GitHub compare

### DEPLOY.md

部署操作指南，与 `docs/rules/ci-cd.md` 保持一致。

### docs/rules/\*.md

opencode 指令规则。自动加载到 AI system prompt，需维护：
- `architecture.md` — 包结构、技术栈
- `local-dev.md` — 本地开发流程
- `testing.md` — 测试规范
- `ci-cd.md` — CI/CD 流水线
- `sql-migrations.md` — SQL/D1 迁移规范
- `development-practices.md` — 开发流程规范（SDD + TDD）

## 执行步骤

1. **分析变更** — 查看 git diff 了解近期改动
   ```
   !`git diff --stat HEAD~5`
   !`git log --oneline -15`
   ```
2. **列出目标文件** — 检查所有文档是否存在
   ```
    !`ls -1 README.md AGENTS.md DESIGN.md 2>/dev/null`
    !`ls -1 docs/CHANGELOG.md docs/DEPLOY.md docs/changelogs/ docs/rules/`
   ```
3. **逐文件审计** — 对照上述规范，逐文件检查内容是否与最新代码一致
4. **更新** — 对有偏差的文档做修改，保持与代码同步
5. **报告** — 维护完成后，向用户汇报以下信息：
   - ✅ 已维护的文件列表及具体改动摘要
   - ❌ 因权限/信息不足无法处理的项

## 使用方式

```bash
# 全量维护
/docs

# 仅维护指定文件
/docs DESIGN.md

# 仅维护 README + CHANGELOG
/docs README.md,docs/CHANGELOG.md
```
