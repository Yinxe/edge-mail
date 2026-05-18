<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref } from 'vue'

const name = ref('Unknown')

const getName = async () => {
  const res = await fetch('/api/')
  const data = await res.json()
  name.value = data.name
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <header class="border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-lg font-semibold">Edge Mail</h1>
        <nav class="flex gap-4 text-sm">
          <RouterLink
            to="/"
            class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Home
          </RouterLink>
          <RouterLink
            to="/about"
            class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            About
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 py-8">
      <div class="mb-6">
        <button
          class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
          aria-label="get name"
          @click="getName"
        >
          Name from API is: {{ name }}
        </button>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Edit <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">server/index.ts</code> to
          change what the API gets
        </p>
      </div>

      <RouterView />
    </main>
  </div>
</template>
