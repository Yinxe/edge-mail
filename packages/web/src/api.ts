import { token } from './store'
import type { EmailMeta, EmailDetail, ListResult } from './store'

const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '')

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token.value}`,
  }
}

export async function login(password: string): Promise<{ token: string; expiresAt: number }> {
  const res = await fetch(`${BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) throw new Error('Auth failed')
  return res.json()
}

export async function fetchEmails(page: number, limit: number = 20, q?: string): Promise<ListResult<EmailMeta>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (q) params.set('q', q)
  const res = await fetch(`${BASE}/api/emails?${params}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch emails')
  return res.json()
}

export async function fetchEmailDetail(id: number): Promise<EmailDetail> {
  const res = await fetch(`${BASE}/api/emails/${id}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch email')
  return res.json()
}

export async function toggleEmailRead(id: number, isRead: boolean): Promise<void> {
  const res = await fetch(`${BASE}/api/emails/${id}/read`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ is_read: isRead }),
  })
  if (!res.ok) throw new Error('Failed to toggle read status')
}

export async function deleteEmail(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/emails/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete email')
}

/* ── Settings ── */

export async function fetchSettings(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/api/settings`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Failed to fetch settings')
  return res.json()
}

export async function updateSettings(group: string, data: unknown): Promise<void> {
  const res = await fetch(`${BASE}/api/settings/${group}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update settings')
}
