import { token } from './store'
import type { EmailMeta, EmailDetail, ListResult } from './store'

const BASE = import.meta.env.VITE_API_BASE || ''

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

export async function fetchEmails(page: number): Promise<ListResult<EmailMeta>> {
  const res = await fetch(`${BASE}/api/emails?page=${page}&limit=20`, {
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
  await fetch(`${BASE}/api/emails/${id}/read`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ is_read: isRead }),
  })
}
