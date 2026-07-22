import type { VercelRequest, VercelResponse } from './http-types'
import { SignJWT, jwtVerify } from 'jose'

const SESSION_COOKIE = 'session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 天

function getSecret() {
  const secret = process.env.SESSION_JWT_SECRET
  if (!secret) throw new Error('Missing SESSION_JWT_SECRET env var')
  return new TextEncoder().encode(secret)
}

/**
 * 會員資格判斷擴充點。目前無付費機制，任何通過 Google 登入驗證的 email 皆視為會員。
 * 未來要加白名單限制時，只需修改這個函式，不用動登入或 session 機制。
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- 目前恆為 true，未來加白名單時會用到這個參數
export function isAuthorized(_email: string): boolean {
  return true
}

// 本機 http 開發時瀏覽器會拒絕帶 Secure 的 cookie；僅在正式環境（https）加 Secure。
const SECURE_ATTR = process.env.NODE_ENV === 'production' ? '; Secure' : ''

export async function createSessionCookie(email: string): Promise<string> {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret())

  return `${SESSION_COOKIE}=${token}; HttpOnly${SECURE_ATTR}; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly${SECURE_ATTR}; SameSite=Lax; Path=/; Max-Age=0`
}

export interface Session {
  email: string
}

export async function getSession(req: VercelRequest): Promise<Session | null> {
  const token = req.cookies?.[SESSION_COOKIE]
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (typeof payload.email !== 'string') return null
    return { email: payload.email }
  } catch {
    return null
  }
}

/**
 * 驗證登入與會員資格；未通過時直接寫入 401 回應並回傳 null。
 * 呼叫端收到 null 時應立即 return，不再繼續處理。
 */
export async function requireMember(req: VercelRequest, res: VercelResponse): Promise<Session | null> {
  // 開發過渡：統登（CMoney OIDC）尚未接。AUTH_BYPASS=true 時預設「使用者已通過統登」直接放行。
  // 接統登後移除此段，改在這裡驗證統登發的 token / session。
  if (process.env.AUTH_BYPASS === 'true') {
    return { email: 'bypass@statuslogin.dev' }
  }

  const session = await getSession(req)
  if (!session || !isAuthorized(session.email)) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  return session
}
