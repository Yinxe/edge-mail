# edge-mail MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build MVP domain email inbox system on Cloudflare — receive emails at `*@domain.com`, store in D1, view in Vue 3 web client.

**Architecture:** Monorepo with two packages. `packages/worker` is a Cloudflare Worker with `email()` handler (receive + parse + store) and `fetch()` handler (HTTP API with HMAC auth). `packages/web` is a Vue 3 SPA deployed to Cloudflare Pages.

**Tech Stack:** Cloudflare Workers, D1 (SQLite), postal-mime, Vue 3, Naive UI, TailwindCSS v4, Vue Router, Vite, pnpm workspaces

---

### Task 1: Monorepo root setup

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`

- [ ] **Step 1: Create root package.json**

```bash
cat > package.json << 'EOF'
{
  "name": "edge-mail",
  "private": true,
  "scripts": {
    "dev:worker": "pnpm --filter worker dev",
    "dev:web": "pnpm --filter web dev",
    "deploy:worker": "pnpm --filter worker deploy",
    "deploy:web": "pnpm --filter web deploy"
  }
}
EOF
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```bash
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "packages/*"
EOF
```

- [ ] **Step 3: Create tsconfig.base.json**

```bash
cat > tsconfig.base.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
EOF
```

- [ ] **Step 4: Create .gitignore**

```bash
cat > .gitignore << 'EOF'
node_modules/
dist/
.wrangler/
.env
*.log
EOF
```

- [ ] **Step 5: Install pnpm and initialize**

```bash
pnpm install
```

- [ ] **Step 6: Commit**

```bash
git init && git add -A && git commit -m "chore: init monorepo with pnpm workspace"
```

---

### Task 2: Worker package setup

**Files:**
- Create: `packages/worker/package.json`
- Create: `packages/worker/tsconfig.json`
- Create: `packages/worker/wrangler.jsonc`

- [ ] **Step 1: Create directory and package.json**

```bash
mkdir -p packages/worker/src/api
```

```bash
cat > packages/worker/package.json << 'EOF'
{
  "name": "worker",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev --config wrangler.jsonc",
    "deploy": "wrangler deploy --config wrangler.jsonc",
    "types": "wrangler types"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20250415.0",
    "wrangler": "^4.15.0"
  },
  "dependencies": {
    "postal-mime": "^2.4.0"
  }
}
EOF
```

- [ ] **Step 2: Create tsconfig.json**

```bash
cat > packages/worker/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["@cloudflare/workers-types"],
    "outDir": "./dist"
  },
  "include": ["src"]
}
EOF
```

- [ ] **Step 3: Create wrangler.jsonc**

```bash
cat > packages/worker/wrangler.jsonc << 'EOF'
{
  "name": "edge-mail-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-05-16",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "edge-mail-db",
      "database_id": "xxx"
    }
  ]
}
EOF
```

> Note: `database_id` must be filled after `wrangler d1 create` in deployment.

- [ ] **Step 4: Install dependencies**

```bash
cd packages/worker && pnpm install
```

- [ ] **Step 5: Commit**

```bash
git add packages/worker/ && git commit -m "chore: init worker package"
```

---

### Task 3: Web package setup

**Files:**
- Create: `packages/web/package.json`
- Create: `packages/web/index.html`
- Create: `packages/web/vite.config.ts`
- Create: `packages/web/wrangler.jsonc`
- Create: `packages/web/.env`
- Create: `packages/web/src/style.css`

- [ ] **Step 1: Create directory and package.json**

```bash
mkdir -p packages/web/src/views packages/web/src/components
```

```bash
cat > packages/web/package.json << 'EOF'
{
  "name": "web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "deploy": "wrangler pages deploy dist --project-name=edge-mail-web"
  },
  "dependencies": {
    "vue": "^3.5.13",
    "vue-router": "^4.5.0",
    "naive-ui": "^2.41.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.0",
    "@tailwindcss/vite": "^4.1.0",
    "tailwindcss": "^4.1.0",
    "typescript": "~5.7.0",
    "vite": "^6.2.0",
    "vue-tsc": "^2.2.0",
    "wrangler": "^4.15.0"
  }
}
EOF
```

- [ ] **Step 2: Create index.html**

```bash
cat > packages/web/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Edge Mail</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
EOF
```

- [ ] **Step 3: Create vite.config.ts**

```bash
cat > packages/web/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
EOF
```

- [ ] **Step 4: Create wrangler.jsonc**

```bash
cat > packages/web/wrangler.jsonc << 'EOF'
{
  "name": "edge-mail-web",
  "pages_build_output_dir": "dist"
}
EOF
```

- [ ] **Step 5: Create .env**

```bash
cat > packages/web/.env << 'EOF'
VITE_API_BASE=https://edge-mail-worker.xxx.workers.dev
EOF
```

> Note: replace `xxx` with actual worker subdomain after deployment.

- [ ] **Step 6: Create style.css**

```bash
cat > packages/web/src/style.css << 'EOF'
@import "tailwindcss";

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
EOF
```

- [ ] **Step 7: Install dependencies**

```bash
cd packages/web && pnpm install
```

- [ ] **Step 8: Commit**

```bash
git add packages/web/ && git commit -m "chore: init web package"
```

---

### Task 4: D1 schema

**Files:**
- Create: `packages/worker/schema.sql`

- [ ] **Step 1: Create schema.sql**

```bash
cat > packages/worker/schema.sql << 'EOF'
CREATE TABLE IF NOT EXISTS emails (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id  TEXT NOT NULL UNIQUE,
  sender      TEXT NOT NULL,
  recipient   TEXT NOT NULL,
  subject     TEXT NOT NULL DEFAULT '',
  raw_size    INTEGER,
  is_read     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_bodies (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  email_id  INTEGER NOT NULL UNIQUE REFERENCES emails(id),
  text_body TEXT,
  html_body TEXT,
  headers   TEXT
);

CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
EOF
```

- [ ] **Step 2: Commit**

```bash
git add packages/worker/schema.sql && git commit -m "feat: add D1 schema"
```

---

### Task 5: Worker types

**Files:**
- Create: `packages/worker/src/types.ts`

- [ ] **Step 1: Create types.ts**

```bash
cat > packages/worker/src/types.ts << 'TYPESCRIPT'
export interface EmailMeta {
  id: number;
  message_id: string;
  sender: string;
  recipient: string;
  subject: string;
  raw_size: number | null;
  is_read: number;
  created_at: string;
}

export interface EmailBody {
  text_body: string | null;
  html_body: string | null;
  headers: string | null;
}

export interface EmailDetail extends EmailMeta {
  text_body: string | null;
  html_body: string | null;
  headers: string | null;
}

export interface Env {
  DB: D1Database;
  AUTH_PASSWORD: string;
  AUTH_SECRET: string;
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
TYPESCRIPT
```

- [ ] **Step 2: Commit**

```bash
git add packages/worker/src/types.ts && git commit -m "feat: add worker types"
```

---

### Task 6: Worker DB layer

**Files:**
- Create: `packages/worker/src/db.ts`

- [ ] **Step 1: Create db.ts**

```bash
cat > packages/worker/src/db.ts << 'TYPESCRIPT'
import type { D1Database } from '@cloudflare/workers-types';
import type { EmailMeta, EmailDetail, ListResult } from './types';

export interface InsertEmailParams {
  message_id: string;
  sender: string;
  recipient: string;
  subject: string;
  raw_size: number;
  text_body: string | null;
  html_body: string | null;
  headers: string;
}

/** List emails with pagination — only metadata, no body */
export async function listEmails(
  db: D1Database,
  page: number,
  limit: number,
): Promise<ListResult<EmailMeta>> {
  const offset = (page - 1) * limit;

  const countResult = await db.prepare(
    'SELECT COUNT(*) as total FROM emails'
  ).first<{ total: number }>();
  const total = countResult?.total ?? 0;

  const { results } = await db.prepare(
    'SELECT id, message_id, sender, recipient, subject, raw_size, is_read, created_at FROM emails ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all<EmailMeta>();

  return { items: results, total, page, limit };
}

/** Get single email with body */
export async function getEmailById(
  db: D1Database,
  id: number,
): Promise<EmailDetail | null> {
  const result = await db.prepare(`
    SELECT e.*, b.text_body, b.html_body, b.headers
    FROM emails e
    LEFT JOIN email_bodies b ON b.email_id = e.id
    WHERE e.id = ?
  `).bind(id).first<EmailDetail>();

  if (result) {
    // Mark as read
    await db.prepare('UPDATE emails SET is_read = 1 WHERE id = ?').bind(id).run();
  }

  return result ?? null;
}

/** Insert a new email (with body) — returns null if duplicate message_id */
export async function insertEmail(
  db: D1Database,
  params: InsertEmailParams,
): Promise<number | null> {
  const existing = await db.prepare(
    'SELECT id FROM emails WHERE message_id = ?'
  ).bind(params.message_id).first<{ id: number }>();
  if (existing) return null;

  const batch = [
    db.prepare(
      'INSERT INTO emails (message_id, sender, recipient, subject, raw_size) VALUES (?, ?, ?, ?, ?)'
    ).bind(params.message_id, params.sender, params.recipient, params.subject, params.raw_size),
    db.prepare(
      'INSERT INTO email_bodies (email_id, text_body, html_body, headers) VALUES (last_insert_rowid(), ?, ?, ?)'
    ).bind(params.text_body, params.html_body, params.headers),
  ];

  const results = await db.batch(batch);
  const emailResult = results[0];

  return emailResult.meta.last_row_id ?? null;
}

/** Toggle read status */
export async function setEmailRead(
  db: D1Database,
  id: number,
  isRead: boolean,
): Promise<boolean> {
  const result = await db.prepare(
    'UPDATE emails SET is_read = ? WHERE id = ?'
  ).bind(isRead ? 1 : 0, id).run();
  return result.success;
}
TYPESCRIPT
```

- [ ] **Step 2: Commit**

```bash
git add packages/worker/src/db.ts && git commit -m "feat: add D1 query layer"
```

---

### Task 7: Worker auth API

**Files:**
- Create: `packages/worker/src/api/auth.ts`

- [ ] **Step 1: Create auth.ts**

```bash
cat > packages/worker/src/api/auth.ts << 'TYPESCRIPT'
import type { Env } from '../types';

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function generateToken(secret: string): Promise<{ token: string; expiresAt: number }> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  );

  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h
  const payload = encoder.encode(expiresAt.toString());
  const sig = await crypto.subtle.sign('HMAC', key, payload);

  return { token: `${expiresAt}.${hex(sig)}`, expiresAt };
}

export async function verifyToken(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [expiresStr, sigHex] = parts;
  const expiresAt = parseInt(expiresStr);
  if (isNaN(expiresAt) || Date.now() > expiresAt) return false;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  );
  const payload = encoder.encode(expiresStr);
  const expectedSig = await crypto.subtle.sign('HMAC', key, payload);

  return hex(expectedSig) === sigHex;
}

export async function handleAuth(request: Request, env: Env): Promise<Response> {
  const body: { password?: string } = await request.json().catch(() => ({}));

  if (body.password !== env.AUTH_PASSWORD) {
    return Response.json({ error: 'Invalid password' }, { status: 401 });
  }

  const { token, expiresAt } = await generateToken(env.AUTH_SECRET);

  return Response.json({ token, expiresAt });
}
TYPESCRIPT
```

- [ ] **Step 2: Commit**

```bash
git add packages/worker/src/api/auth.ts && git commit -m "feat: add HMAC auth API"
```

---

### Task 8: Worker emails API

**Files:**
- Create: `packages/worker/src/api/emails.ts`

- [ ] **Step 1: Create emails.ts**

```bash
cat > packages/worker/src/api/emails.ts << 'TYPESCRIPT'
import type { Env } from '../types';
import { listEmails, getEmailById, setEmailRead } from '../db';

export async function handleListEmails(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));

  const result = await listEmails(env.DB, page, limit);
  return Response.json(result);
}

export async function handleGetEmail(id: number, env: Env): Promise<Response> {
  const email = await getEmailById(env.DB, id);
  if (!email) {
    return Response.json({ error: 'Email not found' }, { status: 404 });
  }
  return Response.json(email);
}

export async function handleToggleRead(id: number, request: Request, env: Env): Promise<Response> {
  const body: { is_read?: boolean } = await request.json().catch(() => ({}));
  const isRead = body.is_read ?? true;

  const ok = await setEmailRead(env.DB, id, isRead);
  if (!ok) {
    return Response.json({ error: 'Failed to update' }, { status: 500 });
  }
  return Response.json({ ok: true });
}
TYPESCRIPT
```

- [ ] **Step 2: Commit**

```bash
git add packages/worker/src/api/emails.ts && git commit -m "feat: add email API handlers"
```

---

### Task 9: Worker router + CORS

**Files:**
- Create: `packages/worker/src/api/router.ts`

- [ ] **Step 1: Create router.ts**

```bash
cat > packages/worker/src/api/router.ts << 'TYPESCRIPT'
import type { Env } from '../types';
import { handleAuth, verifyToken } from './auth';
import { handleListEmails, handleGetEmail, handleToggleRead } from './emails';

const ALLOWED_ORIGINS = '*'; // MVC uses catch-all; tighten in production

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function corsResponse(response: Response): Response {
  const headers = corsHeaders();
  for (const [k, v] of Object.entries(headers)) {
    response.headers.set(k, v);
  }
  return response;
}

async function authenticate(request: Request, env: Env): Promise<Response | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return corsResponse(Response.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  const token = authHeader.slice(7);
  const valid = await verifyToken(token, env.AUTH_SECRET);
  if (!valid) {
    return corsResponse(Response.json({ error: 'Invalid or expired token' }, { status: 401 }));
  }

  return null; // authenticated
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    return corsResponse(new Response(null, { status: 204 }));
  }

  // POST /api/auth
  if (path === '/api/auth' && method === 'POST') {
    return corsResponse(await handleAuth(request, env));
  }

  // Auth required for all other API routes
  const authError = await authenticate(request, env);
  if (authError) return authError;

  // GET /api/emails
  if (path === '/api/emails' && method === 'GET') {
    return corsResponse(await handleListEmails(request, env));
  }

  // PUT /api/emails/:id/read
  const readMatch = path.match(/^\/api\/emails\/(\d+)\/read$/);
  if (readMatch && method === 'PUT') {
    return corsResponse(await handleToggleRead(parseInt(readMatch[1]), request, env));
  }

  // GET /api/emails/:id
  const detailMatch = path.match(/^\/api\/emails\/(\d+)$/);
  if (detailMatch && method === 'GET') {
    return corsResponse(await handleGetEmail(parseInt(detailMatch[1]), env));
  }

  return corsResponse(Response.json({ error: 'Not found' }, { status: 404 }));
}
TYPESCRIPT
```

- [ ] **Step 2: Commit**

```bash
git add packages/worker/src/api/router.ts && git commit -m "feat: add API router with CORS + auth middleware"
```

---

### Task 10: Worker email handler

**Files:**
- Create: `packages/worker/src/email-handler.ts`

- [ ] **Step 1: Create email-handler.ts**

```bash
cat > packages/worker/src/email-handler.ts << 'TYPESCRIPT'
import PostalMime from 'postal-mime';
import type { ForwardableEmailMessage } from '@cloudflare/workers-types';
import type { Env } from './types';
import { insertEmail } from './db';

const HEADER_KEYS = [
  'message-id', 'date', 'content-type', 'in-reply-to',
  'references', 'reply-to', 'cc', 'bcc', 'return-path',
];

export async function handleEmail(
  message: ForwardableEmailMessage,
  env: Env,
): Promise<void> {
  // Buffer raw (single-use stream)
  const rawBuffer = await new Response(message.raw).arrayBuffer();
  const parsed = await PostalMime.parse(rawBuffer);

  const messageId = message.headers.get('message-id') || '';
  const sender = message.from;
  const recipient = message.to;
  const subject = parsed.subject || '(no subject)';
  const textBody = parsed.text || null;
  const htmlBody = parsed.html || null;

  // Extract key headers only
  const headers: Record<string, string> = {};
  for (const key of HEADER_KEYS) {
    const val = message.headers.get(key);
    if (val) headers[key] = val;
  }

  await insertEmail(env.DB, {
    message_id: messageId,
    sender,
    recipient,
    subject,
    raw_size: message.rawSize,
    text_body: textBody,
    html_body: htmlBody,
    headers: JSON.stringify(headers),
  });
}
TYPESCRIPT
```

- [ ] **Step 2: Commit**

```bash
git add packages/worker/src/email-handler.ts && git commit -m "feat: add email handler with postal-mime parsing"
```

---

### Task 11: Worker entry

**Files:**
- Create: `packages/worker/src/index.ts`

- [ ] **Step 1: Create index.ts**

```bash
cat > packages/worker/src/index.ts << 'TYPESCRIPT'
import type { ExportedHandler } from '@cloudflare/workers-types';
import type { Env } from './types';
import { handleEmail } from './email-handler';
import { handleRequest } from './api/router';

export default {
  async email(message, env, _ctx): Promise<void> {
    await handleEmail(message, env as unknown as Env);
  },

  async fetch(request, env, _ctx): Promise<Response> {
    return handleRequest(request, env as unknown as Env);
  },
} satisfies ExportedHandler<Env>;
TYPESCRIPT
```

- [ ] **Step 2: Run type-check on worker**

```bash
cd packages/worker && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/worker/src/index.ts && git commit -m "feat: add worker entry with email + fetch handlers"
```

---

### Task 12: Web entry files

**Files:**
- Create: `packages/web/src/main.ts`
- Create: `packages/web/src/App.vue`
- Create: `packages/web/src/router.ts`
- Create: `packages/web/src/store.ts`
- Create: `packages/web/src/api.ts`

- [ ] **Step 1: Create main.ts**

```bash
cat > packages/web/src/main.ts << 'TYPESCRIPT'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
TYPESCRIPT
```

- [ ] **Step 2: Create App.vue**

```bash
cat > packages/web/src/App.vue << 'VUE'
<script setup lang="ts">
</script>

<template>
  <router-view />
</template>
VUE
```

- [ ] **Step 3: Create router.ts**

```bash
cat > packages/web/src/router.ts << 'TYPESCRIPT'
import { createRouter, createWebHistory } from 'vue-router'
import { token } from './store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('./views/LoginView.vue'),
    },
    {
      path: '/inbox/:id?',
      name: 'inbox',
      component: () => import('./views/InboxView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/inbox',
    },
  ],
})

router.beforeEach((to, _from, next) => {
  if (to.path === '/login') {
    // Already logged in? redirect to inbox
    if (token.value) return next('/inbox')
    return next()
  }
  if (!token.value) return next('/login')
  next()
})

export default router
TYPESCRIPT
```

- [ ] **Step 4: Create store.ts**

```bash
cat > packages/web/src/store.ts << 'TYPESCRIPT'
import { ref, watch } from 'vue'

export interface EmailMeta {
  id: number
  message_id: string
  sender: string
  recipient: string
  subject: string
  raw_size: number | null
  is_read: number
  created_at: string
}

export interface EmailDetail extends EmailMeta {
  text_body: string | null
  html_body: string | null
  headers: string | null
}

export interface ListResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export const token = ref<string>(localStorage.getItem('token') || '')

watch(token, (val) => {
  if (val) {
    localStorage.setItem('token', val)
  } else {
    localStorage.removeItem('token')
  }
})
TYPESCRIPT
```

- [ ] **Step 5: Create api.ts**

```bash
cat > packages/web/src/api.ts << 'TYPESCRIPT'
import { token } from './store'
import type { EmailMeta, EmailDetail, ListResult } from './store'

const BASE = import.meta.env.VITE_API_BASE || ''

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token.value}`,
  }
}

export async function login(password: string): Promise<{ token: string; expiresAt: number }> {
  const res = await fetch(`${BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) throw new Error('Auth failed')
  return res.json()
}

export async function fetchEmails(page: number): Promise<ListResult<EmailMeta>> {
  const res = await fetch(`${BASE}/api/emails?page=${page}&limit=20`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch emails')
  return res.json()
}

export async function fetchEmailDetail(id: number): Promise<EmailDetail> {
  const res = await fetch(`${BASE}/api/emails/${id}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch email')
  return res.json()
}

export async function toggleEmailRead(id: number, isRead: boolean): Promise<void> {
  await fetch(`${BASE}/api/emails/${id}/read`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ is_read: isRead }),
  })
}
TYPESCRIPT
```

- [ ] **Step 6: Commit**

```bash
git add packages/web/src/main.ts packages/web/src/App.vue packages/web/src/router.ts packages/web/src/store.ts packages/web/src/api.ts && git commit -m "feat: add web entry files (router, store, api)"
```

---

### Task 13: Web LoginView

**Files:**
- Create: `packages/web/src/views/LoginView.vue`

- [ ] **Step 1: Create LoginView.vue**

```bash
cat > packages/web/src/views/LoginView.vue << 'VUE'
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NInput, NButton, NCard, NMessageProvider, useMessage } from 'naive-ui'
import { login } from '../api'
import { token } from '../store'

const router = useRouter()
const message = useMessage()
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!password.value) return
  loading.value = true
  try {
    const result = await login(password.value)
    token.value = result.token
    router.push('/inbox')
  } catch {
    message.error('密码错误')
  } finally {
    loading.value = false
  }
}

async function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') await handleLogin()
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <NCard title="Edge Mail" class="w-96">
      <div class="space-y-4">
        <NInput
          v-model:value="password"
          type="password"
          placeholder="请输入密码"
          :disabled="loading"
          @keydown="onKeydown"
        />
        <NButton
          type="primary"
          :loading="loading"
          block
          @click="handleLogin"
        >
          登录
        </NButton>
      </div>
    </NCard>
  </div>
</template>
VUE
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/views/LoginView.vue && git commit -m "feat: add LoginView"
```

---

### Task 14: Web EmailSidebar

**Files:**
- Create: `packages/web/src/components/EmailSidebar.vue`

- [ ] **Step 1: Create EmailSidebar.vue**

```bash
cat > packages/web/src/components/EmailSidebar.vue << 'VUE'
<script setup lang="ts">
import { NList, NListItem, NPagination, NTag, NText, NEllipsis } from 'naive-ui'
import type { EmailMeta } from '../store'

defineProps<{
  emails: EmailMeta[]
  currentId: number | null
  page: number
  total: number
  limit: number
}>()

const emit = defineEmits<{
  select: [id: number]
  'update:page': [page: number]
}>()

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'Z')
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col h-full border-r border-gray-200">
    <div class="p-3 border-b border-gray-200">
      <NText strong>收件箱</NText>
      <NText depth="3" class="ml-2">({{ total }})</NText>
    </div>

    <div class="flex-1 overflow-y-auto">
      <NList :show-divider="false" class="cursor-pointer">
        <NListItem
          v-for="email in emails"
          :key="email.id"
          :class="[
            'px-4 py-3 hover:bg-gray-50 transition-colors',
            currentId === email.id ? 'bg-blue-50' : '',
            !email.is_read ? 'font-semibold' : '',
          ]"
          @click="emit('select', email.id)"
        >
          <div class="w-full min-w-0">
            <div class="flex items-center justify-between gap-2">
              <NEllipsis class="text-sm">{{ email.sender }}</NEllipsis>
              <NText depth="3" class="text-xs whitespace-nowrap flex-shrink-0">
                {{ formatDate(email.created_at) }}
              </NText>
            </div>
            <div class="flex items-center gap-1 mt-1">
              <NEllipsis class="text-xs" :class="!email.is_read ? 'text-gray-900' : 'text-gray-500'">
                {{ email.subject }}
              </NEllipsis>
              <NTag v-if="!email.is_read" type="info" size="tiny" :bordered="false">
                新
              </NTag>
            </div>
          </div>
        </NListItem>
      </NList>
    </div>

    <div class="p-3 border-t border-gray-200 flex justify-center">
      <NPagination
        :page="page"
        :page-count="Math.ceil(total / limit) || 1"
        :page-size="limit"
        @update:page="emit('update:page', $event)"
      />
    </div>
  </div>
</template>
VUE
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/EmailSidebar.vue && git commit -m "feat: add EmailSidebar component"
```

---

### Task 15: Web EmailDetail

**Files:**
- Create: `packages/web/src/components/EmailDetail.vue`

- [ ] **Step 1: Create EmailDetail.vue**

```bash
cat > packages/web/src/components/EmailDetail.vue << 'VUE'
<script setup lang="ts">
import { NTag, NText, NDivider, NEmpty } from 'naive-ui'
import type { EmailDetail } from '../store'

defineProps<{
  email: EmailDetail | null
}>()

function formatFullDate(dateStr: string): string {
  return new Date(dateStr + 'Z').toLocaleString('zh-CN')
}
</script>

<template>
  <div class="flex-1 overflow-y-auto p-6">
    <template v-if="email">
      <!-- Header -->
      <div class="mb-4">
        <h2 class="text-xl font-bold mb-2">{{ email.subject }}</h2>
        <div class="flex flex-col gap-1 text-sm">
          <div>
            <NText depth="3" class="w-12 inline-block">发件人:</NText>
            <NText>{{ email.sender }}</NText>
          </div>
          <div>
            <NText depth="3" class="w-12 inline-block">收件人:</NText>
            <NText>{{ email.recipient }}</NText>
          </div>
          <div>
            <NText depth="3" class="w-12 inline-block">时间:</NText>
            <NText>{{ formatFullDate(email.created_at) }}</NText>
          </div>
        </div>
        <div class="mt-2">
          <NTag :type="email.is_read ? 'default' : 'info'" size="small">
            {{ email.is_read ? '已读' : '未读' }}
          </NTag>
        </div>
      </div>

      <NDivider />

      <!-- Body -->
      <div class="prose max-w-none text-sm">
        <div v-if="email.html_body" v-html="email.html_body" class="email-body" />
        <pre v-else-if="email.text_body" class="whitespace-pre-wrap font-sans text-sm">{{ email.text_body }}</pre>
        <NText v-else depth="3">（无正文内容）</NText>
      </div>
    </template>

    <template v-else>
      <div class="flex items-center justify-center h-full">
        <NEmpty description="选择一封邮件查看" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.email-body :deep(img) {
  max-width: 100%;
  height: auto;
}

.email-body :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}
</style>
VUE
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/EmailDetail.vue && git commit -m "feat: add EmailDetail component"
```

---

### Task 16: Web InboxView

**Files:**
- Create: `packages/web/src/views/InboxView.vue`

- [ ] **Step 1: Create InboxView.vue**

```bash
cat > packages/web/src/views/InboxView.vue << 'VUE'
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NMessageProvider, useMessage } from 'naive-ui'
import { fetchEmails, fetchEmailDetail } from '../api'
import { token, emails, currentEmail } from '../store'
import EmailSidebar from '../components/EmailSidebar.vue'
import EmailDetail from '../components/EmailDetail.vue'
import type { EmailMeta, EmailDetail as EmailDetailType } from '../store'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const page = ref(1)
const total = ref(0)
const limit = 20
const detailLoading = ref(false)

async function loadEmails() {
  try {
    const result = await fetchEmails(page.value)
    emails.value = result.items
    total.value = result.total
  } catch {
    message.error('加载邮件失败')
  }
}

async function selectEmail(id: number) {
  router.push(`/inbox/${id}`)
}

async function loadDetail(id: number) {
  detailLoading.value = true
  try {
    const email = await fetchEmailDetail(id)
    currentEmail.value = email
    // Update is_read in list
    const idx = emails.value.findIndex((e) => e.id === id)
    if (idx !== -1) {
      emails.value[idx] = { ...emails.value[idx], is_read: 1 }
    }
  } catch {
    message.error('加载邮件详情失败')
  } finally {
    detailLoading.value = false
  }
}

function onPageChange(newPage: number) {
  page.value = newPage
}

function logout() {
  token.value = ''
  currentEmail.value = null
  emails.value = []
  router.push('/login')
}

onMounted(() => {
  loadEmails()
})

watch(page, () => {
  loadEmails()
})

// React to route param change
watch(
  () => route.params.id,
  (id) => {
    if (id && typeof id === 'string') {
      loadDetail(parseInt(id))
    } else {
      currentEmail.value = null
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="h-screen flex flex-col">
    <!-- Top bar -->
    <header class="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      <h1 class="text-lg font-bold">Edge Mail</h1>
      <NButton size="small" text @click="logout">退出</NButton>
    </header>

    <!-- Main content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <div class="w-80 flex-shrink-0">
        <EmailSidebar
          :emails="emails"
          :current-id="currentEmail?.id ?? null"
          :page="page"
          :total="total"
          :limit="limit"
          @select="selectEmail"
          @update:page="onPageChange"
        />
      </div>

      <!-- Detail -->
      <EmailDetail :email="currentEmail" />
    </div>
  </div>
</template>
VUE
```

- [ ] **Step 2: Run type-check on web**

```bash
cd packages/web && npx vue-tsc --noEmit
```

- [ ] **Step 3: Build web**

```bash
cd packages/web && npx vite build
```

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/views/InboxView.vue && git commit -m "feat: add InboxView with email list + detail"
```
