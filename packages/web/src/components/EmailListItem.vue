<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { NTag, NEllipsis, NText } from 'naive-ui'
import type { EmailMeta } from '../store'

const props = defineProps<{ email: EmailMeta; isSelected: boolean; showCheckbox?: boolean; checked?: boolean }>()
const emit = defineEmits<{ select: [id: number]; delete: [id: number]; check: [id: number] }>()

/* ── Swipe to delete ── */
const SWIPE_THRESHOLD = 40
const ACTION_WIDTH = 80

const offset = ref(0)
const isOpen = ref(false)
let startX = 0
let startY = 0
let isDragging = false
let suppressClick = false

/* ── Context menu ── */
const menuX = ref(0)
const menuY = ref(0)
const showMenu = ref(false)

const timeLabel = computed(() => {
  const d = new Date(props.email.created_at + 'Z')
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
})

/* ── Swipe logic ── */
function startDrag(clientX: number, clientY: number) {
  startX = clientX
  startY = clientY
  isDragging = false
  suppressClick = false
}

function moveDrag(clientX: number) {
  const dx = clientX - startX
  if (Math.abs(dx) > 5) isDragging = true
  const base = isOpen.value ? -ACTION_WIDTH : 0
  const newOffset = Math.min(0, Math.max(-ACTION_WIDTH, base + dx))
  offset.value = newOffset
}

function endDrag() {
  if (!isDragging) {
    if (isOpen.value) { closeSwipe(); suppressClick = true }
    return
  }
  if (offset.value < -SWIPE_THRESHOLD) openSwipe()
  else closeSwipe()
}

function openSwipe() { offset.value = -ACTION_WIDTH; isOpen.value = true }
function closeSwipe() { offset.value = 0; isOpen.value = false }

function handleItemClick() {
  if (suppressClick) { suppressClick = false; return }
  if (isOpen.value) { closeSwipe(); return }
  if (props.showCheckbox) {
    emit('check', props.email.id)
  } else {
    emit('select', props.email.id)
  }
}

/* ── Context menu ── */
function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  closeSwipe()
  menuX.value = e.clientX
  menuY.value = e.clientY
  showMenu.value = true
}

function onDeleteFromMenu() {
  showMenu.value = false
  emit('delete', props.email.id)
}

function onMenuOverlayClick() {
  showMenu.value = false
}

// Touch events
function onTouchStart(e: TouchEvent) { startDrag(e.touches[0].clientX, e.touches[0].clientY) }
function onTouchMove(e: TouchEvent) {
  moveDrag(e.touches[0].clientX)
  // Only prevent default when dragging horizontally — preserves scroll + tap
  if (isDragging) e.preventDefault()
}
function onTouchEnd() { endDrag() }

// Mouse drag
function onMouseDown(e: MouseEvent) {
  if (showMenu.value) { showMenu.value = false; return }
  startDrag(e.clientX, e.clientY)
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
function onMouseMove(e: MouseEvent) { moveDrag(e.clientX) }
function onMouseUp() { endDrag(); document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp) }

// Close menu on window click
function onWindowClick() { if (showMenu.value) showMenu.value = false }
onMounted(() => window.addEventListener('click', onWindowClick))
onUnmounted(() => window.removeEventListener('click', onWindowClick))
</script>

<template>
  <div
    class="email-item-wrapper"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @mousedown="onMouseDown"
    @contextmenu="onContextMenu"
  >
    <!-- Delete action (behind, revealed on swipe) -->
    <div class="email-item__action" @click="emit('delete', email.id)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
      <span>删除</span>
    </div>

    <!-- Content (slides left on swipe) -->
    <div
      class="email-item"
      :class="{ 'email-item--selected': isSelected, 'email-item--unread': !email.is_read }"
      :style="{ transform: `translateX(${offset}px)` }"
      @click="handleItemClick"
    >
      <div v-if="showCheckbox" class="email-item__checkbox" @click.stop="emit('check', email.id)">
        <div :class="['email-item__checkbox-box', { 'email-item__checkbox-box--checked': checked }]">
          <svg v-if="checked" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
      <div v-if="!email.is_read && !showCheckbox" class="email-item__indicator" />
      <div class="email-item__body">
        <div class="email-item__header">
          <NEllipsis class="email-item__sender" :class="{ 'email-item__sender--unread': !email.is_read }">{{ email.sender }}</NEllipsis>
          <NText depth="3" class="email-item__time">{{ timeLabel }}</NText>
        </div>
        <div class="email-item__footer">
          <NEllipsis class="email-item__subject" :class="email.is_read ? 'email-item__subject--read' : 'email-item__subject--unread'">{{ email.subject }}</NEllipsis>
          <NTag v-if="!email.is_read" type="info" size="tiny" :bordered="false" class="email-item__tag">新</NTag>
        </div>
      </div>
    </div>

    <!-- Context menu overlay -->
    <Teleport to="body">
      <div v-if="showMenu" class="ctx-overlay" @click="onMenuOverlayClick" @contextmenu.prevent="onMenuOverlayClick" />
      <div
        v-if="showMenu"
        class="ctx-menu"
        :style="{ left: menuX + 'px', top: menuY + 'px' }"
      >
        <button class="ctx-menu__item ctx-menu__item--danger" @click="onDeleteFromMenu">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
          <span>删除</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.email-item-wrapper {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid #EAE5E8;
}

/* ── Delete action (swipe reveal) ── */
.email-item__action {
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 100%;
  background: #E55959;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  border: none;
}

/* ── Content ── */
.email-item {
  display: flex;
  align-items: stretch;
  padding: 12px 16px;
  cursor: pointer;
  transition: transform var(--anim-micro-duration) ease-out,
              background-color var(--anim-micro-duration) var(--anim-micro-easing);
  position: relative;
  background: #FFFFFF;
  z-index: 1;
  min-height: 52px;
}
.email-item:hover { background-color: #FFF5F6; }
.email-item--selected { background-color: #FDE8EB; }
.email-item--selected:hover { background-color: #FDE8EB; }

.email-item__checkbox { display: flex; align-items: center; flex-shrink: 0; margin-right: 10px; cursor: pointer; }
.email-item__checkbox-box { width: 18px; height: 18px; border: 2px solid #9E9196; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 150ms ease-out; color: #FFFFFF; }
.email-item__checkbox-box--checked { background: #E85D75; border-color: #E85D75; }
.email-item__checkbox:hover .email-item__checkbox-box { border-color: #E85D75; }
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

/* ── Context menu overlay ── */
.ctx-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: transparent;
}

/* ── Context menu ── */
.ctx-menu {
  position: fixed;
  z-index: 1000;
  min-width: 120px;
  background: #FFFFFF;
  border: 1px solid #EAE5E8;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 4px;
  overflow: hidden;
}

.ctx-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  border-radius: 6px;
  transition: background 150ms ease-out;
  white-space: nowrap;
}

.ctx-menu__item--danger {
  color: #E55959;
}
.ctx-menu__item--danger:hover {
  background: #FFF2F0;
}
</style>
