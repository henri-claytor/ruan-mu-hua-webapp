import type { VercelRequest, VercelResponse } from '../_lib/http-types'
import { OAuth2Client } from 'google-auth-library'
import { createSessionCookie } from '../_lib/session'

const client = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const body = (req.body ?? {}) as { credential?: unknown }
  const { credential } = body
  if (typeof credential !== 'string' || !credential) {
    res.status(400).json({ error: 'Missing credential' })
    return
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    if (!payload?.email) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }

    const cookie = await createSessionCookie(payload.email)
    res.setHeader('Set-Cookie', cookie)
    res.status(200).json({ email: payload.email })
  } catch (err) {
    console.error('Google ID token verification failed:', err)
    res.status(401).json({ error: 'Invalid token' })
  }
}
