# 搜索时切换搜索词不触发重新查询

**发现时间：** 2026-05-17  
**修复提交：** `bf198e9`

## 现象

Vue 3 前端搜索框输入关键词后，页面没有重新加载搜索结果。只有切换分页页码时才触发搜索。

## 根因

`useEmails.ts` 中的 `watch` 只监听了 `page` 变量，没有监听 `searchQuery`：

```typescript
// ❌ 只监听 page，搜索词变化不会触发
watch(page, () => { fetchEmails(); });
```

## 修复

改为同时监听 `page` 和 `searchQuery`：

```typescript
// ✅ 搜索词或页码变化都触发
watch([page, searchQuery], () => { fetchEmails(); });
```

## 教训

- Vue `watch` 监听多个响应式变量时用数组语法 `watch([a, b], ...)`
- 搜索功能必须同时监听搜索词和页码
