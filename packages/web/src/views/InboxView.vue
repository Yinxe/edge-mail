<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, useMessage } from 'naive-ui'
import { fetchEmails, fetchEmailDetail } from '../api'
import { token, emails, currentEmail } from '../store'
import EmailSidebar from '../components/EmailSidebar.vue'
import EmailDetail from '../components/EmailDetail.vue'
import type { EmailDetail as EmailDetailType } from '../store'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const page = ref(1)
const total = ref(0)
const limit = 20

async function loadEmails() {
  try {
    const result = await fetchEmails(page.value)
    emails.value = result.items
    total.value = result.total
  } catch {
    message.error('加载邮件失败')
  }
}

async function selectEmail(id: number) {
  router.push(`/inbox/${id}`)
}

async function loadDetail(id: number) {
  try {
    const email = await fetchEmailDetail(id)
    currentEmail.value = email
    // Update is_read in sidebar list
    const idx = emails.value.findIndex((e) => e.id === id)
    if (idx !== -1) {
      emails.value[idx] = { ...emails.value[idx], is_read: 1 }
    }
  } catch {
    message.error('加载邮件详情失败')
  }
}

function onPageChange(newPage: number) {
  page.value = newPage
}

function logout() {
  token.value = ''
  currentEmail.value = null
  emails.value = []
  router.push('/login')
}

onMounted(() => {
  loadEmails()
})

watch(page, () => {
  loadEmails()
})

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
</script>

<template>
  <div class="h-screen flex flex-col">
    <header class="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      <h1 class="text-lg font-bold">Edge Mail</h1>
      <NButton size="small" text @click="logout">退出</NButton>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <div class="w-80 flex-shrink-0">
        <EmailSidebar
          :emails="emails"
          :current-id="currentEmail?.id ?? null"
          :page="page"
          :total="total"
          :limit="limit"
          @select="selectEmail"
          @update:page="onPageChange"
        />
      </div>

      <EmailDetail :email="currentEmail" />
    </div>
  </div>
</template>
