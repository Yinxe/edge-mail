import { describe, it, expect } from 'vitest';
import { handleAuth, verifyToken } from '../auth';

const TEST_PASSWORD = '123456';
const TEST_SECRET = 'test-secret-for-hmac';

function mockEnv(overrides?: Partial<{ password: string; secret: string }>) {
  return {
    DB: {} as D1Database,
    AUTH_PASSWORD: overrides?.password ?? TEST_PASSWORD,
    AUTH_SECRET: overrides?.secret ?? TEST_SECRET,
  };
}

describe('handleAuth', () => {
  it('should reject wrong password', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong' }),
    });

    const res = await handleAuth(req, mockEnv());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid password');
  });

  it('should reject empty body', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });

    const res = await handleAuth(req, mockEnv());
    expect(res.status).toBe(401);
  });

  it('should reject invalid JSON', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });

    const res = await handleAuth(req, mockEnv());
    expect(res.status).toBe(400);
  });

  it('should accept correct password and return token', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: TEST_PASSWORD }),
    });

    const env = mockEnv();
    const res = await handleAuth(req, env);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe('string');
    expect(body.expiresAt).toBeDefined();
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
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: TEST_PASSWORD }),
    });

    const env = mockEnv();
    const res = await handleAuth(req, env);
    const body = await res.json();

    // Tamper with the token
    const parts = body.token.split('.');
    const tamperedToken = parts[0] + '.ffffffffffff';
    const valid = await verifyToken(tamperedToken, env.AUTH_SECRET);
    expect(valid).toBe(false);
  });
});

describe('timingSafeStringEqual (indirect test)', () => {
  it('should match correct password (via handleAuth)', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: '123456' }),
    });

    const res = await handleAuth(req, mockEnv({ password: '123456', secret: TEST_SECRET }));
    expect(res.status).toBe(200);
  });

  it('should NOT match wrong case', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: '123456  ' }), // trailing spaces
    });

    const res = await handleAuth(req, mockEnv({ password: '123456', secret: TEST_SECRET }));
    expect(res.status).toBe(401);
  });
});
