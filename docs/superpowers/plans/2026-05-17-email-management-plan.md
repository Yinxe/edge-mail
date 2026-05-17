# Email Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email search (by sender/subject) and single-email delete with confirmation dialog.

**Architecture:** Backend extends existing Hono API with `GET /api/emails?q=` (reusing pagination) and `DELETE /api/emails/:id`. Frontend adds search bar to InboxView header, delete buttons on list items (hover) and detail view, with Naive UI modal confirmation.

**Tech Stack:** Hono + D1 (SQLite) + Vitest (backend), Vue 3 + Naive UI + TypeScript (frontend)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/worker/schema.sql` | Modify | Add `ON DELETE CASCADE` to `email_bodies.email_id` FK |
| `packages/worker/src/db.ts` | Modify | Add `searchEmails()`, `deleteEmail()` functions |
| `packages/worker/src/api/emails.ts` | Modify | Add `handleDeleteEmail`, enhance `handleListEmails` with `q` param |
| `packages/worker/src/api/router.ts` | Modify | Add `DELETE` route, update CORS `allowMethods` |
| `packages/worker/src/types.ts` | No change | Existing types sufficient |
| `packages/worker/src/api/__tests__/emails.test.ts` | Create | Tests for search + delete endpoints |
| `packages/web/src/api.ts` | Modify | Add `deleteEmail()`, update `fetchEmails()` signature |
| `packages/web/src/composables/useEmails.ts` | Modify | Add `searchQuery`, `handleSearch()`, `handleDelete()` with page-graceful fallback |
| `packages/web/src/views/InboxView.vue` | Modify | Add search bar (header), delete confirmation modal, wire delete handler |
| `packages/web/src/components/EmailSidebar.vue` | Modify | Forward `delete` event from EmailListItem |
| `packages/web/src/components/EmailListItem.vue` | Modify | Add hover delete button (`@click.stop`) |
| `packages/web/src/components/EmailDetail.vue` | Modify | Add delete button in header meta area |

---

### Task 1: Schema + DB Layer

**Files:**
- Modify: `packages/worker/schema.sql:14`
- Modify: `packages/worker/src/db.ts`

- [ ] **Step 1: Update schema.sql — add ON DELETE CASCADE**

Change line 14 from:
```sql
email_id  INTEGER NOT NULL UNIQUE REFERENCES emails(id),
```
to:
```sql
email_id  INTEGER NOT NULL UNIQUE REFERENCES emails(id) ON DELETE CASCADE,
```

- [ ] **Step 2: Add `searchEmails` function to db.ts**

After `setEmailRead` (line 94), add:

```ts
/** Search emails by sender or subject (LIKE, paginated) */
export async function searchEmails(
  db: D1Database,
  q: string,
  page: number,
  limit: number,
): Promise<ListResult<EmailMeta>> {
  const offset = (page - 1) * limit;

  // Escape LIKE wildcards so user input is matched literally
  const escaped = q.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
  const pattern = `%${escaped}%`;

  const countResult = await db.prepare(
    "SELECT COUNT(*) as total FROM emails WHERE sender LIKE ? ESCAPE '\\' OR subject LIKE ? ESCAPE '\\'"
  ).bind(pattern, pattern).first<{ total: number }>();
  const total = countResult?.total ?? 0;

  const { results } = await db.prepare(
    "SELECT id, message_id, sender, recipient, subject, raw_size, is_read, created_at FROM emails WHERE sender LIKE ? ESCAPE '\\' OR subject LIKE ? ESCAPE '\\' ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ).bind(pattern, pattern, limit, offset).all<EmailMeta>();

  return { items: results, total, page, limit };
}
```

- [ ] **Step 3: Add `deleteEmail` function to db.ts**

After `searchEmails`, add:

```ts
/** Delete an email and its body (via ON DELETE CASCADE) */
export async function deleteEmail(
  db: D1Database,
  id: number,
): Promise<boolean> {
  const result = await db.prepare('DELETE FROM emails WHERE id = ?').bind(id).run();
  // TODO: 删除关联的附件资源（当附件存储功能实现时）
  return (result.meta.changes ?? 0) > 0;
}
```

- [ ] **Step 4: Run existing tests to confirm no regression**

```bash
cd packages/worker && npx vitest run
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/worker/schema.sql packages/worker/src/db.ts
git commit -m "feat: add searchEmails and deleteEmail to DB layer"
```

---

### Task 2: API Handlers + Routes

**Files:**
- Modify: `packages/worker/src/api/emails.ts`
- Modify: `packages/worker/src/api/router.ts`

- [ ] **Step 1: Update imports in emails.ts**

Change:
```ts
import { listEmails, getEmailById, setEmailRead } from '../db';
```
to:
```ts
import { listEmails, getEmailById, setEmailRead, searchEmails, deleteEmail } from '../db';
```

- [ ] **Step 2: Enhance handleListEmails to support `q` param**

Replace the existing `handleListEmails` function (lines 7-13) with:

```ts
export async function handleListEmails(c: C): Promise<Response> {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
  const q = c.req.query('q') ?? '';

  const result = q
    ? await searchEmails(c.env.DB, q, page, limit)
    : await listEmails(c.env.DB, page, limit);
  return c.json(result);
}
```

- [ ] **Step 3: Add handleDeleteEmail**

After `handleToggleRead`, add:

```ts
export async function handleDeleteEmail(c: C): Promise<Response> {
  const id = parseInt(c.req.param('id') ?? '');
  const ok = await deleteEmail(c.env.DB, id);
  if (!ok) {
    return c.json({ error: 'Email not found' }, 404);
  }
  return c.json({ ok: true });
}
```

- [ ] **Step 4: Update router.ts — imports**

Change:
```ts
import { handleListEmails, handleGetEmail, handleToggleRead } from './emails';
```
to:
```ts
import { handleListEmails, handleGetEmail, handleToggleRead, handleDeleteEmail } from './emails';
```

- [ ] **Step 5: Update router.ts — add DELETE route**

After line 37 (`app.put('/api/emails/:id/read', authMiddleware, handleToggleRead);`), add:

```ts
app.delete('/api/emails/:id', authMiddleware, handleDeleteEmail);
```

- [ ] **Step 6: Update router.ts — CORS allowMethods**

Change line 27:
```ts
allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
```
to:
```ts
allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
```

- [ ] **Step 7: Commit**

```bash
git add packages/worker/src/api/emails.ts packages/worker/src/api/router.ts
git commit -m "feat: add search and delete API endpoints"
```

---

### Task 3: Backend Tests

**Files:**
- Create: `packages/worker/src/api/__tests__/emails.test.ts`

- [ ] **Step 1: Create test file**

Create `packages/worker/src/api/__tests__/emails.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../router';
import { verifyToken } from '../auth';

const TEST_PASSWORD = '123456';
const TEST_SECRET = 'test-secret-for-hmac';

/**
 * Flexible D1 mock that returns configured results per query type.
 * Each mock method returns `this` for chaining (`prepare → bind`).
 */
function createMockD1(overrides?: {
  allResults?: { results: unknown[]; success: boolean };
  firstResult?: Record<string, unknown> | null;
  runChanges?: number;
}) {
  const stmt = {
    bind: () => stmt,
    all: async () => overrides?.allResults ?? { results: [], success: true },
    first: async () => overrides?.firstResult ?? null,
    run: async () => ({ meta: { changes: overrides?.runChanges ?? 0 } }),
  };
  return {
    prepare: () => stmt,
    batch: async () => [],
  } as unknown as D1Database;
}

function mockEnv(overrides?: Record<string, unknown>) {
  return {
    DB: createMockD1(),
    AUTH_PASSWORD: TEST_PASSWORD,
    AUTH_SECRET: TEST_SECRET,
    ...overrides,
  };
}

/** Get a valid auth token for testing protected routes */
async function getToken(): Promise<string> {
  const res = await app.request('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: TEST_PASSWORD }),
  }, mockEnv());
  const body = await res.json() as { token: string };
  return body.token;
}

describe('GET /api/emails — search', () => {
  it('should return all emails when no q param', async () => {
    const token = await getToken();
    const mockDB = createMockD1({
      firstResult: { total: 2 },
      allResults: {
        results: [
          { id: 1, message_id: 'm1', sender: 'a@b.com', recipient: 'x@y.com', subject: 'Hello', raw_size: 100, is_read: 0, created_at: '2026-01-01' },
          { id: 2, message_id: 'm2', sender: 'c@d.com', recipient: 'x@y.com', subject: 'World', raw_size: 200, is_read: 1, created_at: '2026-01-02' },
        ],
        success: true,
      },
    });

    const res = await app.request('/api/emails', {
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv({ DB: mockDB }));

    expect(res.status).toBe(200);
    const body = await res.json() as { items: unknown[]; total: number };
    expect(body.items).toHaveLength(2);
    expect(body.total).toBe(2);
  });

  it('should filter by q param', async () => {
    const token = await getToken();
    const mockDB = createMockD1({
      firstResult: { total: 1 },
      allResults: {
        results: [
          { id: 1, message_id: 'm1', sender: 'hello@b.com', recipient: 'x@y.com', subject: 'Greetings', raw_size: 100, is_read: 0, created_at: '2026-01-01' },
        ],
        success: true,
      },
    });

    const res = await app.request('/api/emails?q=hello', {
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv({ DB: mockDB }));

    expect(res.status).toBe(200);
    const body = await res.json() as { items: unknown[]; total: number };
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toHaveProperty('sender', 'hello@b.com');
  });

  it('should return empty list when q matches nothing', async () => {
    const token = await getToken();
    const mockDB = createMockD1({
      firstResult: { total: 0 },
      allResults: { results: [], success: true },
    });

    const res = await app.request('/api/emails?q=zzzzzz', {
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv({ DB: mockDB }));

    expect(res.status).toBe(200);
    const body = await res.json() as { items: unknown[]; total: number };
    expect(body.items).toHaveLength(0);
    expect(body.total).toBe(0);
  });
});

describe('DELETE /api/emails/:id', () => {
  it('should delete an existing email', async () => {
    const token = await getToken();
    const mockDB = createMockD1({ runChanges: 1 });

    const res = await app.request('/api/emails/1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv({ DB: mockDB }));

    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it('should return 404 for non-existent email', async () => {
    const token = await getToken();
    const mockDB = createMockD1({ runChanges: 0 });

    const res = await app.request('/api/emails/999', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv({ DB: mockDB }));

    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Email not found');
  });

  it('should reject without auth', async () => {
    const res = await app.request('/api/emails/1', {
      method: 'DELETE',
    }, mockEnv());

    expect(res.status).toBe(401);
  });

  it('should reject invalid id param', async () => {
    const token = await getToken();
    const res = await app.request('/api/emails/abc', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv());

    expect(res.status).toBe(404);  // NaN → parseInt returns NaN → no match
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd packages/worker && npx vitest run
```
Expected: all tests (auth + emails) pass.

- [ ] **Step 3: Commit**

```bash
git add packages/worker/src/api/__tests__/emails.test.ts
git commit -m "test: add search and delete API endpoint tests"
```

---

### Task 4: Frontend API Layer

**File:**
- Modify: `packages/web/src/api.ts`

- [ ] **Step 1: Update fetchEmails to accept optional q param**

Replace the `fetchEmails` function with:

```ts
export async function fetchEmails(page: number, q?: string): Promise<ListResult<EmailMeta>> {
  const params = new URLSearchParams({ page: String(page), limit: '20' })
  if (q) params.set('q', q)
  const res = await fetch(`${BASE}/api/emails?${params}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch emails')
  return res.json()
}
```

- [ ] **Step 2: Add deleteEmail function**

After `toggleEmailRead`, add:

```ts
export async function deleteEmail(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/emails/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete email')
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/api.ts
git commit -m "feat(web): add deleteEmail API call and search param"
```

---

### Task 5: Frontend Composable (useEmails)

**File:**
- Modify: `packages/web/src/composables/useEmails.ts`

- [ ] **Step 1: Add search + delete state and methods**

Replace the entire file content with:

```ts
import { shallowRef, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { fetchEmails, fetchEmailDetail, toggleEmailRead, deleteEmail } from '../api'
import type { EmailMeta, EmailDetail } from '../store'

export function useEmails() {
  const route = useRoute()
  const router = useRouter()
  const message = useMessage()

  const emails = shallowRef<EmailMeta[]>([])
  const currentEmail = shallowRef<EmailDetail | null>(null)
  const page = shallowRef(1)
  const total = shallowRef(0)
  const loading = shallowRef(false)
  const detailLoading = shallowRef(false)
  const searchQuery = ref('')
  const limit = 20

  async function loadEmails() {
    loading.value = true
    try {
      const result = await fetchEmails(page.value, searchQuery.value || undefined)
      emails.value = result.items
      total.value = result.total
    } catch {
      message.error(searchQuery.value ? '搜索失败' : '加载邮件失败')
    } finally {
      loading.value = false
    }
  }

  async function loadDetail(id: number) {
    detailLoading.value = true
    try {
      const email = await fetchEmailDetail(id)
      currentEmail.value = email
      // Mark as read in the sidebar list optimistically
      const idx = emails.value.findIndex((e) => e.id === id)
      if (idx !== -1 && !emails.value[idx].is_read) {
        const updated = [...emails.value]
        updated[idx] = { ...updated[idx], is_read: 1 }
        emails.value = updated
      }
    } catch {
      message.error('加载邮件详情失败')
    } finally {
      detailLoading.value = false
    }
  }

  function selectEmail(id: number) {
    router.push(`/inbox/${id}`)
  }

  function handlePageChange(newPage: number) {
    page.value = newPage
  }

  function handleSearch(query: string) {
    searchQuery.value = query
    page.value = 1
    // watch(page) will trigger loadEmails
  }

  async function handleDelete(id: number) {
    try {
      await deleteEmail(id)
      message.success('邮件已删除')
      // Clear detail view if the deleted email was being viewed
      if (currentEmail.value?.id === id) {
        currentEmail.value = null
        router.replace('/inbox')
      }
      // Reload — if the page becomes empty, step back
      await loadEmails()
      if (emails.value.length === 0 && page.value > 1) {
        page.value--
      }
    } catch {
      message.error('删除失败')
    }
  }

  // Load emails on mount and on page change
  onMounted(loadEmails)
  watch(page, loadEmails)

  // Load detail when route param changes
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

  return {
    emails,
    currentEmail,
    page,
    total,
    limit,
    loading,
    detailLoading,
    searchQuery,
    selectEmail,
    handlePageChange,
    handleSearch,
    handleDelete,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/composables/useEmails.ts
git commit -m "feat(web): add search and delete to useEmails composable"
```

---

### Task 6: EmailListItem + EmailSidebar Delete

**Files:**
- Modify: `packages/web/src/components/EmailListItem.vue`
- Modify: `packages/web/src/components/EmailSidebar.vue`

- [ ] **Step 1: Add delete button to EmailListItem**

In the `<script setup>` section, no import changes needed (use `NButton` from naive-ui if not already — it's not imported currently).

Update the template. In the `.email-item__footer` div, after the subject NEllipsis and before the NTag, add a hover-visible delete button:

```vue
<div class="email-item__actions">
  <NButton
    text
    size="tiny"
    class="email-item__delete"
    @click.stop="emit('delete', email.id)"
  >
    <template #icon>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
    </template>
  </NButton>
</div>
```

Update the emit definition:
```ts
const emit = defineEmits<{
  select: [id: number]
  delete: [id: number]
}>()
```

Add CSS (inside `<style scoped>`):
```css
.email-item__actions {
  display: none;
  flex-shrink: 0;
  align-items: center;
}
.email-item:hover .email-item__actions {
  display: flex;
}
.email-item__delete {
  color: #E55959;
  opacity: 0.6;
  transition: opacity 150ms ease-out;
}
.email-item__delete:hover {
  opacity: 1;
}
```

- [ ] **Step 2: Forward delete event in EmailSidebar**

Update the emit definition in `EmailSidebar.vue`:
```ts
const emit = defineEmits<{
  select: [id: number]
  delete: [id: number]
  'update:page': [page: number]
}>()
```

Update the EmailListItem binding to forward the delete event:
```vue
<EmailListItem
  v-for="email in emails"
  :key="email.id"
  :email="email"
  :is-selected="currentId === email.id"
  @select="emit('select', $event)"
  @delete="emit('delete', $event)"
/>
```

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/components/EmailListItem.vue packages/web/src/components/EmailSidebar.vue
git commit -m "feat(web): add delete button to email list items"
```

---

### Task 7: EmailDetail Delete Button

**File:**
- Modify: `packages/web/src/components/EmailDetail.vue`

- [ ] **Step 1: Add delete emit and button**

In `<script setup>`, add:
```ts
const emit = defineEmits<{
  delete: [id: number]
}>()
```

In the template, inside `.detail__header` (before `</div>` closing the header), after `.detail__tags` div, add a delete button:

```vue
<div class="detail__actions">
  <NButton
    type="error"
    size="small"
    tertiary
    @click="emit('delete', email.id)"
  >
    <template #icon>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
    </template>
    删除
  </NButton>
</div>
```

Add CSS:
```css
.detail__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #EAE5E8;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/EmailDetail.vue
git commit -m "feat(web): add delete button to email detail view"
```

---

### Task 8: InboxView — Search Bar + Delete Confirmation + Integration

**File:**
- Modify: `packages/web/src/views/InboxView.vue`

- [ ] **Step 1: Wire everything together in InboxView**

Replace the entire `<script setup>` block with:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useMessage, NModal, NCheckbox } from 'naive-ui'
import { useAuth } from '../composables/useAuth'
import { useEmails } from '../composables/useEmails'
import EmailSidebar from '../components/EmailSidebar.vue'
import EmailDetail from '../components/EmailDetail.vue'

const message = useMessage()
const { logout } = useAuth()
const {
  emails,
  currentEmail,
  page,
  total,
  limit,
  loading: detailLoading,
  searchQuery,
  selectEmail,
  handlePageChange,
  handleSearch,
  handleDelete,
} = useEmails()

const pendingDeleteId = ref<number | null>(null)
const showDeleteModal = ref(false)
const dontAskAgain = ref(false)

function handleLogout() {
  logout()
  message.success('已退出登录')
}

function onSearchInput(value: string) {
  handleSearch(value)
}

function onClearSearch() {
  handleSearch('')
}

function requestDelete(id: number) {
  if (localStorage.getItem('deleteConfirmDisabled')) {
    handleDelete(id)
    return
  }
  pendingDeleteId.value = id
  dontAskAgain.value = false
  showDeleteModal.value = true
}

function confirmDelete() {
  if (dontAskAgain.value) {
    localStorage.setItem('deleteConfirmDisabled', '1')
  }
  if (pendingDeleteId.value !== null) {
    handleDelete(pendingDeleteId.value)
  }
  showDeleteModal.value = false
  pendingDeleteId.value = null
}
</script>
```

- [ ] **Step 2: Update template**

Replace the template with:

```vue
<template>
  <div class="inbox">
    <!-- Header -->
    <header class="inbox__header">
      <div class="inbox__brand">
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill="#E85D75" />
          <path d="M10 14h20v14a2 2 0 01-2 2H12a2 2 0 01-2-2V14z" fill="white" opacity="0.9" />
          <path d="M10 14l10 8 10-8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
        </svg>
        <h1 class="inbox__title">EdgeMail</h1>
        <span class="inbox__subtitle">Powered by Cloudflare</span>
      </div>

      <!-- Search bar -->
      <div class="inbox__search">
        <svg class="inbox__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          class="inbox__search-input"
          type="text"
          placeholder="搜索发件人或主题…"
          :value="searchQuery"
          @input="onSearchInput(($event.target as HTMLInputElement).value)"
        />
        <button
          v-if="searchQuery"
          class="inbox__search-clear"
          @click="onClearSearch"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <button class="inbox__logout" @click="handleLogout">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>退出</span>
      </button>
    </header>

    <!-- Main content -->
    <div class="inbox__main">
      <div class="inbox__sidebar">
        <EmailSidebar
          :emails="emails"
          :current-id="currentEmail?.id ?? null"
          :page="page"
          :total="total"
          :limit="limit"
          @select="selectEmail"
          @delete="requestDelete"
          @update:page="handlePageChange"
        />
      </div>
      <EmailDetail
        :email="currentEmail"
        :loading="detailLoading"
        @delete="requestDelete"
      />
    </div>

    <!-- Delete confirmation modal -->
    <NModal v-model:show="showDeleteModal" preset="dialog" title="确认删除" positive-text="删除" negative-text="取消" @positive-click="confirmDelete" @negative-click="showDeleteModal = false">
      <p class="inbox__delete-msg">确定要删除这封邮件吗？此操作不可撤销。</p>
      <NCheckbox v-model:checked="dontAskAgain">不再提示</NCheckbox>
    </NModal>
  </div>
</template>
```

- [ ] **Step 3: Add new CSS styles**

Append to existing `<style scoped>` block, after `.inbox__sidebar`:

```css
/* ── Search ── */
.inbox__search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 360px;
  margin: 0 16px;
  padding: 6px 12px;
  background: #F8F6F7;
  border: 1px solid #EAE5E8;
  border-radius: 10px;
  transition: border-color 200ms ease-out;
}
.inbox__search:focus-within {
  border-color: #E85D75;
  background: #FFFFFF;
}
.inbox__search-icon {
  flex-shrink: 0;
  color: #9E9196;
}
.inbox__search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Noto Sans SC',
    'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #2D2327;
  outline: none;
  min-width: 0;
}
.inbox__search-input::placeholder {
  color: #9E9196;
}
.inbox__search-clear {
  display: flex;
  align-items: center;
  padding: 2px;
  border: none;
  background: transparent;
  color: #9E9196;
  cursor: pointer;
  border-radius: 4px;
  transition: color 150ms ease-out;
}
.inbox__search-clear:hover {
  color: #E85D75;
}
.inbox__delete-msg {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #6B5E63;
  line-height: 1.6;
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/views/InboxView.vue
git commit -m "feat(web): add search bar and delete confirmation to inbox view"
```

---

### Task 9: Verify Everything

- [ ] **Step 1: Run backend tests**

```bash
cd packages/worker && npx vitest run
```
Expected: all tests pass.

- [ ] **Step 2: Check frontend type check**

```bash
cd packages/web && npx vue-tsc --noEmit
```
Expected: no type errors.

- [ ] **Step 3: Check build**

```bash
cd packages/web && npx vite build
```
Expected: build succeeds.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: finalize email management feature"
```
