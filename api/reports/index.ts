import type { VercelRequest, VercelResponse } from '../_lib/http-types'
import { requireMember } from '../_lib/session'
import { listReports } from '../_lib/reports'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireMember(req, res)
  if (!session) return

  try {
    const reports = await listReports()
    res.status(200).json({ reports })
  } catch (err) {
    console.error('Failed to list reports:', err)
    res.status(502).json({ error: 'Failed to list reports' })
  }
}
