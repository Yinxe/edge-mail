<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import { NTag, NText, NEmpty, NSpin } from 'naive-ui'
import type { EmailDetail } from '../store'

const props = defineProps<{
  email: EmailDetail | null
  loading?: boolean
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
  padding: 24px 32px;
  background: #F8F6F7;
}

.detail__header {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
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
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.detail__html-body {
  max-width: 100%;
  font-size: 14px;
  line-height: 1.7;
  color: #2D2327;
}

.detail__html-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}

.detail__html-body :deep(a) {
  color: #E85D75;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.detail__html-body :deep(blockquote) {
  border-left: 3px solid #EAE5E8;
  margin: 12px 0;
  padding: 4px 12px;
  color: #6B5E63;
}

.detail__html-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
}

.detail__html-body :deep(td),
.detail__html-body :deep(th) {
  border: 1px solid #EAE5E8;
  padding: 6px 10px;
  text-align: left;
}

.detail__text-body {
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Noto Sans SC',
    'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
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
</style>
