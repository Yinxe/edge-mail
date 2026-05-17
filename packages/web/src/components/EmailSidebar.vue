<script setup lang="ts">
import { NPagination, NText } from 'naive-ui'
import type { EmailMeta } from '../store'
import EmailListItem from './EmailListItem.vue'

defineProps<{
  emails: EmailMeta[]
  currentId: number | null
  page: number
  total: number
  limit: number
  searchQuery: string
}>()

const emit = defineEmits<{
  select: [id: number]
  delete: [id: number]
  'update:page': [page: number]
  'update:searchQuery': [value: string]
}>()

function onSearchInput(e: Event) {
  emit('update:searchQuery', (e.target as HTMLInputElement).value)
}
function onClearSearch() {
  emit('update:searchQuery', '')
}
</script>

<template>
  <aside class="sidebar">
    <!-- Search bar -->
    <div class="sidebar__search">
      <svg class="sidebar__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input class="sidebar__search-input" type="text" placeholder="搜索发件人或主题…" :value="searchQuery" @input="onSearchInput" />
      <button v-if="searchQuery" class="sidebar__search-clear" @click="onClearSearch">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <div class="sidebar__header">
      <NText strong class="sidebar__title">收件箱</NText>
      <NText depth="3" class="sidebar__count">({{ total }})</NText>
    </div>

    <TransitionGroup name="list" tag="div" class="sidebar__list">
      <EmailListItem
        v-for="(email, index) in emails"
        :key="email.id"
        :style="{ '--item-index': index }"
        :email="email"
        :is-selected="currentId === email.id"
        @select="emit('select', $event)"
        @delete="emit('delete', $event)"
      />
    </TransitionGroup>

    <div class="sidebar__pagination">
      <NPagination
        :page="page"
        :page-count="Math.ceil(total / limit) || 1"
        :page-size="limit"
        size="small"
        @update:page="emit('update:page', $event)"
      />
    </div>
  </aside>
</template>

<style scoped>
.sidebar { display: flex; flex-direction: column; height: 100%; background: #FFFFFF; }
.sidebar__search { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #EAE5E8; flex-shrink: 0; }
.sidebar__search-icon { flex-shrink: 0; color: #9E9196; }
.sidebar__search-input { flex: 1; border: none; background: transparent; font-size: 13px; font-family: 'Nunito',-apple-system,BlinkMacSystemFont,'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif; color: #2D2327; outline: none; min-width: 0; }
.sidebar__search-input::placeholder { color: #9E9196; }
.sidebar__search-clear { display: flex; align-items: center; padding: 2px; border: none; background: transparent; color: #9E9196; cursor: pointer; border-radius: 4px; transition: color var(--anim-micro-duration) var(--anim-micro-easing); }
.sidebar__search-clear:hover { color: #E85D75; }
.sidebar__header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #EAE5E8; flex-shrink: 0; }
.sidebar__title { font-size: 15px; color: #2D2327; }
.sidebar__count { font-size: 13px; }
.sidebar__list { flex: 1; overflow-y: auto; position: relative; }
.sidebar__pagination { display: flex; justify-content: center; padding: 10px 16px; border-top: 1px solid #EAE5E8; flex-shrink: 0; }
</style>
