import { shallowRef, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { fetchEmails, fetchEmailDetail, toggleEmailRead, deleteEmail } from '../api'
import { debounce } from '../utils/debounce'
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
  const searchQuery = ref('')
  const limit = ref(20)

  async function loadEmails() {
    loading.value = true
    try {
      const result = await fetchEmails(page.value, limit.value, searchQuery.value || undefined)
      emails.value = result.items
      total.value = result.total
    } catch {
      message.error(searchQuery.value ? '搜索失败' : '加载邮件失败')
    } finally {
      loading.value = false
    }
  }

  async function loadDetail(id: number) {
    detailLoading.value = true
    try {
      const email = await fetchEmailDetail(id)
      currentEmail.value = email
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
    loadEmails()
  }

  function handleSearch(query: string) {
    searchQuery.value = query
  }

  function clearSearch() {
    searchQuery.value = ''
    page.value = 1
    loadEmails()
  }

  async function refresh() {
    await loadEmails()
  }

  async function handleDelete(id: number) {
    try {
      await deleteEmail(id)
      message.success('邮件已删除')
      if (currentEmail.value?.id === id) {
        currentEmail.value = null
        router.replace('/inbox')
      }
      await loadEmails()
      if (emails.value.length === 0 && page.value > 1) {
        page.value--
      }
    } catch {
      message.error('删除失败')
    }
  }

  async function handleBatchDelete(ids: number[], onProgress?: (current: number, total: number) => void): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      try {
        await deleteEmail(ids[i])
      } catch {
        // continue with next
      }
      onProgress?.(i + 1, ids.length)
    }
    // If current detail email was deleted, navigate away
    if (currentEmail.value && ids.includes(currentEmail.value.id)) {
      currentEmail.value = null
      router.replace('/inbox')
    }
    await loadEmails()
    if (emails.value.length === 0 && page.value > 1) {
      page.value--
      // reload after page decrement
      await loadEmails()
    }
  }

  function handleLimitChange(newLimit: number) {
    limit.value = newLimit
    page.value = 1
    loadEmails()
  }

  onMounted(loadEmails)

  // Debounced search
  watch(searchQuery, debounce(() => {
    page.value = 1
    loadEmails()
  }, 300))

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
    searchQuery,
    selectEmail,
    handlePageChange,
    handleSearch,
    clearSearch,
    handleDelete,
    handleBatchDelete,
    handleLimitChange,
    refresh,
  }
}
