# 测试规范

## 范围

只有 Worker 包有测试。Web 包无测试。

## 命令

```bash
pnpm --filter worker test          # vitest run（CI 模式）
pnpm --filter worker test --watch  # vitest watch（开发模式）
```

## 约定

- 测试文件位于 `packages/worker/src/api/__tests__/`
- Vitest 环境：`node`（不使用 miniflare）
- Worker 入口参数使用 `any` 类型转换 — 这是有意为之，运行时类型与浏览器/lib DOM 类型冲突
- 测试业务逻辑而非绑定层，D1 使用 mock
