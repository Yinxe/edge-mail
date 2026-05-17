<script setup lang="ts">
import { computed } from 'vue'
import { NTag, NEllipsis, NText, NButton } from 'naive-ui'
import type { EmailMeta } from '../store'

const props = defineProps<{ email: EmailMeta; isSelected: boolean }>()
const emit = defineEmits<{ select: [id: number]; delete: [id: number] }>()

const timeLabel = computed(() => {
  const d = new Date(props.email.created_at + 'Z')
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
})
</script>

<template>
  <div
    class="email-item"
    :class="{ 'email-item--selected': isSelected, 'email-item--unread': !email.is_read }"
    @click="emit('select', email.id)"
  >
    <div v-if="!email.is_read" class="email-item__indicator" />
    <div class="email-item__body">
      <div class="email-item__header">
        <NEllipsis class="email-item__sender" :class="{ 'email-item__sender--unread': !email.is_read }">{{ email.sender }}</NEllipsis>
        <NText depth="3" class="email-item__time">{{ timeLabel }}</NText>
      </div>
      <div class="email-item__footer">
        <NEllipsis class="email-item__subject" :class="email.is_read ? 'email-item__subject--read' : 'email-item__subject--unread'">{{ email.subject }}</NEllipsis>
        <div class="email-item__actions">
          <NButton text size="tiny" class="email-item__delete" @click.stop="emit('delete', email.id)">
            <template #icon>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </template>
          </NButton>
        </div>
        <NTag v-if="!email.is_read" type="info" size="tiny" :bordered="false" class="email-item__tag">新</NTag>
      </div>
    </div>
  </div>
</template>

<style scoped>
.email-item { display: flex; align-items: stretch; padding: 12px 16px; cursor: pointer; transition: background-color var(--anim-micro-duration) var(--anim-micro-easing); position: relative; border-bottom: 1px solid #EAE5E8; }
.email-item:last-child { border-bottom: none; }
.email-item:hover { background-color: #FFF5F6; }
.email-item--selected { background-color: #FDE8EB; }
.email-item--selected:hover { background-color: #FDE8EB; }
.email-item__indicator { width: 3px; flex-shrink: 0; background: #4A9FE5; border-radius: 0 2px 2px 0; margin: -12px 10px -12px -16px; }
.email-item__body { flex: 1; min-width: 0; }
.email-item__header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.email-item__sender { font-size: 14px; flex: 1; min-width: 0; }
.email-item__sender--unread { font-weight: 700; color: #2D2327; }
.email-item__time { font-size: 12px; white-space: nowrap; flex-shrink: 0; }
.email-item__footer { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.email-item__subject { font-size: 13px; flex: 1; min-width: 0; }
.email-item__subject--unread { font-weight: 600; color: #2D2327; }
.email-item__subject--read { color: #6B5E63; }
.email-item__tag { flex-shrink: 0; }
.email-item__actions { display: none; flex-shrink: 0; align-items: center; }
.email-item:hover .email-item__actions { display: flex; }
.email-item__delete { color: #E55959; opacity: 0.6; transition: opacity var(--anim-micro-duration) var(--anim-micro-easing); }
.email-item__delete:hover { opacity: 1; }
</style>
