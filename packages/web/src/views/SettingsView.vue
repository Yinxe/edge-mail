<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NButton, NInput, NTag, NCard, useMessage } from 'naive-ui'
import { fetchSettings, updateSettings } from '../api'

const message = useMessage()

// ── State ──

const domains = ref<string[]>([])
const newDomain = ref('')
const saving = ref(false)
const loading = ref(true)

// ── Derived ──

const hasChanges = computed(() => {
  // 暂存初始值比较 — 这里简化：只要 loaded 过就算有变动
  return true // 由 save 按钮 disabled 逻辑替代
})

const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/

function isValidDomain(d: string): boolean {
  return domainPattern.test(d) && d.length <= 253
}

// ── Methods ──

async function load() {
  loading.value = true
  try {
    const settings = await fetchSettings()
    const d = (settings.domains as { domains: string[] } | undefined)?.domains
    domains.value = d ?? []
  } catch {
    message.error('加载设置失败')
  } finally {
    loading.value = false
  }
}

function addDomain() {
  const d = newDomain.value.trim().toLowerCase()
  if (!d) return

  if (!isValidDomain(d)) {
    message.warning('域名格式不正确，如 example.com')
    return
  }

  if (domains.value.includes(d)) {
    message.warning('该域名已存在')
    return
  }

  domains.value.push(d)
  newDomain.value = ''
}

function removeDomain(d: string) {
  domains.value = domains.value.filter(x => x !== d)
}

async function save() {
  saving.value = true
  try {
    await updateSettings('domains', { domains: domains.value })
    message.success('设置已保存')
  } catch {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

// ── Lifecycle ──

onMounted(load)
</script>

<template>
  <div class="settings">
    <!-- Page Header -->
    <div class="settings__header">
      <h1 class="settings__title">设置</h1>
      <p class="settings__subtitle">管理系统运行所需的配置项</p>
    </div>

    <!-- Domains Card -->
    <NCard class="settings__card" :bordered="false" size="large">
      <div class="settings__section">
        <div class="settings__section-head">
          <div class="settings__section-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13 2 4" />
            </svg>
          </div>
          <div>
            <h2 class="settings__section-title">邮箱域名</h2>
            <p class="settings__section-desc">只有列表中配置的域名才会被系统接受。添加或删除允许接收邮件的域名。</p>
          </div>
        </div>

        <!-- Domain List -->
        <div class="settings__domain-list">
          <TransitionGroup name="tag" tag="div" class="settings__tags">
            <NTag
              v-for="d in domains"
              :key="d"
              closable
              :color="{ color: '#F3ECF8', textColor: '#7B4EA3', borderColor: '#E0D0EA' }"
              @close="removeDomain(d)"
            >
              {{ d }}
            </NTag>
          </TransitionGroup>

          <div v-if="domains.length === 0 && !loading" class="settings__empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D0C8CC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span>还没有配置任何域名 ✨</span>
          </div>
        </div>

        <!-- Add Domain -->
        <div class="settings__add">
          <NInput
            v-model:value="newDomain"
            placeholder="example.com"
            :disabled="saving"
            clearable
            class="settings__add-input"
            @keyup.enter="addDomain"
          />
          <NButton
            secondary
            :disabled="!newDomain.trim() || saving"
            @click="addDomain"
          >
            ＋ 添加
          </NButton>
        </div>
        <p class="settings__hint">域名只能包含字母、数字、连字符和点，如 mail.example.com</p>
      </div>

      <!-- Save Bar -->
      <div class="settings__actions">
        <NButton
          type="primary"
          :loading="saving"
          :disabled="loading"
          @click="save"
        >
          保存更改
        </NButton>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
/* ── Layout ── */
.settings {
  max-width: 680px;
  margin: 0 auto;
  padding: 28px 24px 48px;
}

.settings__header {
  margin-bottom: 24px;
}

.settings__title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
  color: #2D2327;
  line-height: 1.4;
}

.settings__subtitle {
  margin: 0;
  font-size: 14px;
  color: #9E9196;
}

/* ── Card ── */
.settings__card {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

/* ── Section ── */
.settings__section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings__section-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.settings__section-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFF5F6;
  border-radius: 10px;
  color: #E85D75;
}

.settings__section-title {
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 600;
  color: #2D2327;
  line-height: 1.4;
}

.settings__section-desc {
  margin: 0;
  font-size: 13px;
  color: #6B5E63;
  line-height: 1.6;
}

/* ── Domain Tags ── */
.settings__domain-list {
  min-height: 48px;
}

.settings__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.settings__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 16px;
  color: #9E9196;
  font-size: 14px;
}

/* ── Add Domain Row ── */
.settings__add {
  display: flex;
  gap: 8px;
}

.settings__add-input {
  flex: 1;
}

.settings__hint {
  margin: 0;
  font-size: 12px;
  color: #9E9196;
}

/* ── Actions ── */
.settings__actions {
  padding-top: 20px;
  border-top: 1px solid #EAE5E8;
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

/* ── Tag enter/leave animation ── */
.tag-enter-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.tag-leave-active {
  transition: all 0.15s ease-out;
}
.tag-enter-from {
  opacity: 0;
  transform: scale(0.85);
}
.tag-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
</style>
