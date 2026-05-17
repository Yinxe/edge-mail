import type { Context } from 'hono';
import type { Env } from '../types';
import { listEmails, getEmailById, setEmailRead, searchEmails, deleteEmail } from '../db';

type C = Context<{ Bindings: Env }>;

/** Parse and validate numeric ID from route param, returning 400 on invalid input */
function parseId(c: C, param: string = 'id'): number | null {
  const id = parseInt(c.req.param(param) ?? '');
  if (isNaN(id) || id < 1) return null;
  return id;
}

export async function handleListEmails(c: C): Promise<Response> {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
  const q = c.req.query('q') ?? '';

  const result = q
    ? await searchEmails(c.env.DB, q, page, limit)
    : await listEmails(c.env.DB, page, limit);
  return c.json(result);
}

export async function handleGetEmail(c: C): Promise<Response> {
  const id = parseInt(c.req.param('id') ?? '');
  const email = await getEmailById(c.env.DB, id);
  if (!email) {
    return c.json({ error: 'Email not found' }, 404);
  }
  return c.json(email);
}

export async function handleToggleRead(c: C): Promise<Response> {
  const id = parseInt(c.req.param('id') ?? '');
  const body = await c.req.json().catch(() => ({})) as { is_read?: boolean };
  const isRead = body.is_read ?? true;

  const ok = await setEmailRead(c.env.DB, id, isRead);
  if (!ok) {
    return c.json({ error: 'Email not found' }, 404);
  }
  return c.json({ ok: true });
}

export async function handleDeleteEmail(c: C): Promise<Response> {
  const id = parseId(c);
  if (id === null) {
    return c.json({ error: 'Invalid email ID' }, 400);
  }
  const ok = await deleteEmail(c.env.DB, id);
  if (!ok) {
    return c.json({ error: 'Email not found' }, 404);
  }
  return c.json({ ok: true });
}
