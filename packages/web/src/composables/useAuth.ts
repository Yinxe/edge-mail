import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { login as apiLogin } from '../api'
import { token } from '../store'

export function useAuth() {
  const router = useRouter()
  const loading = shallowRef(false)

  async function login(password: string): Promise<boolean> {
    if (!password) return false
    loading.value = true
    try {
      const result = await apiLogin(password)
      token.value = result.token
      router.push('/inbox')
      return true
    } catch {
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = ''
    router.push('/login')
  }

  return { loading, login, logout, isAuthenticated: () => !!token.value }
}
