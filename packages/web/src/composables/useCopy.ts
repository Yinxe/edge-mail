import { useMessage } from 'naive-ui'

/**
 * Composable for copying text to clipboard with visual feedback via Naive UI toast.
 * Must be called within a component setup that has NMessageProvider ancestor.
 *
 * @returns { copy } - Async function: copy(text, label?)
 *   - text: the string to copy
 *   - label: optional display label (e.g. "发件人地址"), shown in success toast
 */
export function useCopy() {
  const message = useMessage()

  async function copy(text: string, label?: string): Promise<void> {
    const toastText = label ? `${label} 已复制` : '已复制'

    try {
      await navigator.clipboard.writeText(text)
      message.success(toastText)
    } catch {
      // Fallback for insecure contexts or older browsers
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        textarea.style.top = '-9999px'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        message.success(toastText)
      } catch {
        message.error('复制失败，请手动复制')
      }
    }
  }

  return { copy }
}
