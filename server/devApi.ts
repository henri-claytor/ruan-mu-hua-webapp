import type { Plugin, ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * 開發用外掛：讓 `npm run dev`（Vite）能直接執行 `api/` 底下的 serverless handler。
 * 正式環境由 Vercel 執行這些函式，本外掛僅在本機開發時模擬其請求/回應介面。
 * 只攔截本專案定義的 API 路由，其餘一律交還給 Vite。
 */

interface Route {
  test: (path: string, method: string) => Record<string, string> | null
  module: string
}

const ROUTES: Route[] = [
  { test: (p, m) => (p === '/api/auth/session' && m === 'POST' ? {} : null), module: '/api/auth/session.ts' },
  { test: (p) => (p === '/api/auth/me' ? {} : null), module: '/api/auth/me.ts' },
  { test: (p, m) => (p === '/api/auth/logout' && m === 'POST' ? {} : null), module: '/api/auth/logout.ts' },
  { test: (p) => (p === '/api/reports' ? {} : null), module: '/api/reports/index.ts' },
  {
    test: (p) => {
      const m = p.match(/^\/api\/reports\/([^/]+)\/view$/)
      return m ? { id: decodeURIComponent(m[1]) } : null
    },
    module: '/api/reports/[id]/view.ts',
  },
]

function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => {
      if (!data) return resolve({})
      try {
        resolve(JSON.parse(data))
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

function decorateRes(res: ServerResponse) {
  const r = res as ServerResponse & {
    status: (c: number) => typeof r
    json: (b: unknown) => typeof r
    send: (b: unknown) => typeof r
  }
  r.status = (c: number) => {
    r.statusCode = c
    return r
  }
  r.json = (b: unknown) => {
    if (!r.headersSent) r.setHeader('Content-Type', 'application/json; charset=utf-8')
    r.end(JSON.stringify(b))
    return r
  }
  r.send = (b: unknown) => {
    if (typeof b === 'string' || Buffer.isBuffer(b)) r.end(b)
    else r.json(b)
    return r
  }
  return r
}

export function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url
        if (!url || !url.startsWith('/api/')) return next()

        const parsed = new URL(url, 'http://localhost')
        const method = req.method ?? 'GET'
        let matched: { params: Record<string, string>; module: string } | null = null
        for (const route of ROUTES) {
          const params = route.test(parsed.pathname, method)
          if (params) {
            matched = { params, module: route.module }
            break
          }
        }
        if (!matched) return next()

        try {
          const query: Record<string, string> = { ...matched.params }
          parsed.searchParams.forEach((v, k) => (query[k] = v))

          const vreq = req as IncomingMessage & {
            query: Record<string, string>
            cookies: Record<string, string>
            body: unknown
          }
          vreq.query = query
          vreq.cookies = parseCookies(req.headers.cookie)
          vreq.body = method === 'POST' ? await readBody(req) : {}

          const mod = await server.ssrLoadModule(matched.module)
          await (mod.default as (rq: unknown, rs: unknown) => unknown)(vreq, decorateRes(res))
        } catch (err) {
          server.config.logger.error(`[dev-api] ${parsed.pathname} 失敗: ${String(err)}`)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'dev-api handler error' }))
          }
        }
      })
    },
  }
}
