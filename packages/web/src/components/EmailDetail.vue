<script setup lang="ts">
import { computed, ref } from 'vue'
import DOMPurify from 'dompurify'
import { NTag, NText, NEmpty, NSpin, NButton, NButtonGroup } from 'naive-ui'
import type { EmailDetail } from '../store'
import { htmlToText } from '../utils/htmlToText'
import { useCopy } from '../composables/useCopy'

const props = defineProps<{
  email: EmailDetail | null
  loading?: boolean
  fullscreen?: boolean
}>()

const emit = defineEmits<{
  delete: [id: number]
  toggleFullscreen: []
}>()

const { copy } = useCopy()

// ── View mode: "html" or "text" ──
const viewMode = ref<'html' | 'text'>('html')

// ── Derived ──

const safeHtmlBody = computed(() =>
  props.email?.html_body ? DOMPurify.sanitize(props.email.html_body) : '',
)

const effectiveTextBody = computed(() =>
  props.email?.text_body ?? (props.email?.html_body ? htmlToText(props.email.html_body) : ''),
)

const hasHtml = computed(() => !!props.email?.html_body)
const hasTextFallback = computed(() => !!effectiveTextBody.value)

function formatFullDate(dateStr: string): string {
  return new Date(dateStr + 'Z').toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <section class="detail" :class="{ 'detail--fullscreen': fullscreen }">
    <!-- Loading state -->
    <div v-if="loading" class="detail__empty">
      <NSpin size="small" />
    </div>

    <!-- Email content -->
    <template v-else-if="email">
      <!-- ── Header card ── -->
      <div class="detail__header">
        <!-- Subject with status indicator -->
        <div class="detail__subject-row">
          <div
            class="detail__status-dot"
            :class="{ 'detail__status-dot--unread': !email.is_read }"
          />
          <h2 class="detail__subject">{{ email.subject }}</h2>
        </div>

        <!-- Meta info grid: sender / recipient cards -->
        <div class="detail__meta-grid">
          <button
            class="detail__meta-card"
            @click="copy(email.sender, '发件人地址')"
            title="点击复制发件人地址"
          >
            <span class="detail__meta-card-label">发件人</span>
            <div class="detail__meta-card-value-row">
              <span class="detail__meta-card-value">{{ email.sender }}</span>
              <svg
                class="detail__copy-icon"
                width="14" height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </div>
          </button>

          <button
            class="detail__meta-card"
            @click="copy(email.recipient, '收件人地址')"
            title="点击复制收件人地址"
          >
            <span class="detail__meta-card-label">收件人</span>
            <div class="detail__meta-card-value-row">
              <span class="detail__meta-card-value">{{ email.recipient }}</span>
              <svg
                class="detail__copy-icon"
                width="14" height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </div>
          </button>
        </div>

        <!-- Time row -->
        <div class="detail__time-row">
          <svg
            class="detail__time-icon"
            width="14" height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{{ formatFullDate(email.created_at) }}</span>
        </div>

        <!-- Bottom divider + tags + actions -->
        <div class="detail__footer">
          <div class="detail__tags">
            <NTag
              :type="email.is_read ? 'success' : 'info'"
              size="small"
              :bordered="false"
            >
              {{ email.is_read ? '已读' : '未读' }}
            </NTag>
            <NTag
              v-if="!email.is_read"
              type="warning"
              size="small"
              :bordered="false"
            >
              新邮件
            </NTag>
          </div>

          <NButton
            type="error"
            size="small"
            tertiary
            @click="emit('delete', email.id)"
          >
            <template #icon>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </template>
            删除
          </NButton>
        </div>
      </div>

      <!-- ── Toolbar ── -->
      <div class="detail__toolbar">
        <NButtonGroup size="tiny" class="detail__view-toggle">
          <NButton
            :type="viewMode === 'html' ? 'primary' : 'default'"
            :disabled="!hasHtml"
            @click="viewMode = 'html'"
          >
            HTML
          </NButton>
          <NButton
            :type="viewMode === 'text' ? 'primary' : 'default'"
            :disabled="!hasTextFallback"
            @click="viewMode = 'text'"
          >
            纯文本
          </NButton>
        </NButtonGroup>

        <NButton
          size="tiny"
          tertiary
          :type="fullscreen ? 'primary' : 'default'"
          class="detail__fullscreen-btn"
          @click="emit('toggleFullscreen')"
        >
          <template #icon>
            <svg
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            >
              <template v-if="fullscreen">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </template>
              <template v-else>
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </template>
            </svg>
          </template>
          {{ fullscreen ? '退出全屏' : '全屏' }}
        </NButton>
      </div>

      <!-- ── Body content ── -->
      <div class="detail__body">
        <!-- HTML mode -->
        <div v-if="viewMode === 'html' && hasHtml" v-html="safeHtmlBody" class="detail__html-body" />
        <!-- Text mode -->
        <pre v-else-if="viewMode === 'text' && effectiveTextBody" class="detail__text-body">{{ effectiveTextBody }}</pre>
        <!-- HTML mode, no HTML body → fallback to text -->
        <pre v-else-if="viewMode === 'html' && !hasHtml && effectiveTextBody" class="detail__text-body">{{ effectiveTextBody }}</pre>
        <!-- No content -->
        <NText v-else depth="3" class="detail__no-body">（无正文内容）</NText>
      </div>
    </template>

    <!-- Empty / welcome state -->
    <template v-else>
      <div class="detail__empty">
        <NEmpty description="选择一封邮件查看">
          <template #extra>
            <div class="detail__empty-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <rect x="8" y="16" width="48" height="36" rx="6" fill="#F0788A" opacity="0.15" stroke="#E85D75" stroke-width="1.5" />
                <path d="M8 22l24 14 24-14" stroke="#E85D75" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </template>
        </NEmpty>
      </div>
    </template>
  </section>
</template>

<style scoped>
.detail {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  padding: 24px 32px;
  background: #F8F6F7;
  transition: padding var(--anim-duration-normal) var(--anim-easing-smooth);
}

.detail--fullscreen {
  padding: 24px 48px;
}

/* ── Header Card ── */
.detail__header {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  width: fit-content;
  min-width: 100%;
}

/* ── Subject ── */
.detail__subject-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.detail__status-dot {
  flex-shrink: 0;
  width: 4px;
  height: 28px;
  margin-top: 3px;
  border-radius: 2px;
  background: #D0C8CC;
  transition: background var(--anim-micro-duration) var(--anim-micro-easing);
}

.detail__status-dot--unread {
  background: var(--naive-primary-color, #E85D75);
}

.detail__subject {
  font-size: 20px;
  font-weight: 700;
  color: var(--naive-text-color-1, #2D2327);
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: break-word;
}

/* ── Meta grid ── */
.detail__meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}

.detail__meta-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #F8F6F7;
  border: 1px solid #EAE5E8;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: all var(--anim-micro-duration) var(--anim-micro-easing);
  text-align: left;
  font-family: inherit;
  font-size: inherit;
  width: 100%;
  min-width: 0;
}

.detail__meta-card:hover {
  background: #FFF5F6;
  border-color: #E85D75;
  box-shadow: 0 2px 8px rgba(232, 93, 117, 0.1);
}

.detail__meta-card:active {
  background: #FDE8EB;
  transform: scale(0.98);
}

.detail__meta-card-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9E9196;
}

.detail__meta-card-value-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.detail__meta-card-value {
  font-size: 14px;
  color: #2D2327;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail__copy-icon {
  flex-shrink: 0;
  color: #D0C8CC;
  transition: color var(--anim-micro-duration) var(--anim-micro-easing);
}

.detail__meta-card:hover .detail__copy-icon {
  color: #E85D75;
}

/* ── Time row ── */
.detail__time-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6B5E63;
  margin-bottom: 16px;
}

.detail__time-icon {
  flex-shrink: 0;
  color: #D0C8CC;
}

/* ── Footer (tags + actions) ── */
.detail__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  border-top: 1px solid #EAE5E8;
}

.detail__tags {
  display: flex;
  gap: 8px;
}

/* ── Toolbar ── */
.detail__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 8px 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  width: fit-content;
  min-width: 100%;
}

.detail__view-toggle {
  flex-shrink: 0;
}

.detail__fullscreen-btn {
  flex-shrink: 0;
}

/* ── Body ── */
.detail__body {
  width: fit-content;
  min-width: 100%;
}

.detail__html-body {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.detail__text-body {
  white-space: pre-wrap;
  margin: 0;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  font-family: 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #2D2327;
}

.detail__no-body {
  display: block;
  text-align: center;
  padding: 32px 0;
}

.detail__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
}

.detail__empty-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .detail {
    padding: 16px;
  }

  .detail--fullscreen {
    padding: 16px;
  }

  .detail__header {
    padding: 16px;
  }

  .detail__subject-row {
    gap: 10px;
    margin-bottom: 16px;
  }

  .detail__subject {
    font-size: 17px;
  }

  .detail__meta-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .detail__meta-card {
    padding: 8px 12px;
  }

  .detail__toolbar {
    padding: 6px 10px;
  }

  .detail__html-body {
    padding: 16px;
  }

  .detail__text-body {
    padding: 16px;
  }
}
</style>
