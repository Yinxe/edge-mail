import type { Env } from '../types';

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Constant-time byte-level comparison (no Web Crypto dependency) */
function timingSafeEqual(a: ArrayBufferLike, b: ArrayBufferLike): boolean {
  if (a.byteLength !== b.byteLength) return false;
  const ua = new Uint8Array(a);
  const ub = new Uint8Array(b);
  let result = 0;
  for (let i = 0; i < ua.length; i++) {
    result |= ua[i] ^ ub[i];
  }
  return result === 0;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function signPayload(secret: string, data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  );
  return crypto.subtle.sign('HMAC', key, encoder.encode(data));
}

async function generateToken(secret: string): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h
  const sig = await signPayload(secret, expiresAt.toString());
  return { token: `${expiresAt}.${hex(sig)}`, expiresAt };
}

export async function verifyToken(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [expiresStr, sigHex] = parts;
  const expiresAt = parseInt(expiresStr);
  if (isNaN(expiresAt) || Date.now() > expiresAt) return false;

  const expectedSig = await signPayload(secret, expiresStr);

  // Timing-safe comparison via Web Crypto API
  const expectedBytes = new Uint8Array(expectedSig);
  const actualBytes = hexToBytes(sigHex);
  if (!actualBytes) return false;
  if (expectedBytes.byteLength !== actualBytes.byteLength) return false;

  return timingSafeEqual(expectedBytes.buffer, actualBytes.buffer);
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  return timingSafeEqual(bufA.buffer, bufB.buffer);
}

export async function handleAuth(request: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch (err) {
    console.error('[AUTH] JSON parse error:', err);
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  console.log('[AUTH] body.password type:', typeof body.password, 'value:', body.password);
  console.log('[AUTH] env.AUTH_PASSWORD type:', typeof env.AUTH_PASSWORD, 'value:', env.AUTH_PASSWORD);

  if (typeof body.password !== 'string') {
    console.log('[AUTH] password is not a string, rejecting');
    return Response.json({ error: 'Invalid password' }, { status: 401 });
  }

  if (!timingSafeStringEqual(body.password, env.AUTH_PASSWORD)) {
    console.log('[AUTH] timingSafeStringEqual returned false - password mismatch');
    return Response.json({ error: 'Invalid password' }, { status: 401 });
  }

  console.log('[AUTH] login success, generating token');
  const { token, expiresAt } = await generateToken(env.AUTH_SECRET);

  return Response.json({ token, expiresAt });
}
