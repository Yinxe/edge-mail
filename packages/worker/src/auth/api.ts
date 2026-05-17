import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { Env } from '../shared/types';
import { generateToken, verifyToken, timingSafeStringEqual } from './service';

type C = Context<{ Bindings: Env }>;
type App = { Bindings: Env };

/** Auth middleware — validates Bearer token on protected routes */
export const authMiddleware = createMiddleware<App>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const valid = await verifyToken(authHeader.slice(7), c.env.AUTH_SECRET);
  if (!valid) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  await next();
});

/** POST /api/auth — password login → token */
export async function handleAuth(c: C): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json() as Record<string, unknown>;
  } catch {
    return c.json({ error: 'Invalid request' }, 400);
  }

  if (typeof body.password !== 'string') {
    return c.json({ error: 'Invalid password' }, 401);
  }

  if (!timingSafeStringEqual(body.password, c.env.AUTH_PASSWORD)) {
    return c.json({ error: 'Invalid password' }, 401);
  }

  const { token, expiresAt } = await generateToken(c.env.AUTH_SECRET);

  return c.json({ token, expiresAt });
}
