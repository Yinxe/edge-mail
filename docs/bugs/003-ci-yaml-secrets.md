# CI secrets 缩进错误导致 LS-Error

**发现时间：** 2026-05-17

## 现象

GitHub Actions CI 运行失败，报 YAML 解析错误 `LS-Error` / `jobs.<job_id>.steps.secrets`。

## 根因

编辑 `deploy.yml` 时，`secrets:` 块在 `deploy-worker` 和 `deploy-web` 步骤中的缩进不正确：

```yaml
# ❌ 错误缩进 — secrets 和 run 平级
- name: Deploy Worker
  run: wrangler deploy
  secrets:   # ← 这里多缩进了
    - AUTH_PASSWORD
```

正确结构应该是 `secrets` 是 `with` 的子字段（当使用 `cloudflare/wrangler-action` 时），或者 `wrangler secret put` 写在 `run` 里。具体取决于 action 的接口。

## 修复

修正缩进，确保 YAML 结构正确：

```yaml
- name: Deploy Worker
  uses: cloudflare/wrangler-action@v3
  with:
    secrets: |
      AUTH_PASSWORD
      AUTH_SECRET
```

## 教训

- YAML 对缩进极其敏感，编辑 CI 文件后先用 `yamllint` 验证
- GitHub Actions 的 `secrets` 字段位置取决于使用的 action（不是标准 step 字段）
- 大范围编辑 CI 时应分步提交验证
