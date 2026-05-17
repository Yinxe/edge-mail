# Worker 多版本冲突

**发现时间：** 2026-05-17  
**修复提交：** `d77c658`

## 现象

`wrangler deploy` 失败，报多版本部署冲突。

## 根因

CI 并发部署或路由配置与已有版本冲突，导致部署被拒绝。

## 修复

调整 `workflow_dispatch` 过滤条件，确保每次部署唯一版本。

## 教训

- 避免并发部署到同一 Worker
- `workflow_dispatch` 条件要精确匹配
