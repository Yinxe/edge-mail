<script setup lang="ts">
import { NList, NListItem, NPagination, NTag, NText, NEllipsis } from 'naive-ui'
import type { EmailMeta } from '../store'

defineProps<{
  emails: EmailMeta[]
  currentId: number | null
  page: number
  total: number
  limit: number
}>()

const emit = defineEmits<{
  select: [id: number]
  'update:page': [page: number]
}>()

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'Z')
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col h-full border-r border-gray-200">
    <div class="p-3 border-b border-gray-200">
      <NText strong>收件箱</NText>
      <NText depth="3" class="ml-2">({{ total }})</NText>
    </div>

    <div class="flex-1 overflow-y-auto">
      <NList :show-divider="false" class="cursor-pointer">
        <NListItem
          v-for="email in emails"
          :key="email.id"
          :class="[
            'px-4 py-3 hover:bg-gray-50 transition-colors',
            currentId === email.id ? 'bg-blue-50' : '',
            !email.is_read ? 'font-semibold' : '',
          ]"
          @click="emit('select', email.id)"
        >
          <div class="w-full min-w-0">
            <div class="flex items-center justify-between gap-2">
              <NEllipsis class="text-sm">{{ email.sender }}</NEllipsis>
              <NText depth="3" class="text-xs whitespace-nowrap flex-shrink-0">
                {{ formatDate(email.created_at) }}
              </NText>
            </div>
            <div class="flex items-center gap-1 mt-1">
              <NEllipsis class="text-xs" :class="!email.is_read ? 'text-gray-900' : 'text-gray-500'">
                {{ email.subject }}
              </NEllipsis>
              <NTag v-if="!email.is_read" type="info" size="tiny" :bordered="false">
                新
              </NTag>
            </div>
          </div>
        </NListItem>
      </NList>
    </div>

    <div class="p-3 border-t border-gray-200 flex justify-center">
      <NPagination
        :page="page"
        :page-count="Math.ceil(total / limit) || 1"
        :page-size="limit"
        @update:page="emit('update:page', $event)"
      />
    </div>
  </div>
</template>
