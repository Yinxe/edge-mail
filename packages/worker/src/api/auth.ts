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
  const body = await request.json().catch(() => ({})) as { password?: string };

  if (body.password !== env.AUTH_PASSWORD) {
    return Response.json({ error: 'Invalid password' }, { status: 401 });
  }

  const { token, expiresAt } = await generateToken(env.AUTH_SECRET);

  return Response.json({ token, expiresAt });
}
