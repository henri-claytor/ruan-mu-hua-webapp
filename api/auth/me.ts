import type { VercelRequest, VercelResponse } from '../_lib/http-types'
import { getSession } from '../_lib/session'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await getSession(req)
  if (!session) {
    res.status(200).json({ loggedIn: false })
    return
  }
  res.status(200).json({ loggedIn: true, email: session.email })
}
