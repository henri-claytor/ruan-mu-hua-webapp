import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { devApi } from './server/devApi'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 讓本機 dev-api 讀得到 .env.local 內的後端機密（非 VITE_ 前綴不會自動進 process.env）
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of [
    'GOOGLE_OAUTH_CLIENT_ID',
    'GOOGLE_SERVICE_ACCOUNT_JSON',
    'SESSION_JWT_SECRET',
    'GOOGLE_DRIVE_FOLDER_ID',
    'AUTH_BYPASS',
  ]) {
    if (env[key]) process.env[key] = env[key]
  }

  return {
    plugins: [react(), tailwindcss(), devApi()],
    server: {
      port: Number(process.env.PORT) || 5173,
    },
  }
})
