# 测试 mock batch 返回空数组

**发现时间：** 2026-05-17  
**修复提交：** `a9dcb67`

## 现象

将 `deleteEmail` 改为使用 `batch()` 后，测试访问 `results[1]` 报 `undefined`。

## 根因

测试 mock 的 `batch` 实现写死返回空数组：

```typescript
// ❌ 固定返回空数组
batch: async () => [],
```

当 `deleteEmail` 用 `batch()` 传入 2 条语句后取 `results[1]`，数组中只有 0 个元素，`results[1]` 为 `undefined`。

## 修复

mock `batch` 按入参语句数量返回对应个数的结果：

```typescript
// ✅ 按入参数量返回
batch: async (stmts: unknown[]) =>
  stmts.map(() => ({ meta: { changes: overrides?.runChanges ?? 0 } })),
```

## 教训

- mock 应始终按入参动态产生结果，避免写死
- `batch` 的测试数据量必须与实际调用语句数匹配
