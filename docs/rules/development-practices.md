# 开发规范

## SDD + TDD

采用 **规格驱动开发（SDD）** + **测试驱动开发（TDD）**：

1. **SDD** — 先明确需求规格（函数签名、接口约定、行为描述），再编码
2. **TDD** — 先写测试，再实现，最后重构（Red-Green-Refactor）
3. 修改现有功能时，先调整测试再改实现

## TODO 标记

待实现或未来目标可以直接在代码中写 `TODO`：

```typescript
// TODO: 添加分页支持
// TODO(perf): 缓存这个查询结果
// TODO(security): 对这个输入做校验
```

格式：`TODO[(category)]: 描述`，category 可选值：
- `perf` — 性能优化
- `security` — 安全事项
- `docs` — 需要补充文档
- `refactor` — 需要重构
