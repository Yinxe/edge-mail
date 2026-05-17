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
}>()

const emit = defineEmits<{
  select: [id: number]
  delete: [id: number]
  'update:page': [page: number]
}>()
</script>

<template>
  <aside class="sidebar">
    <!-- Header -->
    <div class="sidebar__header">
      <NText strong class="sidebar__title">收件箱</NText>
      <NText depth="3" class="sidebar__count">({{ total }})</NText>
    </div>

    <!-- Email list -->
    <div class="sidebar__list">
      <EmailListItem
        v-for="email in emails"
        :key="email.id"
        :email="email"
        :is-selected="currentId === email.id"
        @select="emit('select', $event)"
        @delete="emit('delete', $event)"
      />
    </div>

    <!-- Pagination -->
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
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #FFFFFF;
  border-right: 1px solid #EAE5E8;
}

.sidebar__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid #EAE5E8;
  flex-shrink: 0;
}

.sidebar__title {
  font-size: 16px;
  color: #2D2327;
}

.sidebar__count {
  font-size: 13px;
}

.sidebar__list {
  flex: 1;
  overflow-y: auto;
}

.sidebar__pagination {
  display: flex;
  justify-content: center;
  padding: 10px 16px;
  border-top: 1px solid #EAE5E8;
  flex-shrink: 0;
}
</style>
