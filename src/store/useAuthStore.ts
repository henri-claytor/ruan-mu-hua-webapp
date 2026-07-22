import { create } from 'zustand'

// 開發過渡：統登（CMoney OIDC）尚未接。VITE_AUTH_BYPASS=true 時預設「使用者已通過統登」，
// 前端不顯示登入按鈕、直接視為已登入。接統登後移除此旗標，改用統登流程。
export const AUTH_BYPASS = import.meta.env.VITE_AUTH_BYPASS === 'true'
const BYPASS_EMAIL = '統登使用者（開發預設）'

interface AuthState {
  loggedIn: boolean
  email: string | null
  checked: boolean
  login: (credential: string) => Promise<boolean>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  loggedIn: AUTH_BYPASS,
  email: AUTH_BYPASS ? BYPASS_EMAIL : null,
  checked: AUTH_BYPASS,

  async login(credential: string) {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential }),
      })
      if (!res.ok) return false
      const data = await res.json()
      set({ loggedIn: true, email: data.email, checked: true })
      return true
    } catch (err) {
      console.error('Login failed:', err)
      return false
    }
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } finally {
      set({ loggedIn: false, email: null, checked: true })
    }
  },

  async refresh() {
    if (AUTH_BYPASS) {
      set({ loggedIn: true, email: BYPASS_EMAIL, checked: true })
      return
    }
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      const data = await res.json()
      set({ loggedIn: !!data.loggedIn, email: data.email ?? null, checked: true })
    } catch (err) {
      console.warn('Failed to check login status:', err)
      set({ loggedIn: false, email: null, checked: true })
    }
  },
}))
