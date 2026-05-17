<script setup lang="ts">
import { shallowRef } from 'vue'
import { NInput, NButton, NCard, useMessage } from 'naive-ui'
import { useAuth } from '../composables/useAuth'

const message = useMessage()
const password = shallowRef('')
const { loading, login } = useAuth()

async function handleLogin() {
  const ok = await login(password.value)
  if (!ok) message.error('密码错误')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleLogin()
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <NCard>
        <div class="text-center mb-6">
          <!-- Logo / Brand mark -->
          <div class="login-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#E85D75" />
              <path d="M10 14h20v14a2 2 0 01-2 2H12a2 2 0 01-2-2V14z" fill="white" opacity="0.9" />
              <path d="M10 14l10 8 10-8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
            </svg>
          </div>
          <h1 class="text-xl font-bold text-[#2D2327] mt-3 mb-1">EdgeMail</h1>
          <p class="text-sm text-[#6B5E63]">Powered by Cloudflare</p>
        </div>

        <div class="space-y-4">
          <NInput
            v-model:value="password"
            type="password"
            placeholder="请输入密码"
            :disabled="loading"
            @keydown="onKeydown"
          />
          <NButton
            type="primary"
            :loading="loading"
            block
            size="large"
            @click="handleLogin"
          >
            登录
          </NButton>
        </div>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8F6F7;
  padding: 16px;
}

.login-card {
  width: 100%;
  max-width: 380px;
  animation: fade-scale-in 0.35s ease-out;
}

@keyframes fade-scale-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
