import type { Env } from '../types';
import { listEmails, getEmailById, setEmailRead } from '../db';

export async function handleListEmails(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));

  const result = await listEmails(env.DB, page, limit);
  return Response.json(result);
}

export async function handleGetEmail(id: number, env: Env): Promise<Response> {
  const email = await getEmailById(env.DB, id);
  if (!email) {
    return Response.json({ error: 'Email not found' }, { status: 404 });
  }
  return Response.json(email);
}

export async function handleToggleRead(id: number, request: Request, env: Env): Promise<Response> {
  const body = await request.json().catch(() => ({})) as { is_read?: boolean };
  const isRead = body.is_read ?? true;

  const ok = await setEmailRead(env.DB, id, isRead);
  if (!ok) {
    return Response.json({ error: 'Email not found' }, { status: 404 });
  }
  return Response.json({ ok: true });
}
