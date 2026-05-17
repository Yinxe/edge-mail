<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useMessage } from 'naive-ui'

defineProps<{
  open: boolean
  mode: 'desktop' | 'drawer'
}>()

const emit = defineEmits<{
  close: []
  navigate: []
}>()

const route = useRoute()
const router = useRouter()
const { logout } = useAuth()
const message = useMessage()

function handleLogout() {
  logout()
  message.success('已退出登录')
}

function handleNavClick(path: string) {
  router.push(path)
  emit('navigate')
}

function isActive(path: string): boolean {
  if (path === '/inbox') return route.path.startsWith('/inbox')
  return route.path === path
}
</script>

<template>
  <aside
    class="nav"
    :class="{
      'nav--desktop': mode === 'desktop',
      'nav--drawer': mode === 'drawer',
      'nav--open': open,
    }"
  >
    <button v-if="mode === 'drawer'" class="nav__close" @click="emit('close')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>

    <div class="nav__header">
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#E85D75" />
        <path d="M10 14h20v14a2 2 0 01-2 2H12a2 2 0 01-2-2V14z" fill="white" opacity="0.9" />
        <path d="M10 14l10 8 10-8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
      </svg>
      <span class="nav__brand">EdgeMail</span>
    </div>

    <nav class="nav__menu">
      <!-- Inbox -->
      <a class="nav__item" :class="{ 'nav__item--active': isActive('/inbox') }" @click="handleNavClick('/inbox')">
        <svg class="nav__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 4L12 13 2 4" />
        </svg>
        <span>收件箱</span>
      </a>
      <!-- Settings -->
      <a class="nav__item" :class="{ 'nav__item--active': isActive('/settings') }" @click="handleNavClick('/settings')">
        <svg class="nav__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1.08H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z" />
        </svg>
        <span>设置</span>
      </a>
      <!-- Users -->
      <a class="nav__item" :class="{ 'nav__item--active': isActive('/users') }" @click="handleNavClick('/users')">
        <svg class="nav__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
        </svg>
        <span>用户管理</span>
      </a>
      <!-- Accounts -->
      <a class="nav__item" :class="{ 'nav__item--active': isActive('/accounts') }" @click="handleNavClick('/accounts')">
        <svg class="nav__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 4L12 13 2 4" /><line x1="2" y1="20" x2="10" y2="13" /><line x1="22" y1="20" x2="14" y2="13" />
        </svg>
        <span>邮箱账号</span>
      </a>
    </nav>

    <div class="nav__footer">
      <div class="nav__user">
        <div class="nav__avatar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <span class="nav__username">管理员</span>
      </div>
      <button class="nav__logout" title="退出登录" @click="handleLogout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.nav { width: 220px; display: flex; flex-direction: column; background: #FFFFFF; flex-shrink: 0; }
.nav--desktop { height: 100vh; border-right: 1px solid #EAE5E8; position: relative; z-index: 10; }
.nav--drawer { position: fixed; top: 0; left: 0; height: 100vh; z-index: 100; border-right: 1px solid #EAE5E8; transform: translateX(-100%); transition: transform var(--anim-drawer-duration) var(--anim-drawer-easing); box-shadow: 4px 0 12px rgba(0,0,0,0.08); }
.nav--drawer.nav--open { transform: translateX(0); }
.nav__close { position: absolute; top: 14px; right: 12px; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; background: transparent; color: #9E9196; cursor: pointer; border-radius: 8px; transition: background var(--anim-micro-duration) var(--anim-micro-easing), color var(--anim-micro-duration) var(--anim-micro-easing); }
.nav__close:hover { background: #FFF5F6; color: #E85D75; }
.nav__header { display: flex; align-items: center; gap: 10px; padding: 20px 16px; border-bottom: 1px solid #EAE5E8; flex-shrink: 0; }
.nav__brand { font-size: 18px; font-weight: 700; color: #2D2327; }
.nav__menu { flex: 1; padding: 8px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.nav__item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; cursor: pointer; color: #6B5E63; font-size: 14px; font-weight: 500; transition: background var(--anim-micro-duration) var(--anim-micro-easing), color var(--anim-micro-duration) var(--anim-micro-easing); text-decoration: none; user-select: none; }
.nav__item:hover { background: #FFF5F6; color: #E85D75; }
.nav__item--active { background: #FDE8EB; color: #E85D75; font-weight: 600; }
.nav__icon { flex-shrink: 0; }
.nav__footer { padding: 10px 12px; border-top: 1px solid #EAE5E8; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.nav__user { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.nav__avatar { width: 30px; height: 30px; border-radius: 50%; background: #F0788A; color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nav__username { font-size: 13px; font-weight: 600; color: #2D2327; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nav__logout { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border: none; background: transparent; color: #9E9196; cursor: pointer; border-radius: 8px; transition: background var(--anim-micro-duration) var(--anim-micro-easing), color var(--anim-micro-duration) var(--anim-micro-easing); flex-shrink: 0; }
.nav__logout:hover { background: #FFF5F6; color: #E55959; }
</style>
