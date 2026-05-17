<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage, NModal, NCheckbox } from 'naive-ui'
import { useEmails } from '../composables/useEmails'
import { fetchEmailDetail } from '../api'
import type { EmailDetail as EmailDetailType } from '../store'
import EmailSidebar from '../components/EmailSidebar.vue'
import EmailDetail from '../components/EmailDetail.vue'
import EmailDrawer from '../components/EmailDrawer.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const {
  emails,
  currentEmail,
  page,
  total,
  limit,
  loading: detailLoading,
  searchQuery,
  selectEmail,
  handlePageChange,
  handleSearch,
  handleDelete,
} = useEmails()

const pendingDeleteId = ref<number | null>(null)
const showDeleteModal = ref(false)
const dontAskAgain = ref(false)

/* ── Drawer state (mobile) ── */
const drawerVisible = ref(false)
const drawerEmail = shallowRef<EmailDetailType | null>(null)
const drawerLoading = ref(false)

const isMobile = () => window.innerWidth < 1024

async function openDrawer(id: number) {
  drawerVisible.value = true
  drawerLoading.value = true
  try {
    const detail = await fetchEmailDetail(id)
    drawerEmail.value = detail

    // Optimistic read marking
    const idx = emails.value.findIndex((e) => e.id === id)
    if (idx !== -1 && !emails.value[idx].is_read) {
      const updated = [...emails.value]
      updated[idx] = { ...updated[idx], is_read: 1 }
      emails.value = updated
    }
  } catch {
    message.error('加载邮件详情失败')
  } finally {
    drawerLoading.value = false
  }
}

function closeDrawer() {
  drawerVisible.value = false
  drawerEmail.value = null
  // If on /inbox/:id via direct link, go back to list
  if (isMobile() && route.params.id) {
    router.push('/inbox')
  }
}

/* ── Email selection: mobile → bottom drawer, desktop → inline content ── */
function handleEmailSelect(id: number) {
  if (isMobile()) {
    openDrawer(id)
  } else {
    selectEmail(id)
  }
}

/* ── Handle direct nav to /inbox/:id on mobile ── */
watch(
  () => route.params.id,
  (id) => {
    if (id && typeof id === 'string' && isMobile()) {
      openDrawer(parseInt(id))
    }
  },
  { immediate: true },
)

async function deleteFromDrawer(id: number) {
  closeDrawer()
  await handleDelete(id)
}

/* ── Delete confirmation ── */
function requestDelete(id: number) {
  if (localStorage.getItem('deleteConfirmDisabled')) {
    handleDelete(id)
    return
  }
  pendingDeleteId.value = id
  dontAskAgain.value = false
  showDeleteModal.value = true
}

function confirmDelete() {
  if (dontAskAgain.value) {
    localStorage.setItem('deleteConfirmDisabled', '1')
  }
  if (pendingDeleteId.value !== null) {
    handleDelete(pendingDeleteId.value)
  }
  showDeleteModal.value = false
  pendingDeleteId.value = null
}
</script>

<template>
  <div class="inbox-layout">
    <!-- Email list (left on desktop, full on mobile) -->
    <div class="inbox__list">
      <EmailSidebar
        :emails="emails"
        :current-id="currentEmail?.id ?? null"
        :page="page"
        :total="total"
        :limit="limit"
        :search-query="searchQuery"
        @select="handleEmailSelect"
        @delete="requestDelete"
        @update:page="handlePageChange"
        @update:search-query="handleSearch"
      />
    </div>

    <!-- Content area (right on desktop, hidden on mobile) -->
    <div class="inbox__content">
      <EmailDetail
        :email="currentEmail"
        :loading="detailLoading"
        @delete="requestDelete"
      />
    </div>

    <!-- Mobile bottom sheet drawer -->
    <EmailDrawer
      :email="drawerEmail"
      :loading="drawerLoading"
      :visible="drawerVisible"
      @close="closeDrawer"
      @delete="deleteFromDrawer"
    />

    <!-- Delete confirmation modal -->
    <NModal v-model:show="showDeleteModal" preset="dialog" title="确认删除" positive-text="删除" negative-text="取消" @positive-click="confirmDelete" @negative-click="showDeleteModal = false">
      <p class="inbox__delete-msg">确定要删除这封邮件吗？此操作不可撤销。</p>
      <NCheckbox v-model:checked="dontAskAgain">不再提示</NCheckbox>
    </NModal>
  </div>
</template>

<style scoped>
.inbox-layout {
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  background: #F8F6F7;
}

/* ── List area (left on desktop) ── */
.inbox__list {
  width: 380px;
  flex-shrink: 0;
  border-right: 1px solid #EAE5E8;
  overflow: hidden;
}

/* ── Content area (right on desktop) ── */
.inbox__content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* ── Mobile (< 1024px): list full width, content hidden, drawer handles detail ── */
@media (max-width: 1023px) {
  .inbox__list {
    width: 100%;
    border-right: none;
  }

  .inbox__content {
    display: none !important;
  }
}

/* ── Modal text ── */
.inbox__delete-msg {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #6B5E63;
  line-height: 1.6;
}
</style>
