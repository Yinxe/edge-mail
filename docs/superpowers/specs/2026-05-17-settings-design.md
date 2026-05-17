# Settings 设置功能设计

## 概述

为后端（Worker）增加可持久化的设置功能。配置项以后端代码静态定义为主，D1 存储覆盖值，支持运行时读写。

## 数据模型

```sql
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL  -- JSON 字符串，整组整存整取
);
```

## 分组设计

每个 D1 key 对应**一组设置**（一个 JSON object），各字段有独立 TypeScript 类型和默认值。

### 示例

```
key: "email"
value: '{"pageSize":20,"showPreview":true}'

key: "display"
value: '{"theme":"light","language":"zh-CN"}'
```

## 架构

```
src/settings/
  registry.ts   — 组类型定义 + 默认值注册表
  db.ts         — 读写 D1 的函数
  api.ts        — Hono handler（REST 端点）
```

### registry.ts

每个组一个 interface，所有组在 `SETTINGS` 对象中集中注册：

```typescript
export interface EmailSettings {
  pageSize: number;
  showPreview: boolean;
}

export const SETTINGS = {
  email: {
    key: 'email',
    defaultValue: { pageSize: 20, showPreview: true } satisfies EmailSettings,
  },
} as const;
```

### db.ts

两个核心函数：

- `getSettings<T>(db, group)` — 读 D1 → JSON.parse → 与 defaultValue 合并（缺失字段补默认）；JSON 解析失败或查询异常 → 返回完整 defaultValue
- `setSettings<T>(db, group, value: Partial<T>)` — 读当前值 → 合并传入字段（部分更新） → 整组 JSON.stringify → UPSERT

## API 端点

| 方法 | 路径 | 功能 |
|------|------|------|
| `GET` | `/api/settings` | 读取所有设置组 |
| `GET` | `/api/settings/:group` | 读取某组设置 |
| `PUT` | `/api/settings/:group` | 更新某组设置的指定字段 |

均需 auth middleware。

## 降级策略

`getSettings` 内部统一处理：JSON parse 失败、D1 查询异常、字段不存在 → 全部返回完整 `defaultValue`。

## 迁移

新建 `0002_settings.sql`（增量迁移），同步更新 `schema.sql`。
