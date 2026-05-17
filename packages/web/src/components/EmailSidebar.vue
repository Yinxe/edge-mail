<script setup lang="ts">
import { ref, computed } from 'vue'
import { NPagination, NText, NModal, NButton, NSelect } from 'naive-ui'
import type { EmailMeta } from '../store'
import EmailListItem from './EmailListItem.vue'
import { useAutoRefresh } from '../composables/useAutoRefresh'

const props = defineProps<{
  emails: EmailMeta[]
  currentId: number | null
  page: number
  total: number
  limit: number
  searchQuery: string
  onRefresh?: () => void
  onBatchDelete?: (ids: number[], onProgress?: (current: number) => void) => Promise<void>
}>()

const emit = defineEmits<{
  select: [id: number]
  delete: [id: number]
  'update:page': [page: number]
  'update:searchQuery': [value: string]
  'update:limit': [limit: number]
}>()

const PAGE_SIZE_OPTIONS = [
  { label: '20 / 页', value: 20 },
  { label: '50 / 页', value: 50 },
  { label: '100 / 页', value: 100 },
]

/* ── Search ── */
function onSearchInput(e: Event) {
  emit('update:searchQuery', (e.target as HTMLInputElement).value)
}
function onClearSearch() {
  emit('update:searchQuery', '')
}

/* ── Auto refresh ── */
const {
  countdown,
  isEnabled: autoRefreshEnabled,
  manualRefresh,
  toggle: toggleAutoRefresh,
} = useAutoRefresh(
  async () => { props.onRefresh?.() },
  60,
)

/* ── Multi-select ── */
const selectMode = ref(false)
const selectedIds = ref(new Set<number>())

const selectedCount = computed(() => selectedIds.value.size)
const allSelected = computed(() => {
  return props.emails.length > 0 && props.emails.every((e) => selectedIds.value.has(e.id))
})

function toggleSelect(id: number) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function selectAll() {
  selectedIds.value = new Set(props.emails.map((e) => e.id))
}

function deselectAll() {
  selectedIds.value = new Set()
}

function enterSelectMode() {
  selectMode.value = true
  deselectAll()
}

function exitSelectMode() {
  selectMode.value = false
  deselectAll()
}

/* ── Batch delete with progress ── */
const showDeleteDialog = ref(false)
const deleteProgress = ref(0)
const deleteTotal = ref(0)
const isDeleting = ref(false)

async function confirmBatchDelete() {
  const ids = [...selectedIds.value]
  if (ids.length === 0) return

  showDeleteDialog.value = true
  isDeleting.value = true
  deleteTotal.value = ids.length
  deleteProgress.value = 0

  // Delete all with progress callback
  await props.onBatchDelete?.(ids, (current: number) => {
    deleteProgress.value = current
  })

  isDeleting.value = false
  selectMode.value = false
  // Keep dialog open briefly to show 100%, then close
  setTimeout(() => {
    showDeleteDialog.value = false
  }, 600)
}

function handleLimitChange(value: number) {
  emit('update:limit', value)
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

    <!-- Action toolbar -->
    <div class="sidebar__toolbar">
      <div class="sidebar__toolbar-left">
        <!-- Multi-select toggle -->
        <button
          v-if="!selectMode"
          class="sidebar__toolbar-btn"
          title="多选"
          @click="enterSelectMode"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="12" y1="9" x2="12" y2="15" />
          </svg>
          <span>多选</span>
        </button>

        <!-- Multi-select actions -->
        <template v-else>
          <span class="sidebar__select-count">已选 {{ selectedCount }} 项</span>
          <button
            class="sidebar__toolbar-btn sidebar__toolbar-btn--select"
            @click="allSelected ? deselectAll() : selectAll()"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline v-if="!allSelected" points="20 6 9 17 4 12" />
              <rect v-else x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
            <span>{{ allSelected ? '取消全选' : '全选' }}</span>
          </button>
          <button
            class="sidebar__toolbar-btn sidebar__toolbar-btn--danger"
            :class="{ 'sidebar__toolbar-btn--disabled': selectedCount === 0 }"
            :disabled="selectedCount === 0"
            @click="confirmBatchDelete"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            <span>删除</span>
          </button>
          <button
            class="sidebar__toolbar-btn"
            @click="exitSelectMode"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>取消</span>
          </button>
        </template>
      </div>

      <div class="sidebar__toolbar-right">
        <!-- Refresh button: auto-countdown + manual trigger -->
        <button
          class="sidebar__toolbar-btn"
          :class="{ 'sidebar__toolbar-btn--active': autoRefreshEnabled }"
          :title="autoRefreshEnabled ? `自动刷新中，${countdown}s 后刷新` : '自动刷新已关闭'"
          @click="manualRefresh"
        >
          <svg
            width="16" height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="{ 'sidebar__refresh-spin': !autoRefreshEnabled }"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          <span>{{ autoRefreshEnabled ? `${countdown}s` : '刷新' }}</span>
        </button>
        <!-- Auto-refresh toggle -->
        <button
          class="sidebar__toolbar-btn sidebar__toolbar-btn--icon"
          :title="autoRefreshEnabled ? '关闭自动刷新' : '开启自动刷新'"
          @click="toggleAutoRefresh"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" :stroke="autoRefreshEnabled ? '#E85D75' : '#9E9196'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline v-if="autoRefreshEnabled" points="12 6 12 12 16 14" />
            <template v-else>
              <line x1="8" y1="8" x2="16" y2="16" />
              <line x1="16" y1="8" x2="8" y2="16" />
            </template>
          </svg>
        </button>
      </div>
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
        :show-checkbox="selectMode"
        :checked="selectedIds.has(email.id)"
        @select="emit('select', $event)"
        @delete="emit('delete', $event)"
        @check="toggleSelect"
      />
    </TransitionGroup>

    <div class="sidebar__pagination">
      <div class="sidebar__pagination-inner">
        <NSelect
          :value="limit"
          :options="PAGE_SIZE_OPTIONS"
          size="small"
          class="sidebar__page-size"
          @update:value="handleLimitChange"
        />
        <NPagination
          :page="page"
          :page-count="Math.ceil(total / limit) || 1"
          :page-size="limit"
          size="small"
          @update:page="emit('update:page', $event)"
        />
      </div>
    </div>

    <!-- Delete progress dialog -->
    <NModal v-model:show="showDeleteDialog" preset="dialog" title="删除邮件" :closeable="!isDeleting" :mask-closable="!isDeleting">
      <div class="sidebar__delete-progress">
        <div class="sidebar__progress-circle">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <!-- Background circle -->
            <circle cx="36" cy="36" r="30" fill="none" stroke="#EAE5E8" stroke-width="5" />
            <!-- Progress arc -->
            <circle
              cx="36" cy="36" r="30"
              fill="none"
              stroke="#E85D75"
              stroke-width="5"
              stroke-linecap="round"
              :stroke-dasharray="2 * Math.PI * 30"
              :stroke-dashoffset="2 * Math.PI * 30 * (1 - deleteProgress / deleteTotal)"
              transform="rotate(-90 36 36)"
              class="sidebar__progress-arc"
            />
          </svg>
          <span class="sidebar__progress-text">{{ deleteTotal > 0 ? Math.round(deleteProgress / deleteTotal * 100) : 0 }}%</span>
        </div>
        <p class="sidebar__progress-label">
          {{ isDeleting ? `正在删除 ${deleteProgress} / ${deleteTotal} 封邮件…` : '删除完成 ✓' }}
        </p>
      </div>
    </NModal>
  </aside>
</template>

<style scoped>
.sidebar { display: flex; flex-direction: column; height: 100%; background: #FFFFFF; }

/* ── Search ── */
.sidebar__search { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #EAE5E8; flex-shrink: 0; }
.sidebar__search-icon { flex-shrink: 0; color: #9E9196; }
.sidebar__search-input { flex: 1; border: none; background: transparent; font-size: 13px; font-family: 'Nunito',-apple-system,BlinkMacSystemFont,'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif; color: #2D2327; outline: none; min-width: 0; }
.sidebar__search-input::placeholder { color: #9E9196; }
.sidebar__search-clear { display: flex; align-items: center; padding: 2px; border: none; background: transparent; color: #9E9196; cursor: pointer; border-radius: 4px; transition: color 150ms ease-out; }
.sidebar__search-clear:hover { color: #E85D75; }

/* ── Toolbar ── */
.sidebar__toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 12px; border-bottom: 1px solid #EAE5E8; flex-shrink: 0; min-height: 36px; }
.sidebar__toolbar-left { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }
.sidebar__toolbar-right { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }

.sidebar__toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: #6B5E63;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  border-radius: 6px;
  transition: all 150ms ease-out;
  white-space: nowrap;
}
.sidebar__toolbar-btn:hover { background: #FFF5F6; color: #E85D75; }
.sidebar__toolbar-btn--active { color: #E85D75; background: #FFF5F6; }
.sidebar__toolbar-btn--danger { color: #E55959; }
.sidebar__toolbar-btn--danger:hover { background: #FFF2F0; color: #E55959; }
.sidebar__toolbar-btn--danger.sidebar__toolbar-btn--disabled,
.sidebar__toolbar-btn--danger:disabled { color: #9E9196; background: transparent; cursor: not-allowed; opacity: 0.5; }

.sidebar__select-count { font-size: 12px; color: #E85D75; font-weight: 600; margin-right: 4px; }
.sidebar__toolbar-btn--icon { padding: 4px; }
.sidebar__refresh-spin { animation: sidebar-spin 1.5s linear infinite; transform-origin: center; }
@keyframes sidebar-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ── Header ── */
.sidebar__header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #EAE5E8; flex-shrink: 0; }
.sidebar__title { font-size: 15px; color: #2D2327; }
.sidebar__count { font-size: 13px; }

/* ── List ── */
.sidebar__list { flex: 1; overflow-y: auto; position: relative; }

/* ── Pagination ── */
.sidebar__pagination { display: flex; justify-content: center; padding: 8px 16px; border-top: 1px solid #EAE5E8; flex-shrink: 0; }
.sidebar__pagination-inner { display: flex; align-items: center; gap: 8px; }
.sidebar__page-size { width: 90px; }

/* ── Delete progress dialog ── */
.sidebar__delete-progress { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 16px 0; }
.sidebar__progress-circle { position: relative; width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; }
.sidebar__progress-arc { transition: stroke-dashoffset 300ms ease-out; }
.sidebar__progress-text { position: absolute; font-size: 14px; font-weight: 700; color: #E85D75; }
.sidebar__progress-label { margin: 0; font-size: 14px; color: #6B5E63; }
</style>
