# Email Management — 邮件管理与搜索功能

## 概述

为 Edge Mail 增加邮件管理和搜索功能。用户现可以**删除**和**搜索**邮件。

## 需求

1. **删除邮件** — 邮件列表 hover 和详情页都提供删除入口，点击后弹出二次确认（可选"不再提示"）。
2. **搜索邮件** — 顶部搜索栏输入关键词，后端 `LIKE` 模糊搜索标题/发件人，分页返回。
3. **附件资源** — 当前无附件存储逻辑，删除时留 TODO。

## 后端设计

### 数据库

#### Schema 变更

`email_bodies` 的 `email_id` 外键增加 `ON DELETE CASCADE`，使删除 `emails` 时自动级联删除关联的 `email_bodies` 行：

```sql
CREATE TABLE IF NOT EXISTS email_bodies (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  email_id  INTEGER NOT NULL UNIQUE REFERENCES emails(id) ON DELETE CASCADE,
  text_body TEXT,
  html_body TEXT,
  headers   TEXT
);
```

> 注意：`sqlite` 的 `ON DELETE CASCADE` 需要开启 `PRAGMA foreign_keys = ON`。Cloudflare D1 默认已启用。

#### 索引说明

搜索依赖 `emails.sender` 和 `emails.subject` 列的 `LIKE` 模糊匹配。当前这两列无索引，大数据量下为全表扫描。此版本不做索引优化（数据量较小时可接受），未来可考虑 FTS5 全文索引。

### `db.ts` 新增函数

```ts
// 搜索邮件（分页）
searchEmails(db: D1Database, q: string, page: number, limit: number): Promise<ListResult<EmailMeta>>

// 删除邮件（利用 ON DELETE CASCADE 自动删除 body）
deleteEmail(db: D1Database, id: number): Promise<boolean>
```

- `searchEmails` 执行 `WHERE sender LIKE ? OR subject LIKE ?`，需处理 `%` 和 `_` 通配符转义：

```ts
// 转义 LIKE 通配符防止被解释为通配符
const escaped = q.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
const pattern = `%${escaped}%`;

const countResult = await db.prepare(
  "SELECT COUNT(*) as total FROM emails WHERE sender LIKE ? ESCAPE '\\' OR subject LIKE ? ESCAPE '\\'"
).bind(pattern, pattern).first<{ total: number }>();

const { results } = await db.prepare(
  "SELECT id, message_id, sender, recipient, subject, raw_size, is_read, created_at FROM emails WHERE sender LIKE ? ESCAPE '\\' OR subject LIKE ? ESCAPE '\\' ORDER BY created_at DESC LIMIT ? OFFSET ?"
).bind(pattern, pattern, limit, offset).all<EmailMeta>();
```

- `deleteEmail` 简化为单条 `DELETE FROM emails WHERE id = ?`，`ON DELETE CASCADE` 自动处理 `email_bodies`。

```ts
async function deleteEmail(db: D1Database, id: number): Promise<boolean> {
  const result = await db.prepare('DELETE FROM emails WHERE id = ?').bind(id).run();
  // TODO: 删除关联的附件资源（当附件存储功能实现时）
  return (result.meta.changes ?? 0) > 0;
}
```

### API 路由 `router.ts`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/api/emails?q=keyword&page=1` | Bearer | 增强现有路由，可选 `q` |
| `DELETE` | `/api/emails/:id` | Bearer | 删除单封邮件 |

CORS `allowMethods` 增加 `DELETE`：

```ts
allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
```

### Handler `emails.ts`

- `handleListEmails` — 读取 `q` 参数，有则调 `searchEmails`（含 COUNT），否则调 `listEmails`
- `handleDeleteEmail` — 调 `deleteEmail`，存在返回 `200 { ok: true }`，不存在返回 `404 { error: 'Email not found' }`

## 前端设计

### API 层 `api.ts`

```ts
fetchEmails(page: number, q?: string): Promise<ListResult<EmailMeta>>
deleteEmail(id: number): Promise<void>
```

URL 构造：
```
/api/emails?page=${page}&limit=20${q ? `&q=${encodeURIComponent(q)}` : ''}
```

`deleteEmail` 发起 `DELETE /api/emails/${id}`，成功无返回体（或 `{ ok: true }`）。

### Composable `useEmails.ts`

新增状态：

```ts
const searchQuery = ref('')
```

`loadEmails` 中带上 `searchQuery`：

```ts
async function loadEmails() {
  loading.value = true
  try {
    const result = await fetchEmails(page.value, searchQuery.value || undefined)
    emails.value = result.items
    total.value = result.total
  } catch {
    message.error(searchQuery.value ? '搜索失败' : '加载邮件失败')
  } finally {
    loading.value = false
  }
}
```

新增方法：

```ts
function handleSearch(query: string) {
  searchQuery.value = query
  page.value = 1  // 搜索时回到第一页，watch(page) 自动触发 loadEmails
}

async function handleDelete(id: number) {
  await deleteEmail(id)
  // 如果详情页正在显示被删邮件，清除
  if (currentEmail.value?.id === id) {
    currentEmail.value = null
  }
  // 重新加载当前页
  await loadEmails()
  // 如果当前页空了且不是第1页，回退一页
  if (emails.value.length === 0 && page.value > 1) {
    page.value--
  }
}
```

### InboxView.vue

- header 区域增加搜索输入框（Naive UI `NInput` + 搜索图标），placeholder 如 "搜索发件人或主题…"
- 输入支持回车触发搜索
- 输入框右侧加清除按钮（X），清空后回到全部邮件

### EmailListItem.vue

hover 时右侧出现删除图标（`NButton` text 类型）。**删除按钮必须加 `@click.stop`** 防止冒泡触发 `select` 事件：

```vue
<NButton text @click.stop="emit('delete', email.id)">
  <template #icon><TrashIcon /></template>
</NButton>
```

点击 → 调用父级传入的删除回调。

### EmailDetail.vue

header 元信息区域增加删除按钮（`NButton` 带 danger 色调），点击触删除确认弹窗。

### 删除确认弹窗

使用 Naive UI `useDialog`：

- 标题："确认删除"
- 内容："确定要删除这封邮件吗？此操作不可撤销。"
- `NCheckbox` 标签："不再提示"
- 确认按钮（danger 红色）/ 取消按钮

如果勾选了"不再提示"，`localStorage.setItem('deleteConfirmDisabled', '1')`，后续删除直接执行。

如需重新启用确认，可通过 `localStorage.removeItem('deleteConfirmDisabled')`（开发者工具 Console 操作）。

## 边界情况

| 场景 | 处理 |
|------|------|
| 搜索关键词为空 | `searchQuery` 为空 → 退化为普通列表查询 |
| 搜索关键词含 `%` 或 `_` | 后端转义为 `\%` 和 `\_`，按字面匹配 |
| 搜索无结果 | 返回空列表（total=0），前端显示 `NEmpty` |
| 删除不存在的邮件 | API 返回 404 |
| 被删除的邮件正在查看 | 前端自动清除 `currentEmail` 并关闭详情 |
| 删除后当前页为空（最后一页的最后一条） | 自动回退到上一页 |
| 搜索后删除全部结果 | 回退到上一页或显示空结果 |
| 搜索栏清除 | `searchQuery` 设为空，page=1，回到全部邮件列表 |
| 删除确认"不再提示"后想恢复 | 开发工具运行 `localStorage.removeItem('deleteConfirmDisabled')` |

## 未纳入范围

- 批量删除（未来可基于此单条删除扩展）
- 高级筛选（按日期范围、附件有无等）
- 附件资源实际删除逻辑（仅留 TODO）
- 搜索性能优化（FTS5 全文索引等）

## 实现顺序

1. 后端 schema 增加 `ON DELETE CASCADE`
2. 后端 `db.ts` 新增 `searchEmails` + `deleteEmail`
3. 后端 `emails.ts` 新增 handler + 增强 `handleListEmails`
4. 后端 `router.ts` 注册新路由，更新 CORS methods
5. 前端 `api.ts` 新增调用
6. 前端 `useEmails.ts` 集成搜索 + 删除逻辑（含空页回退）
7. 前端 EmailListItem.vue hover 删除（`@click.stop`）
8. 前端 EmailDetail.vue header 删除按钮
9. 前端 InboxView.vue 搜索栏
10. 测试验证
