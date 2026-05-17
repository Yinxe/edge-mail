import { shallowRef, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { fetchEmails, fetchEmailDetail, toggleEmailRead } from '../api'
import type { EmailMeta, EmailDetail } from '../store'

export function useEmails() {
  const route = useRoute()
  const router = useRouter()
  const message = useMessage()

  const emails = shallowRef<EmailMeta[]>([])
  const currentEmail = shallowRef<EmailDetail | null>(null)
  const page = shallowRef(1)
  const total = shallowRef(0)
  const loading = shallowRef(false)
  const detailLoading = shallowRef(false)
  const limit = 20

  async function loadEmails() {
    loading.value = true
    try {
      const result = await fetchEmails(page.value)
      emails.value = result.items
      total.value = result.total
    } catch {
      message.error('加载邮件失败')
    } finally {
      loading.value = false
    }
  }

  async function loadDetail(id: number) {
    detailLoading.value = true
    try {
      const email = await fetchEmailDetail(id)
      currentEmail.value = email
      // Mark as read in the sidebar list optimistically
      const idx = emails.value.findIndex((e) => e.id === id)
      if (idx !== -1 && !emails.value[idx].is_read) {
        const updated = [...emails.value]
        updated[idx] = { ...updated[idx], is_read: 1 }
        emails.value = updated
      }
    } catch {
      message.error('加载邮件详情失败')
    } finally {
      detailLoading.value = false
    }
  }

  function selectEmail(id: number) {
    router.push(`/inbox/${id}`)
  }

  function handlePageChange(newPage: number) {
    page.value = newPage
  }

  // Load emails on mount and on page change
  onMounted(loadEmails)
  watch(page, loadEmails)

  // Load detail when route param changes
  watch(
    () => route.params.id,
    (id) => {
      if (id && typeof id === 'string') {
        loadDetail(parseInt(id))
      } else {
        currentEmail.value = null
      }
    },
    { immediate: true },
  )

  return {
    emails,
    currentEmail,
    page,
    total,
    limit,
    loading,
    detailLoading,
    selectEmail,
    handlePageChange,
  }
}
