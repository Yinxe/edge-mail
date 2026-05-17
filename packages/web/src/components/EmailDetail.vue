<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import { NTag, NText, NEmpty, NSpin, NButton } from 'naive-ui'
import type { EmailDetail } from '../store'

const props = defineProps<{
  email: EmailDetail | null
  loading?: boolean
}>()

const safeHtmlBody = computed(() =>
  props.email?.html_body ? DOMPurify.sanitize(props.email.html_body) : '',
)

const emit = defineEmits<{
  delete: [id: number]
}>()

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
  <section class="detail">
    <!-- Loading state -->
    <div v-if="loading" class="detail__empty">
      <NSpin size="small" />
    </div>

    <!-- Email content -->
    <template v-else-if="email">
      <div class="detail__header">
        <h2 class="detail__subject">{{ email.subject }}</h2>

        <div class="detail__meta">
          <div class="detail__meta-row">
            <NText depth="3" class="detail__label">发件人</NText>
            <NText class="detail__value">{{ email.sender }}</NText>
          </div>
          <div class="detail__meta-row">
            <NText depth="3" class="detail__label">收件人</NText>
            <NText class="detail__value">{{ email.recipient }}</NText>
          </div>
          <div class="detail__meta-row">
            <NText depth="3" class="detail__label">时间</NText>
            <NText class="detail__value">{{ formatFullDate(email.created_at) }}</NText>
          </div>
        </div>

        <div class="detail__tags">
          <NTag
            :type="email.is_read ? 'default' : 'info'"
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

        <div class="detail__actions">
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

      <div class="detail__body">
        <!-- HTML body (sanitized) -->
        <div v-if="email.html_body" v-html="safeHtmlBody" class="detail__html-body" />
        <!-- Plain text body -->
        <pre v-else-if="email.text_body" class="detail__text-body">{{ email.text_body }}</pre>
        <!-- Empty body -->
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
}

.detail__header {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  width: fit-content;
  min-width: 100%;
}

.detail__subject {
  font-size: 18px;
  font-weight: 700;
  color: #2D2327;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.detail__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail__meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.detail__label {
  flex-shrink: 0;
  min-width: 48px;
}

.detail__value {
  color: #2D2327;
}

.detail__tags {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.detail__body {
  width: fit-content;
  min-width: 100%;
}

.detail__text-body {
  white-space: pre-wrap;
  margin: 0;
}

.detail__no-body {
  display: block;
  text-align: center;
  padding: 32px 0;
}

.detail__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #EAE5E8;
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

</style>
