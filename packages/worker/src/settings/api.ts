import type { Context } from 'hono';
import type { Env } from '../types';
import { SETTINGS } from './registry';
import { getSettings, setSettings, getAllSettings } from './db';

type C = Context<{ Bindings: Env }>;

/** GET /api/settings — 读取所有设置组 */
export async function handleGetAllSettings(c: C): Promise<Response> {
  const result = await getAllSettings(c.env.DB);
  return c.json(result);
}

/** GET /api/settings/:group — 读取某组设置 */
export async function handleGetSettings(c: C): Promise<Response> {
  const group = c.req.param('group') ?? '';
  if (!(group in SETTINGS)) {
    return c.json({ error: `Unknown settings group: ${group}` }, 404);
  }

  const result = await getSettings(c.env.DB, group as keyof typeof SETTINGS);
  return c.json(result);
}

/** PUT /api/settings/:group — 更新某组设置的指定字段（部分更新） */
export async function handleUpdateSettings(c: C): Promise<Response> {
  const group = c.req.param('group') ?? '';
  if (!(group in SETTINGS)) {
    return c.json({ error: `Unknown settings group: ${group}` }, 404);
  }

  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  await setSettings(c.env.DB, group as keyof typeof SETTINGS, body);
  return c.json({ ok: true });
}
