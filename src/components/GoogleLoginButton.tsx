import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/useAuthStore'

interface GoogleIdConfig {
  client_id: string
  callback: (response: { credential: string }) => void
}

interface GoogleId {
  initialize: (config: GoogleIdConfig) => void
  renderButton: (parent: HTMLElement, options: Record<string, string>) => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } }
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined

export default function GoogleLoginButton() {
  const buttonRef = useRef<HTMLDivElement>(null)
  const login = useAuthStore((s) => s.login)

  useEffect(() => {
    if (!CLIENT_ID) {
      console.warn('VITE_GOOGLE_OAUTH_CLIENT_ID 未設定，登入按鈕無法顯示')
      return
    }

    let cancelled = false

    function renderButton() {
      if (cancelled || !window.google || !buttonRef.current) return
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID as string,
        callback: (response) => {
          void login(response.credential)
        },
      })
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'medium',
        text: 'signin_with',
      })
    }

    if (window.google) {
      renderButton()
      return () => {
        cancelled = true
      }
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = renderButton
    document.head.appendChild(script)

    return () => {
      cancelled = true
      script.onload = null
    }
  }, [login])

  if (!CLIENT_ID) return null

  return <div ref={buttonRef} />
}
