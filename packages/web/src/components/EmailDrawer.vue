<script setup lang="ts">
import { computed, watch } from 'vue'
import DOMPurify from 'dompurify'
import { NSpin } from 'naive-ui'
import type { EmailDetail } from '../store'

const props = defineProps<{
  email: EmailDetail | null
  loading: boolean
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  delete: [id: number]
}>()

const safeHtmlBody = computed(() =>
  props.email?.html_body ? DOMPurify.sanitize(props.email.html_body) : '',
)

function formatFullDate(dateStr: string): string {
  return new Date(dateStr + 'Z').toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Prevent body scroll when drawer is open
watch(
  () => props.visible,
  (v) => {
    document.body.style.overflow = v ? 'hidden' : ''
  },
)
</script>

<template>
  <Transition name="sheet">
    <div v-if="visible" class="sheet-overlay" @click.self="emit('close')">
      <div class="sheet">
        <!-- Drag handle -->
        <div class="sheet__handle-bar">
          <div class="sheet__handle" />
        </div>

        <!-- Header: close + subject -->
        <div class="sheet__header">
          <button class="sheet__close" @click="emit('close')">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <span class="sheet__subject">{{ loading ? '加载中…' : email?.subject || '' }}</span>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="sheet__loading">
          <NSpin size="small" />
        </div>

        <!-- Content -->
        <template v-else-if="email">
          <div class="sheet__meta">
            <div class="sheet__meta-row">
              <span class="sheet__meta-label">发件人</span>
              <span class="sheet__meta-value">{{ email.sender }}</span>
            </div>
            <div class="sheet__meta-row">
              <span class="sheet__meta-label">收件人</span>
              <span class="sheet__meta-value">{{ email.recipient }}</span>
            </div>
            <div class="sheet__meta-row">
              <span class="sheet__meta-label">时间</span>
              <span class="sheet__meta-value">{{ formatFullDate(email.created_at) }}</span>
            </div>
          </div>

          <div class="sheet__body">
            <div v-if="email.html_body" v-html="safeHtmlBody" class="sheet__html" />
            <pre v-else-if="email.text_body" class="sheet__text">{{ email.text_body }}</pre>
            <p v-else class="sheet__empty">（无正文内容）</p>
          </div>
        </template>

        <div v-else class="sheet__loading">
          <p class="sheet__empty">无法加载邮件</p>
        </div>

        <!-- Bottom action bar -->
        <div class="sheet__actions">
          <button class="sheet__btn sheet__btn--primary" @click="emit('close')">
            关闭
          </button>
          <button
            v-if="email"
            class="sheet__btn sheet__btn--danger"
            @click="emit('delete', email.id)"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Overlay ── */
.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-end;
}

/* ── Sheet (90% height, rounded top corners) ── */
.sheet {
  width: 100%;
  max-height: 92vh;
  background: #F8F6F7;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  /* slide up/down handled by Transition */
}

/* ── Slide up transition ── */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 200ms ease-out;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}

/* ── Drag handle ── */
.sheet__handle-bar {
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;
  flex-shrink: 0;
}

.sheet__handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #D0C8CC;
}

/* ── Header ── */
.sheet__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 10px;
  flex-shrink: 0;
}

.sheet__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #9E9196;
  cursor: pointer;
  border-radius: 8px;
  flex-shrink: 0;
  transition: background var(--anim-micro-duration) var(--anim-micro-easing);
}
.sheet__close:hover {
  background: #FFF5F6;
  color: #E85D75;
}

.sheet__subject {
  font-size: 15px;
  font-weight: 600;
  color: #2D2327;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

/* ── Loading ── */
.sheet__loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Meta ── */
.sheet__meta {
  background: #FFFFFF;
  margin: 0 12px 8px;
  border-radius: 12px;
  padding: 14px 16px;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.sheet__meta-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
  line-height: 1.8;
}

.sheet__meta-label {
  flex-shrink: 0;
  color: #9E9196;
  min-width: 48px;
}

.sheet__meta-value {
  color: #2D2327;
  word-break: break-all;
}

/* ── Body ── */
.sheet__body {
  flex: 1;
  overflow-y: auto;
  background: #FFFFFF;
  margin: 0 12px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.sheet__html {
  font-size: 14px;
  line-height: 1.7;
  color: #2D2327;
}

.sheet__html :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}

.sheet__html :deep(a) {
  color: #E85D75;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.sheet__html :deep(blockquote) {
  border-left: 3px solid #EAE5E8;
  margin: 12px 0;
  padding: 4px 12px;
  color: #6B5E63;
}

.sheet__html :deep(table) {
  border-collapse: collapse;
  width: 100%;
}

.sheet__html :deep(td),
.sheet__html :deep(th) {
  border: 1px solid #EAE5E8;
  padding: 6px 10px;
  text-align: left;
}

.sheet__text {
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Noto Sans SC',
    'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  color: #2D2327;
}

.sheet__empty {
  text-align: center;
  color: #9E9196;
  font-size: 14px;
  padding: 32px 0;
  margin: 0;
}

/* ── Bottom action bar ── */
.sheet__actions {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom, 16px));
  background: #FFFFFF;
  border-top: 1px solid #EAE5E8;
  flex-shrink: 0;
}

.sheet__btn {
  flex: 1;
  padding: 12px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--anim-micro-duration) var(--anim-micro-easing),
              color var(--anim-micro-duration) var(--anim-micro-easing);
}

.sheet__btn--primary {
  background: #F8F6F7;
  color: #6B5E63;
}
.sheet__btn--primary:hover {
  background: #EAE5E8;
}

.sheet__btn--danger {
  background: #E55959;
  color: white;
}
.sheet__btn--danger:hover {
  background: #C43D3D;
}
</style>
