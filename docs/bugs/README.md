# Bug 归档

> 按文件索引，每篇记录一个 bug 的完整排查与修复过程。

| # | 文件 | Bug | 根因类别 | 修复类型 |
|---|------|-----|---------|---------|
| 1 | [001-fk-delete-500.md](001-fk-delete-500.md) | 生产 DELETE 500 | FK 约束 + 迁移幂等缺陷 | 代码修复 |
| 2 | [002-search-watch.md](002-search-watch.md) | 搜索不触发 | Vue watch 漏监听 | 代码修复 |
| 3 | [003-ci-yaml-secrets.md](003-ci-yaml-secrets.md) | CI YAML 解析错误 | YAML 缩进格式 | 配置修复 |
| 4 | [004-api-double-slash.md](004-api-double-slash.md) | API 双斜杠登录失败 | 路径拼接不一致 | 代码修复 |
| 5 | [005-worker-multiversion.md](005-worker-multiversion.md) | Worker 多版本冲突 | CI 并发部署 | CI 配置 |
| 6 | [006-mock-batch-empty.md](006-mock-batch-empty.md) | mock batch 返回空数组 | 测试 mock 写死 | 测试修复 |

## 常见根因模式

1. **开发/生产环境差异**（#1）— mock 无法覆盖所有真实约束，需理解部署环境的实际行为
2. **迁移幂等缺陷**（#1）— `IF NOT EXISTS` 在已有表上跳过所有 DDL，包括约束变更
3. **前端响应式遗漏**（#2）— `watch` 只关注了部分依赖
4. **工具链行为不一致**（#4）— 环境变量拼接规则差异
5. **mock 与实现不同步**（#6）— 代码重构后 mock 未更新
