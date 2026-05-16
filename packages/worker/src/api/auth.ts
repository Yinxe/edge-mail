import type { Env } from '../types';

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
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

  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual(a: ArrayBufferLike, b: ArrayBufferLike): boolean;
  };
  return subtle.timingSafeEqual(expectedBytes.buffer, actualBytes.buffer);
}

async function timingSafeStringEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.byteLength !== bufB.byteLength) return false;
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual(a: ArrayBufferLike, b: ArrayBufferLike): boolean;
  };
  return subtle.timingSafeEqual(bufA.buffer, bufB.buffer);
}

export async function handleAuth(request: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (typeof body.password !== 'string') {
    return Response.json({ error: 'Invalid password' }, { status: 401 });
  }

  if (!(await timingSafeStringEqual(body.password, env.AUTH_PASSWORD))) {
    return Response.json({ error: 'Invalid password' }, { status: 401 });
  }

  const { token, expiresAt } = await generateToken(env.AUTH_SECRET);

  return Response.json({ token, expiresAt });
}
