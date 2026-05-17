<script setup lang="ts">
import { useMessage } from 'naive-ui'
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
  selectEmail,
  handlePageChange,
} = useEmails()

function handleLogout() {
  logout()
  message.success('已退出登录')
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
          @update:page="handlePageChange"
        />
      </div>
      <EmailDetail :email="currentEmail" :loading="detailLoading" />
    </div>
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
</style>
