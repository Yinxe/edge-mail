import { describe, it, expect } from 'vitest';
import { app } from '../router';

const TEST_PASSWORD = '123456';
const TEST_SECRET = 'test-secret-for-hmac';

/**
 * Flexible D1 mock that returns configured results per query type.
 * Each mock method returns `this` for chaining (prepare → bind).
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

  it('should fall through to listEmails when q is empty string', async () => {
    const token = await getToken();
    // Mock with data to verify listEmails is called (not searchEmails)
    const mockDB = createMockD1({
      firstResult: { total: 1 },
      allResults: {
        results: [
          { id: 1, message_id: 'm1', sender: 'a@b.com', recipient: 'x@y.com', subject: 'Hello', raw_size: 100, is_read: 0, created_at: '2026-01-01' },
        ],
        success: true,
      },
    });

    const res = await app.request('/api/emails?q=', {
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv({ DB: mockDB }));

    expect(res.status).toBe(200);
    const body = await res.json() as { items: unknown[]; total: number };
    expect(body.items).toHaveLength(1);
    expect(body.total).toBe(1);
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

  it('should return 400 for invalid id', async () => {
    const token = await getToken();
    const res = await app.request('/api/emails/abc', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv());  // DB won't be touched since validation happens before DB call

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Invalid email ID');
  });

  it('should return 400 for id 0', async () => {
    const token = await getToken();
    const res = await app.request('/api/emails/0', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv());

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Invalid email ID');
  });

  it('should return 400 for negative id', async () => {
    const token = await getToken();
    const res = await app.request('/api/emails/-1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv());

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Invalid email ID');
  });
});

describe('GET /api/emails/:id', () => {
  it('should return email detail for existing email', async () => {
    const token = await getToken();
    const mockEmail = {
      id: 1,
      message_id: 'm1',
      sender: 'a@b.com',
      recipient: 'x@y.com',
      subject: 'Hello',
      raw_size: 100,
      is_read: 0,
      created_at: '2026-01-01T00:00:00.000Z',
      text_body: 'Hello world',
      html_body: null,
      headers: '{"from":"a@b.com"}',
    };
    const mockDB = createMockD1({
      firstResult: mockEmail,
      runChanges: 1, // for the UPDATE marking as read
    });

    const res = await app.request('/api/emails/1', {
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv({ DB: mockDB }));

    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.id).toBe(1);
    expect(body.sender).toBe('a@b.com');
    expect(body.subject).toBe('Hello');
    expect(body.text_body).toBe('Hello world');
  });

  it('should return 404 for non-existent email', async () => {
    const token = await getToken();
    // Default mock returns firstResult: null and runChanges: 0
    const res = await app.request('/api/emails/999', {
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv());

    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Email not found');
  });

  it('should reject without auth', async () => {
    const res = await app.request('/api/emails/1', {}, mockEnv());
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/emails/:id/read', () => {
  it('should mark email as read', async () => {
    const token = await getToken();
    const mockDB = createMockD1({ runChanges: 1 });

    const res = await app.request('/api/emails/1/read', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_read: true }),
    }, mockEnv({ DB: mockDB }));

    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it('should return 404 for non-existent email', async () => {
    const token = await getToken();
    const mockDB = createMockD1({ runChanges: 0 });

    const res = await app.request('/api/emails/999/read', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_read: true }),
    }, mockEnv({ DB: mockDB }));

    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Email not found');
  });

  it('should default to marking as read when body is empty', async () => {
    const token = await getToken();
    const mockDB = createMockD1({ runChanges: 1 });

    const res = await app.request('/api/emails/1/read', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      // No body — handler defaults to is_read = true
    }, mockEnv({ DB: mockDB }));

    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it('should reject without auth', async () => {
    const res = await app.request('/api/emails/1/read', {
      method: 'PUT',
    }, mockEnv());
    expect(res.status).toBe(401);
  });
});
