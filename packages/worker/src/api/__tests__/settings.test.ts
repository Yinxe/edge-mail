import { describe, it, expect } from 'vitest';
import { app } from '../router';

const TEST_PASSWORD = '123456';
const TEST_SECRET = 'test-secret-for-hmac';

function createMockD1(overrides?: {
  firstResult?: Record<string, unknown> | null;
  runChanges?: number;
}) {
  const stmt = {
    bind: () => stmt,
    first: async () => overrides?.firstResult ?? null,
    run: async () => ({ meta: { changes: overrides?.runChanges ?? 0 } }),
  };
  return {
    prepare: () => stmt,
    batch: async (stmts: unknown[]) =>
      stmts.map(() => ({ meta: { changes: overrides?.runChanges ?? 0 } })),
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

async function getToken(): Promise<string> {
  const res = await app.request('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: TEST_PASSWORD }),
  }, mockEnv());
  const body = await res.json() as { token: string };
  return body.token;
}

describe('GET /api/settings', () => {
  it('should return all settings groups with defaults when no DB rows exist', async () => {
    const token = await getToken();
    const mockDB = createMockD1({ firstResult: null });

    const res = await app.request('/api/settings', {
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv({ DB: mockDB }));

    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body).toHaveProperty('email');
    expect(body.email).toEqual({ pageSize: 20, showPreview: true });
  });

  it('should return settings with DB overrides merged into defaults', async () => {
    const token = await getToken();
    const mockDB = createMockD1({
      firstResult: { value: '{"pageSize":50}' },
    });

    const res = await app.request('/api/settings', {
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv({ DB: mockDB }));

    expect(res.status).toBe(200);
    const body = await res.json() as { email: { pageSize: number; showPreview: boolean } };
    expect(body.email.pageSize).toBe(50);
    expect(body.email.showPreview).toBe(true); // default value preserved
  });

  it('should fall back to defaults when DB value has invalid JSON', async () => {
    const token = await getToken();
    const mockDB = createMockD1({
      firstResult: { value: 'not valid json' },
    });

    const res = await app.request('/api/settings', {
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv({ DB: mockDB }));

    expect(res.status).toBe(200);
    const body = await res.json() as { email: { pageSize: number } };
    expect(body.email).toEqual({ pageSize: 20, showPreview: true });
  });

  it('should reject without auth', async () => {
    const res = await app.request('/api/settings', {}, mockEnv());
    expect(res.status).toBe(401);
  });
});

describe('GET /api/settings/:group', () => {
  it('should return settings for a valid group', async () => {
    const token = await getToken();
    const mockDB = createMockD1({
      firstResult: { value: '{"pageSize":30}' },
    });

    const res = await app.request('/api/settings/email', {
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv({ DB: mockDB }));

    expect(res.status).toBe(200);
    const body = await res.json() as { pageSize: number; showPreview: boolean };
    expect(body.pageSize).toBe(30);
    expect(body.showPreview).toBe(true);
  });

  it('should return 404 for unknown group', async () => {
    const token = await getToken();

    const res = await app.request('/api/settings/unknown', {
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv());

    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Unknown settings group: unknown');
  });
});

describe('PUT /api/settings/:group', () => {
  it('should update settings for a valid group', async () => {
    const token = await getToken();
    const mockDB = createMockD1({
      firstResult: { value: '{"pageSize":20,"showPreview":true}' },
      runChanges: 1,
    });

    const res = await app.request('/api/settings/email', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pageSize: 100 }),
    }, mockEnv({ DB: mockDB }));

    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it('should return 404 for unknown group', async () => {
    const token = await getToken();

    const res = await app.request('/api/settings/unknown', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ some: 'value' }),
    }, mockEnv());

    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Unknown settings group: unknown');
  });

  it('should return 400 for invalid body', async () => {
    const token = await getToken();

    const res = await app.request('/api/settings/email', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: 'not json',
    }, mockEnv());

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Invalid request body');
  });

  it('should reject without auth', async () => {
    const res = await app.request('/api/settings/email', {
      method: 'PUT',
    }, mockEnv());
    expect(res.status).toBe(401);
  });
});
