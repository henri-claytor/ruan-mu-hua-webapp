/**
 * Vercel Edge Function — CMoney API Proxy
 * Forwards requests to CMoney to avoid CORS issues in the browser.
 * Only allows requests to https://www.cmoney.tw/
 */

export const config = { runtime: 'edge' }

const CMONEY_ORIGIN = 'https://www.cmoney.tw'

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(targetUrl)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (parsedUrl.origin !== CMONEY_ORIGIN) {
    return new Response(JSON.stringify({ error: 'Only CMoney URLs are allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RuanMuHua/1.0)',
        Accept: 'application/json, text/plain, */*',
      },
    })

    const body = await upstream.text()

    return new Response(body, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
