<script setup lang="ts">
import { NTag, NText, NDivider, NEmpty } from 'naive-ui'
import type { EmailDetail } from '../store'

defineProps<{
  email: EmailDetail | null
}>()

function formatFullDate(dateStr: string): string {
  return new Date(dateStr + 'Z').toLocaleString('zh-CN')
}
</script>

<template>
  <div class="flex-1 overflow-y-auto p-6">
    <template v-if="email">
      <div class="mb-4">
        <h2 class="text-xl font-bold mb-2">{{ email.subject }}</h2>
        <div class="flex flex-col gap-1 text-sm">
          <div>
            <NText depth="3" class="w-12 inline-block">发件人:</NText>
            <NText>{{ email.sender }}</NText>
          </div>
          <div>
            <NText depth="3" class="w-12 inline-block">收件人:</NText>
            <NText>{{ email.recipient }}</NText>
          </div>
          <div>
            <NText depth="3" class="w-12 inline-block">时间:</NText>
            <NText>{{ formatFullDate(email.created_at) }}</NText>
          </div>
        </div>
        <div class="mt-2">
          <NTag :type="email.is_read ? 'default' : 'info'" size="small">
            {{ email.is_read ? '已读' : '未读' }}
          </NTag>
        </div>
      </div>

      <NDivider />

      <div class="prose max-w-none text-sm">
        <div v-if="email.html_body" v-html="email.html_body" class="email-body" />
        <pre v-else-if="email.text_body" class="whitespace-pre-wrap font-sans text-sm">{{ email.text_body }}</pre>
        <NText v-else depth="3">（无正文内容）</NText>
      </div>
    </template>

    <template v-else>
      <div class="flex items-center justify-center h-full">
        <NEmpty description="选择一封邮件查看" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.email-body :deep(img) {
  max-width: 100%;
  height: auto;
}

.email-body :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}
</style>
