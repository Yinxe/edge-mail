# edge-mail — AGENTS.md

## Architecture

Monorepo (`pnpm workspace`), two packages:

- **`packages/worker`** — Cloudflare Worker with dual entry: `email()` handles inbound mail via Email Routing, `fetch()` serves REST API (`packages/worker/src/index.ts`). Uses `postal-mime` for MIME parsing, `D1` (binding name `DB`) for storage, HMAC-SHA256 for auth.
- **`packages/web`** — Vue 3 SPA (Naive UI + TailwindCSS v4). No tests.

## Local dev

```bash
# Terminal 1
pnpm dev:worker     # → http://localhost:8787
# Terminal 2
pnpm dev:web        # → http://localhost:5173 (Vite proxies /api to :8787)
```

Worker local secrets: `packages/worker/.dev.vars` (`AUTH_PASSWORD`, `AUTH_SECRET`). Not committed (in `.gitignore`).

Web local config: `packages/web/.env`. Leave `VITE_API_BASE=` empty for dev (Vite proxy handles it).

Local D1 setup (first time or schema reset):
```bash
pnpm --filter worker db:local
```

## Testing

Worker only (Vitest):
```bash
pnpm --filter worker test          # vitest run
pnpm --filter worker test -- --watch
```

Tests live in `packages/worker/src/api/__tests__/`. Environment: `node` (no miniflare). Worker handler types use `any` at the boundary due to runtime/lib type conflicts.

## TypeScript

```bash
pnpm --filter worker tsc --noEmit  # Worker typecheck
pnpm --filter web build            # Web: vue-tsc -b + vite build (typecheck + bundle)
```

Both packages extend `tsconfig.base.json` from root. Worker uses `@cloudflare/workers-types`.

## CI/CD (GitHub Actions)

File: `.github/workflows/deploy.yml`. Triggers on push to `master` or manual dispatch.

**`validate` job** (runs first) — checks 4 secrets + 2 variables are set. Fails fast if missing.

**`deploy-worker`** → `validate`:
1. CI injects `database_id` into `wrangler.jsonc` (Node.js script, not sed — resilient to placeholder changes)
2. D1 migrations run
3. `wrangler deploy`
4. Secrets injected via `wrangler secret put`

**`deploy-web`** → `deploy-worker`:
1. `vite build` with `VITE_API_BASE` from vars
2. `wrangler pages deploy`

Required GitHub Secrets (Repository level, not Environment):
- `CLOUDFLARE_API_TOKEN` (Workers + D1 + Pages + Email Routing)
- `CLOUDFLARE_ACCOUNT_ID`
- `AUTH_PASSWORD`
- `AUTH_SECRET`

Required GitHub Variables:
- `D1_DATABASE_ID`
- `VITE_API_BASE`

## Key gotchas

- **`wrangler.jsonc` is JSONC**: supports `//` comments. Node.js injection script strips them before `JSON.parse`.
- **`database_id` in `wrangler.jsonc` is a CI placeholder**. Local `wrangler deploy` will fail with the placeholder value. Run CI or manually replace with a real D1 UUID.
- **Worker entry uses `any` casts** at the `email()` / `fetch()` boundary. This is intentional — the Workers runtime types conflict with browser/lib DOM types.
- **HMAC auth is custom** (no JWT library). Uses `crypto.subtle.sign('HMAC', ...)` with a pure-JS constant-time compare (`timingSafeEqual`). Token format: `<expiry-ms>.<hex-signature>`.
- **Email de-duplication** relies on SQL `UNIQUE` constraint on `message_id`. `insertEmail` returns `null` on duplicate.
- **`wrangler pages project create`** in CI uses `|| true` to suppress "already exists" error. The subsequent deploy step catches real failures.
- **pnpm `allowBuilds`** in root `pnpm-workspace.yaml` allows `esbuild`, `sharp`, `workerd` — required for native build hooks.
