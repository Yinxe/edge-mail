<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import NavSidebar from '../components/NavSidebar.vue'

const route = useRoute()
const navOpen = ref(false)

const pageKey = computed(() => route.path)

const isDesktop = ref(true)
function updateBreakpoint() { isDesktop.value = window.innerWidth >= 1024 }
onMounted(() => { updateBreakpoint(); window.addEventListener('resize', updateBreakpoint) })
onUnmounted(() => { window.removeEventListener('resize', updateBreakpoint) })

function onNavItemClick() { if (!isDesktop.value) navOpen.value = false }
</script>

<template>
  <div class="app-layout">
    <NavSidebar
      :open="navOpen || isDesktop"
      :mode="isDesktop ? 'desktop' : 'drawer'"
      @close="navOpen = false"
      @navigate="onNavItemClick"
    />

    <div v-if="!isDesktop && navOpen" class="nav-backdrop" @click="navOpen = false" />

    <main class="app-content">
      <div v-if="!isDesktop" class="top-bar">
        <button class="top-bar__hamburger" @click="navOpen = !navOpen">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <svg class="top-bar__logo" width="22" height="22" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill="#E85D75" />
          <path d="M10 14h20v14a2 2 0 01-2 2H12a2 2 0 01-2-2V14z" fill="white" opacity="0.9" />
          <path d="M10 14l10 8 10-8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
        </svg>
        <span class="top-bar__brand">EdgeMail</span>
      </div>

      <Transition name="page" mode="out-in">
        <router-view :key="pageKey" />
      </Transition>
    </main>
  </div>
</template>

<style scoped>
.app-layout { display: flex; height: 100vh; background: #F8F6F7; position: relative; }
.app-content { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }

.top-bar { display: flex; align-items: center; gap: 8px; height: 52px; padding: 0 12px; background: #FFFFFF; border-bottom: 1px solid #EAE5E8; flex-shrink: 0; }
.top-bar__hamburger { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: transparent; color: #6B5E63; cursor: pointer; border-radius: 8px; transition: background var(--anim-micro-duration) var(--anim-micro-easing); }
.top-bar__hamburger:hover { background: #FFF5F6; color: #E85D75; }
.top-bar__logo { flex-shrink: 0; }
.top-bar__brand { font-size: 16px; font-weight: 700; color: #2D2327; }

.nav-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 90; animation: fadeIn var(--anim-drawer-duration) var(--anim-easing-smooth); }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
