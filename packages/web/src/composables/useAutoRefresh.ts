import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Auto-refresh with countdown timer.
 * Calls `refreshFn` when countdown reaches 0, then resets.
 * Manual refresh resets the countdown.
 */
export function useAutoRefresh(refreshFn: () => Promise<void>, intervalSeconds: number = 60) {
  const countdown = ref(intervalSeconds)
  const isEnabled = ref(true)
  let timer: ReturnType<typeof setInterval> | null = null

  function start() {
    stop()
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        countdown.value = intervalSeconds
        refreshFn()
      }
    }, 1000)
  }

  function stop() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function manualRefresh() {
    countdown.value = intervalSeconds
    refreshFn()
  }

  function toggle() {
    isEnabled.value = !isEnabled.value
    if (isEnabled.value) start()
    else stop()
  }

  function resetCountdown() {
    countdown.value = intervalSeconds
  }

  onMounted(() => {
    if (isEnabled.value) start()
  })

  onUnmounted(() => stop())

  return { countdown, isEnabled, manualRefresh, toggle, resetCountdown }
}
