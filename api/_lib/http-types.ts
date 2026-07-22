import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * 最小化的 Vercel Node Function 型別（不依賴 @vercel/node，避免其龐大且含多個已知漏洞的
 * transitive dependency tree；欄位/方法皆由 Vercel 執行環境在部署時實際提供）。
 */
export interface VercelRequest extends IncomingMessage {
  query: Partial<Record<string, string | string[]>>
  cookies: Partial<Record<string, string>>
  body: unknown
}

export interface VercelResponse extends ServerResponse {
  send: (body: unknown) => VercelResponse
  json: (jsonBody: unknown) => VercelResponse
  status: (statusCode: number) => VercelResponse
}
