/* ── Email Domain Types ── */

export interface EmailMeta {
  id: number;
  message_id: string;
  sender: string;
  recipient: string;
  subject: string;
  raw_size: number | null;
  is_read: number;
  created_at: string;
}

export interface EmailBody {
  text_body: string | null;
  html_body: string | null;
  headers: string | null;
}

export interface EmailDetail extends EmailMeta {
  text_body: string | null;
  html_body: string | null;
  headers: string | null;
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/* ── Worker Environment ── */

export interface Env {
  DB: D1Database;
  AUTH_PASSWORD: string;
  AUTH_SECRET: string;
  ALLOWED_ORIGINS?: string;
}
