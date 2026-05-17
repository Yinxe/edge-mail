# API 路径双斜杠导致登录失败

**发现时间：** 2026-05-17  
**修复提交：** `fb3e696`

## 现象

前端登录时请求 `https://xxx.com//api/auth/login`（双斜杠），被 Cloudflare 或 Worker 拒绝，返回 404。

## 根因

Vite 代理配置中 `VITE_API_BASE` 末尾带 `/`，前端拼接路径时产生双斜杠：

```typescript
// VITE_API_BASE = "https://worker.example.com/"
fetch(`${import.meta.env.VITE_API_BASE}/api/auth/login`)
// → https://worker.example.com//api/auth/login  ❌
```

## 修复

在 API 层统一规范化路径，去除重复斜杠。

## 教训

- `VITE_API_BASE` 不尾随 `/`，或在拼接时用 `/` 连接并输出前规范化
- 跨环境（开发/生产）测试路径拼接
