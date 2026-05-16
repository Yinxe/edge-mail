<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NInput, NButton, NCard, useMessage } from 'naive-ui'
import { login } from '../api'
import { token } from '../store'

const router = useRouter()
const message = useMessage()
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!password.value) return
  loading.value = true
  try {
    const result = await login(password.value)
    token.value = result.token
    router.push('/inbox')
  } catch {
    message.error('密码错误')
  } finally {
    loading.value = false
  }
}

async function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') await handleLogin()
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <NCard title="Edge Mail" class="w-96">
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
          @click="handleLogin"
        >
          登录
        </NButton>
      </div>
    </NCard>
  </div>
</template>
