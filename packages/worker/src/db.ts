import type { D1Database } from '@cloudflare/workers-types';
import type { EmailMeta, EmailDetail, ListResult } from './types';

export interface InsertEmailParams {
  message_id: string;
  sender: string;
  recipient: string;
  subject: string;
  raw_size: number;
  text_body: string | null;
  html_body: string | null;
  headers: string;
}

/** List emails with pagination — only metadata, no body */
export async function listEmails(
  db: D1Database,
  page: number,
  limit: number,
): Promise<ListResult<EmailMeta>> {
  const offset = (page - 1) * limit;

  const countResult = await db.prepare(
    'SELECT COUNT(*) as total FROM emails'
  ).first<{ total: number }>();
  const total = countResult?.total ?? 0;

  const { results } = await db.prepare(
    'SELECT id, message_id, sender, recipient, subject, raw_size, is_read, created_at FROM emails ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all<EmailMeta>();

  return { items: results, total, page, limit };
}

/** Get single email with body */
export async function getEmailById(
  db: D1Database,
  id: number,
): Promise<EmailDetail | null> {
  const result = await db.prepare(`
    SELECT e.*, b.text_body, b.html_body, b.headers
    FROM emails e
    LEFT JOIN email_bodies b ON b.email_id = e.id
    WHERE e.id = ?
  `).bind(id).first<EmailDetail>();

  if (result) {
    // Mark as read
    await db.prepare('UPDATE emails SET is_read = 1 WHERE id = ?').bind(id).run();
  }

  return result ?? null;
}

/** Insert a new email (with body) — returns null if duplicate message_id */
export async function insertEmail(
  db: D1Database,
  params: InsertEmailParams,
): Promise<number | null> {
  const existing = await db.prepare(
    'SELECT id FROM emails WHERE message_id = ?'
  ).bind(params.message_id).first<{ id: number }>();
  if (existing) return null;

  const batch = [
    db.prepare(
      'INSERT INTO emails (message_id, sender, recipient, subject, raw_size) VALUES (?, ?, ?, ?, ?)'
    ).bind(params.message_id, params.sender, params.recipient, params.subject, params.raw_size),
    db.prepare(
      'INSERT INTO email_bodies (email_id, text_body, html_body, headers) VALUES (last_insert_rowid(), ?, ?, ?)'
    ).bind(params.text_body, params.html_body, params.headers),
  ];

  const results = await db.batch(batch);
  const emailResult = results[0];

  return emailResult.meta.last_row_id ?? null;
}

/** Toggle read status */
export async function setEmailRead(
  db: D1Database,
  id: number,
  isRead: boolean,
): Promise<boolean> {
  const result = await db.prepare(
    'UPDATE emails SET is_read = ? WHERE id = ?'
  ).bind(isRead ? 1 : 0, id).run();
  return result.success;
}
