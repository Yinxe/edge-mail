<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const title = (route.meta?.title as string) ?? '页面'
</script>

<template>
  <div class="todo">
    <div class="todo__card">
      <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
        <rect x="8" y="8" width="48" height="48" rx="12" fill="#F0788A" opacity="0.15" stroke="#E85D75" stroke-width="1.5" />
        <path d="M24 32l6 6 10-12" stroke="#E85D75" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <h2 class="todo__title">{{ title }}</h2>
      <p class="todo__desc">功能开发中，敬请期待 ✨</p>
    </div>
  </div>
</template>

<style scoped>
.todo {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.todo__card {
  text-align: center;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 40px 48px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.todo__title {
  font-size: 20px;
  font-weight: 700;
  color: #2D2327;
  margin: 16px 0 8px;
}

.todo__desc {
  font-size: 14px;
  color: #9E9196;
  margin: 0;
}
</style>
