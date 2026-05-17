import { describe, it, expect } from 'vitest';
import { app } from '../router';
import { verifyToken } from '../../auth/service';

const TEST_PASSWORD = '123456';
const TEST_SECRET = 'test-secret-for-hmac';

function mockD1() {
  const stmt = {
    bind: () => stmt,
    all: async () => ({ results: [] }),
    first: async () => ({ total: 0 }),
    run: async () => ({ meta: { changes: 0 } }),
  };
  return {
    prepare: () => stmt,
    batch: async () => [],
  } as unknown as D1Database;
}

function mockEnv(overrides?: Partial<{ password: string; secret: string }>) {
  return {
    DB: mockD1(),
    AUTH_PASSWORD: overrides?.password ?? TEST_PASSWORD,
    AUTH_SECRET: overrides?.secret ?? TEST_SECRET,
  };
}

describe('POST /api/auth', () => {
  it('should reject wrong password', async () => {
    const res = await app.request('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong' }),
    }, mockEnv());
    expect(res.status).toBe(401);
    const body: { error?: string } = await res.json();
    expect(body.error).toBe('Invalid password');
  });

  it('should reject empty body', async () => {
    const res = await app.request('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }, mockEnv());
    expect(res.status).toBe(401);
  });

  it('should reject invalid JSON', async () => {
    const res = await app.request('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    }, mockEnv());
    expect(res.status).toBe(400);
  });

  it('should accept correct password and return token', async () => {
    const env = mockEnv();
    const res = await app.request('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: TEST_PASSWORD }),
    }, env);
    expect(res.status).toBe(200);

    const body: { token: string; expiresAt: number } = await res.json();
    expect(typeof body.token).toBe('string');
    expect(typeof body.expiresAt).toBe('number');

    // Token should be verifiable
    const valid = await verifyToken(body.token, env.AUTH_SECRET);
    expect(valid).toBe(true);
  });

  it('should reject expired token', async () => {
    // Create a token with timestamp in the past
    const pastExpiry = Date.now() - 1000;
    const token = `${pastExpiry}.deadbeef`;  // Bad sig, but should fail on expiry first
    const valid = await verifyToken(token, TEST_SECRET);
    expect(valid).toBe(false);
  });

  it('should reject tampered token', async () => {
    const env = mockEnv();
    const res = await app.request('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: TEST_PASSWORD }),
    }, env);
    const body: { token: string } = await res.json();

    // Tamper with the token
    const parts = body.token.split('.');
    const tamperedToken = parts[0] + '.ffffffffffff';
    const valid = await verifyToken(tamperedToken, env.AUTH_SECRET);
    expect(valid).toBe(false);
  });
});

describe('timingSafeStringEqual (indirect test)', () => {
  it('should match correct password (via POST /api/auth)', async () => {
    const res = await app.request('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: '123456' }),
    }, mockEnv({ password: '123456', secret: TEST_SECRET }));
    expect(res.status).toBe(200);
  });

  it('should NOT match wrong case', async () => {
    const res = await app.request('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: '123456  ' }), // trailing spaces
    }, mockEnv({ password: '123456', secret: TEST_SECRET }));
    expect(res.status).toBe(401);
  });
});

describe('protected routes (auth middleware)', () => {
  it('should reject requests without auth header', async () => {
    const res = await app.request('/api/emails', {}, mockEnv());
    expect(res.status).toBe(401);
    const body: { error?: string } = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should reject requests with invalid bearer token', async () => {
    const res = await app.request('/api/emails', {
      headers: { Authorization: 'Bearer invalid-token' },
    }, mockEnv());
    expect(res.status).toBe(401);
    const body: { error?: string } = await res.json();
    expect(body.error).toBe('Invalid or expired token');
  });

  it('should allow requests with valid token', async () => {
    // First get a valid token
    const authRes = await app.request('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: TEST_PASSWORD }),
    }, mockEnv());
    const { token } = await authRes.json() as { token: string };

    // Use it to access protected route (will return empty list since DB is mock)
    const res = await app.request('/api/emails', {
      headers: { Authorization: `Bearer ${token}` },
    }, mockEnv());
    expect(res.status).toBe(200);
  });
});
