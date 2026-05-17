# 生产环境 DELETE /api/emails/:id 返回 500

**发现时间：** 2026-05-17  
**修复提交：** `8c8b469` + `a9dcb67`

## 现象

生产环境 DELETE 请求返回 500 Internal Server Error，本地开发环境正常。

## 排查过程

1. 确认认证通过：401 未触发，Token 有效
2. 确认参数校验通过：ID 校验（NaN/负值）通过，未走 400
3. 定位到 `deleteEmail` 函数：执行 `DELETE FROM emails WHERE id = ?` 时崩溃
4. 确认根因：生产库 D1 默认启用外键约束，`email_bodies.email_id` 引用 `emails(id)`，但生产库的 FK 定义没有 `ON DELETE CASCADE`，直接删 `emails` 时 D1 抛出约束异常

## 根因

| 因素 | 说明 |
|------|------|
| 迁移幂等 | `0001_initial.sql` 用 `IF NOT EXISTS`，对已有生产表是空操作，CASCADE 从未生效 |
| Mock 缺陷 | 测试用 mock D1 没有真实 FK 检查，测试通过但生产炸了 |
| 顺序错误 | 代码先删 `emails` 再删 `email_bodies`，违反 FK 顺序 |

## 修复

1. **先删子表再删主表**：`DELETE FROM email_bodies` 先于 `DELETE FROM emails`
2. **用 `db.batch()` 保证原子性**：两个 DELETE 用 `batch()` 包裹，避免删了 body 但删 emails 失败时出现孤儿数据

```typescript
// 修复前
await db.prepare('DELETE FROM emails WHERE id = ?').bind(id).run();

// 修复后
const results = await db.batch([
  db.prepare('DELETE FROM email_bodies WHERE email_id = ?').bind(id),
  db.prepare('DELETE FROM emails WHERE id = ?').bind(id),
]);
const emailResult = results[1] as { meta: { changes: number } };
return (emailResult.meta.changes ?? 0) > 0;
```

## 教训

- 不要依赖 `ON DELETE CASCADE` — 迁移可能因 `IF NOT EXISTS` 跳过，生产库不一定有 CASCADE
- 多表写操作必须考虑 FK 顺序
- 测试 mock 要覆盖 FK 场景（至少验证调用顺序正确）
- 写操作必须用 `db.batch()` 保证原子性
