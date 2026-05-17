<script setup lang="ts">
import { ref } from 'vue'
import { useMessage, NModal, NCheckbox } from 'naive-ui'
import { useAuth } from '../composables/useAuth'
import { useEmails } from '../composables/useEmails'
import EmailSidebar from '../components/EmailSidebar.vue'
import EmailDetail from '../components/EmailDetail.vue'

const message = useMessage()
const { logout } = useAuth()
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

function handleLogout() {
  logout()
  message.success('已退出登录')
}

function onSearchInput(value: string) {
  handleSearch(value)
}

function onClearSearch() {
  handleSearch('')
}

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
  <div class="inbox">
    <!-- Header -->
    <header class="inbox__header">
      <div class="inbox__brand">
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill="#E85D75" />
          <path d="M10 14h20v14a2 2 0 01-2 2H12a2 2 0 01-2-2V14z" fill="white" opacity="0.9" />
          <path d="M10 14l10 8 10-8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
        </svg>
        <h1 class="inbox__title">EdgeMail</h1>
        <span class="inbox__subtitle">Powered by Cloudflare</span>
      </div>

      <!-- Search bar -->
      <div class="inbox__search">
        <svg class="inbox__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          class="inbox__search-input"
          type="text"
          placeholder="搜索发件人或主题…"
          :value="searchQuery"
          @input="onSearchInput(($event.target as HTMLInputElement).value)"
        />
        <button
          v-if="searchQuery"
          class="inbox__search-clear"
          @click="onClearSearch"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <button class="inbox__logout" @click="handleLogout">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>退出</span>
      </button>
    </header>

    <!-- Main content -->
    <div class="inbox__main">
      <div class="inbox__sidebar">
        <EmailSidebar
          :emails="emails"
          :current-id="currentEmail?.id ?? null"
          :page="page"
          :total="total"
          :limit="limit"
          @select="selectEmail"
          @delete="requestDelete"
          @update:page="handlePageChange"
        />
      </div>
      <EmailDetail
        :email="currentEmail"
        :loading="detailLoading"
        @delete="requestDelete"
      />
    </div>

    <!-- Delete confirmation modal -->
    <NModal v-model:show="showDeleteModal" preset="dialog" title="确认删除" positive-text="删除" negative-text="取消" @positive-click="confirmDelete" @negative-click="showDeleteModal = false">
      <p class="inbox__delete-msg">确定要删除这封邮件吗？此操作不可撤销。</p>
      <NCheckbox v-model:checked="dontAskAgain">不再提示</NCheckbox>
    </NModal>
  </div>
</template>

<style scoped>
.inbox {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #F8F6F7;
}

/* ── Header ── */
.inbox__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: #FFFFFF;
  border-bottom: 1px solid #EAE5E8;
  flex-shrink: 0;
}

.inbox__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.inbox__title {
  font-size: 18px;
  font-weight: 700;
  color: #2D2327;
  margin: 0;
}

.inbox__subtitle {
  font-size: 12px;
  color: #9E9196;
  font-weight: 400;
}

.inbox__logout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: #6B5E63;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  border-radius: 8px;
  transition: all 150ms ease-out;
}
.inbox__logout:hover {
  background: #FFF5F6;
  color: #E85D75;
}

/* ── Main area ── */
.inbox__main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.inbox__sidebar {
  width: 340px;
  flex-shrink: 0;
}

/* ── Search ── */
.inbox__search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 360px;
  margin: 0 16px;
  padding: 6px 12px;
  background: #F8F6F7;
  border: 1px solid #EAE5E8;
  border-radius: 10px;
  transition: border-color 200ms ease-out;
}
.inbox__search:focus-within {
  border-color: #E85D75;
  background: #FFFFFF;
}
.inbox__search-icon {
  flex-shrink: 0;
  color: #9E9196;
}
.inbox__search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Noto Sans SC',
    'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #2D2327;
  outline: none;
  min-width: 0;
}
.inbox__search-input::placeholder {
  color: #9E9196;
}
.inbox__search-clear {
  display: flex;
  align-items: center;
  padding: 2px;
  border: none;
  background: transparent;
  color: #9E9196;
  cursor: pointer;
  border-radius: 4px;
  transition: color 150ms ease-out;
}
.inbox__search-clear:hover {
  color: #E85D75;
}
.inbox__delete-msg {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #6B5E63;
  line-height: 1.6;
}
</style>
