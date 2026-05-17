<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NModal, NCheckbox } from 'naive-ui'
import { useEmails } from '../composables/useEmails'
import EmailSidebar from '../components/EmailSidebar.vue'
import EmailDetail from '../components/EmailDetail.vue'

const route = useRoute()
const router = useRouter()

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
  handleBatchDelete,
  handleLimitChange,
  refresh,
} = useEmails()

const pendingDeleteId = ref<number | null>(null)
const showDeleteModal = ref(false)
const dontAskAgain = ref(false)

/* ── Desktop/mobile detection (matches AppLayout breakpoint) ── */
const isDesktop = () => window.innerWidth >= 640

/* ── Email selection: always route-based ── */
function handleEmailSelect(id: number) {
  selectEmail(id)
}

/* ── Back to list (mobile) ── */
function goBackToList() {
  router.push('/inbox')
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
  <div class="inbox-layout" :class="{ 'inbox-layout--detail': !!route.params.id }">
    <!-- Email list -->
    <div class="inbox__list">
      <EmailSidebar
        :emails="emails"
        :current-id="currentEmail?.id ?? null"
        :page="page"
        :total="total"
        :limit="limit"
        :search-query="searchQuery"
        :on-refresh="refresh"
        :on-batch-delete="handleBatchDelete"
        @select="handleEmailSelect"
        @delete="requestDelete"
        @update:page="handlePageChange"
        @update:search-query="handleSearch"
        @update:limit="handleLimitChange"
      />
    </div>

    <!-- Content area -->
    <div class="inbox__content">
      <!-- Back button (mobile only, when detail is open) -->
      <div v-if="!!route.params.id" class="inbox__back">
        <button class="inbox__back-btn" @click="goBackToList">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>返回</span>
        </button>
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
.inbox-layout {
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  background: #F8F6F7;
  overflow-x: auto;
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
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}



/* ── Back button (mobile) ── */
.inbox__back {
  display: none;
}

/* ── Tablet (640-1023px): narrower list ── */
@media (max-width: 1023px) and (min-width: 640px) {
  .inbox__list {
    width: 320px;
  }
}

/* ── Mobile (< 640px): list/detail toggle via route ── */
@media (max-width: 639px) {
  .inbox__list {
    width: 100%;
    border-right: none;
    display: flex;
    flex-direction: column;
  }

  .inbox__content {
    display: none;
  }

  .inbox-layout--detail .inbox__list {
    display: none;
  }

  .inbox-layout--detail .inbox__content {
    display: flex;
    flex-direction: column;
  }

  .inbox__back {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    background: #FFFFFF;
    border-bottom: 1px solid #EAE5E8;
    flex-shrink: 0;
  }

  .inbox__back-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border: none;
    background: transparent;
    color: #E85D75;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    border-radius: 8px;
    transition: background 150ms ease-out;
  }
  .inbox__back-btn:hover {
    background: #FFF5F6;
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
