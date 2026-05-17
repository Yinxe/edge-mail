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

## 验证门禁

实现完成后必须运行全部测试，**所有测试通过**才能归档或合并：

```bash
pnpm --filter worker test
```

如果有测试失败：
1. 定位失败的测试用例
2. 检查是功能 bug 还是测试本身不准确
3. 修复后再跑，直到全部通过
4. 不允许通过 `skip` 或 `only` 跳过失败用例
