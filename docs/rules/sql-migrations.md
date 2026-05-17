# SQL 迁移规则

## 双文件策略

| 文件 | 用途 | 谁来维护 | 谁执行 |
|------|------|----------|--------|
| `packages/worker/schema.sql` | **全量版**：完整的建表 DDL，`IF NOT EXISTS` | 每次改表时同步更新 | 本地 `--local` 一键建库、CI 测试环境重置 |
| `packages/worker/migrations/0001_*.sql` | **增量版**：逐号递增的迁移文件 | 每次改表时新建 | CI 部署 `wrangler d1 migrations apply --remote` |

**原则：** `schema.sql` = 最终快照，`migrations/` = 演进历史。

## 何时维护什么

- **本地开发建新库** → `wrangler d1 execute --file=schema.sql --local`
- **部署到生产** → CI 自动 `wrangler d1 migrations apply --remote`
- **结构变更（加表/加列/改索引）** → 同时做两件事：
  1. 更新 `schema.sql`（保持它反映最新结构）
  2. 创建新的迁移文件

## 创建新迁移

```bash
# 在 packages/worker 目录下
npx wrangler d1 migrations create edge-mail-db 简短英文描述
# 生成：migrations/0002_简短英文描述.sql
```

编辑生成的 `.sql` 文件，写入增量 DDL。

## 迁移编写规范

1. **新建表用 `IF NOT EXISTS`** — 幂等安全，重跑不报错
2. **新建索引用 `CREATE INDEX IF NOT EXISTS`** — 同上
3. **新增列用 `ALTER TABLE ... ADD COLUMN`** — D1 支持有限，只能增不能删改
4. **永远不要修改已 apply 的迁移文件** — 已上线的迁移不可变。如果改错了，建一个新的修复迁移
5. **一个迁移文件只做一件事** — 方便回滚定位（D1 不支持事务回滚迁移）

## 本地迁移测试

```bash
# 从零重建本地 DB
wrangler d1 execute edge-mail-db --file=schema.sql --local

# 检查本地迁移状态
wrangler d1 migrations apply edge-mail-db --local

# 查看已 apply 的迁移
wrangler d1 migrations list edge-mail-db --local
```

## 变更审查

修改 `schema.sql` 或 `migrations/*.sql` 后，**必须**提交给 @oracle 审查：
- DDL 正确性（D1 兼容性、类型选择）
- 迁移与 `schema.sql` 是否一致
- 幂等性检查（`IF NOT EXISTS` 是否合理使用）
- 破坏性变更风险

## CI 行为

CI `deploy.yml` 中 `Apply D1 migrations` 步骤执行增量迁移。
初始迁移 `0001_initial.sql` 用了 `IF NOT EXISTS`，兼容从全量模式到增量模式的切换。
