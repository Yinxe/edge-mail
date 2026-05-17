# 数据库业务规范 & 事务规范

## D1 事务模型

| 特性 | 说明 |
|------|------|
| 单语句 | `db.prepare(sql).run()` / `.all()` / `.first()` — **每条语句自成一个隐式事务**，自动提交 |
| 多语句原子 | `db.batch([stmt1, stmt2, ...])` — **所有语句在同一个事务里执行**，全部成功或全部回滚 |
| 传统事务 | D1 **不支持** `BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK` SQL 语句，必须用 `batch()` |
| 嵌套事务 | 不支持 |

**核心原则：** 需要原子性的多语句写操作，一律使用 `db.batch()`。

---

## 一、业务规范

### 1.1 函数签名约定

所有 db 操作函数遵循统一的签名模式：

```typescript
export async function operationName(
  db: D1Database,
  ...params: ...,      // 业务参数
): Promise<返回值类型> {
  // ...
}
```

- `db` 始终是第一个参数，由调用方注入（依赖注入模式，方便测试 mock）
- 函数不直接依赖环境变量或全局状态
- 返回值用 TypeScript 类型精确表达：`Promise<Entity | null>`、`Promise<boolean>`、`Promise<ListResult<T>>`

### 1.2 读操作规范

| 场景 | 方法 | 说明 |
|------|------|------|
| 查单行 | `first<T>()` | 返回 `T \| null`，天然处理"未找到" |
| 查多行 | `all<T>()` | 返回 `{ results: T[]; success: boolean }` |
| 聚合查询 | `first<{ total: number }>()` | COUNT、SUM 等 |

**规范：**

- 尽量用 `first()` 拿单行，避免手动 `LIMIT 1` + `all()` 再取 `[0]`
- 分页查询同时返回 `total` 和当前页数据，由函数封装而非调用方拼凑
- JOIN 优先用 LEFT JOIN（如 `getEmailById` 中 emails + email_bodies），保证主表行不因子表无数据而丢失

### 1.3 写操作规范

| 场景 | 方法 | 说明 |
|------|------|------|
| INSERT | `.run()` 或 `batch()` | 返回 `D1Result`，通过 `meta.changes` / `meta.last_row_id` 取结果 |
| UPDATE | `.run()` | 通过 `meta.changes > 0` 判断是否命中行 |
| DELETE | `.run()` 或 `batch()` | 通过 `meta.changes > 0` 判断是否删除了行 |

**规范：**

- **写操作必须检查结果** — 至少检查 `meta.changes` 判断是否真的变更了数据
- **INSERT 返回 ID** — 通过 `meta.last_row_id` 获取，而非重新查询
- **INSERT OR IGNORE 处理唯一约束冲突** — 利用 SQLite 内置的冲突处理，避免 TOCTOU 竞态（先查再插不原子）

### 1.4 返回值规范

| 操作类型 | 返回值 | 含义 |
|----------|--------|------|
| 列表查询 | `ListResult<T> = { items: T[]; total: number; page: number; limit: number }` | 分页信息 + 数据 |
| 单条查询 | `T \| null` | `null` 表示未找到 |
| 写操作 | `boolean` | `true` = 有行被影响，`false` = 未找到或未变更 |
| INSERT（可能重复） | `number \| null` | `number` = 新 ID，`null` = 重复/失败 |

### 1.5 外键约束处理

- **D1 默认启用外键约束**（不同于 SQLite 的默认行为）
- 多表删除时，先删子表再删主表（如 `deleteEmail` 先删 `email_bodies` 再删 `emails`）
- 所有多表写操作必须考虑 FK 顺序，**不应依赖 `ON DELETE CASCADE`**（生产库可能因迁移兼容性缺少 CASCADE）

### 1.6 参数绑定

- 始终使用 `?` 占位符 + `.bind()`，**禁止拼接 SQL 字符串**
- 字符串字面量中的 `?` 需要用 `ESCAPE` 子句处理（如 `searchEmails` 中的 LIKE 查询）

```typescript
// ✅ 正确
db.prepare('SELECT * FROM emails WHERE id = ?').bind(id)

// ❌ 禁止（SQL 注入风险）
db.prepare(`SELECT * FROM emails WHERE id = ${id}`)
```

---

## 二、事务规范

### 2.1 什么时候必须用 batch

满足**任一**条件就必须用 `db.batch()`：

1. **多表写操作** — 写两个或以上表的操作（如 `deleteEmail` 删 `email_bodies` + `emails`）
2. **读写依赖** — 前一条语句的结果影响后一条语句（`insertEmail` 中先 INSERT emails，再 INSERT email_bodies 使用新 ID）
3. **需要原子性保证** — 任何"要么全部成功，要么全部回滚"的场景

### 2.2 什么时候可以用单语句

- **单表写操作** — 只涉及一个表的 INSERT/UPDATE/DELETE（如 `setEmailRead`）
- **只读查询** — `all()` / `first()` / `count()` 等查询天然隔离

### 2.3 batch 的结果提取

```typescript
const results = await db.batch([
  db.prepare('DELETE FROM email_bodies WHERE email_id = ?').bind(id),
  db.prepare('DELETE FROM emails WHERE id = ?').bind(id),
]);

// batch 返回 D1Result[]，按传入顺序对应
// 取第 2 条语句的结果来判断"是否删除了邮件"
const emailResult = results[1] as { meta: { changes: number } };
return (emailResult.meta.changes ?? 0) > 0;
```

- `results` 数组顺序与 `batch()` 参数顺序严格一致
- 每个元素是 `D1Result`，可访问 `meta.changes`、`meta.last_row_id`、`success`

### 2.4 batch 的局限

| 局限 | 影响 |
|------|------|
| 无条件分支 | batch 内所有语句都会执行，不能根据前一条结果跳过后续语句 |
| 无动态构造 | prepare + bind 必须在 batch 调用之前完成 |
| 超时 | 单个 batch 有 30 秒超时（Cloudflare 限制） |
| 大小 | 建议 batch 不超过 100 条语句 |

**应对：** 如需条件分支，先在 batch 外做好判断，再决定 batch 的内容。

### 2.5 insertEmail 特殊模式（混合事务）

`insertEmail` 采用"单语句 + batch"混合模式：

```typescript
// Step 1: 单语句 INSERT（需要 last_row_id）
const insertResult = await db.prepare('INSERT OR IGNORE INTO emails ...').run();
if ((insertResult.meta.changes ?? 0) === 0) return null;
const emailId = insertResult.meta.last_row_id;

// Step 2: batch 写关联表（使用上一步的 ID）
await db.batch([
  db.prepare('INSERT INTO email_bodies ...').bind(emailId, ...),
]);
```

**为什么这样分两步？** batch 内的语句无法获取前一条语句的 `last_row_id` 作为后一条语句的参数。所以必须先单独执行取 ID，再用 batch 保证关联表写入的原子性。

风险：Step 1 成功但 Step 2 失败（如进程崩溃）会导致 emails 有行但没有 email_body。这个风险可接受，因为：
- D1 部署在生产环境极少崩溃
- `email_bodies` 是可选 JOIN，缺少 body 不会破坏邮件列表展示
- 未来可加定时清理任务

### 2.6 无事务场景（读后写但不需要原子性）

```typescript
// getEmailById 中：先读，再标记已读
const result = await db.prepare('SELECT ...').first();
if (result) {
  await db.prepare('UPDATE emails SET is_read = 1 WHERE id = ?').run();
}
```

这里"读"和"写"不需要原子性：即使标记已读失败，下次读取时仍然会重新标记。这种"最终一致"的业务场景不需要 batch。

---

## 三、测试 mock 规范

### 3.1 mock batch

```typescript
function createMockD1(overrides?: { runChanges?: number }) {
  // ...
  return {
    prepare: () => stmt,
    batch: async (stmts: unknown[]) =>
      stmts.map(() => ({ meta: { changes: overrides?.runChanges ?? 0 } })),
  } as unknown as D1Database;
}
```

- `batch()` 应为每条入参语句返回一个对应的 `D1Result`
- 用 `stmts.map()` 保证结果数量与入参一致
- 不要写死 `return []`——如果代码加了新 batch 语句，测试会因数组越界失败

### 3.2 测试事务行为的要点

- 验证 batch 后正确提取了目标结果（如 `results[1].meta.changes`）
- mock 的 `runChanges: 0` 覆盖"无行被影响"路径
- mock 的 `runChanges: 1` 覆盖"成功"路径

---

## 四、代码审查 checklist

新增或修改 db 函数时，对照检查：

- [ ] 多表写操作是否用了 `db.batch()`？
- [ ] 写操作是否检查了 `meta.changes`？
- [ ] FK 顺序是否正确（先子后主）？
- [ ] 返回值是否与函数签名一致？
- [ ] 参数使用 `?` 绑定，没有 SQL 拼接？
- [ ] INSERT 用到 `INSERT OR IGNORE` / `INSERT OR REPLACE` 处理冲突了吗？
- [ ] 测试 mock 的 `batch` 是否按入参数量返回结果？
