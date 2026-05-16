import { ref, watch } from 'vue'

export interface EmailMeta {
  id: number
  message_id: string
  sender: string
  recipient: string
  subject: string
  raw_size: number | null
  is_read: number
  created_at: string
}

export interface EmailDetail extends EmailMeta {
  text_body: string | null
  html_body: string | null
  headers: string | null
}

export interface ListResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export const token = ref<string>(localStorage.getItem('token') || '')

watch(token, (val) => {
  if (val) {
    localStorage.setItem('token', val)
  } else {
    localStorage.removeItem('token')
  }
})

export const emails = ref<EmailMeta[]>([])
export const currentEmail = ref<EmailDetail | null>(null)
