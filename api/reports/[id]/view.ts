import type { VercelRequest, VercelResponse } from '../../_lib/http-types'
import { requireMember } from '../../_lib/session'
import { resolveReportFile } from '../../_lib/reports'
import { getDriveFileContent } from '../../_lib/googleDrive'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireMember(req, res)
  if (!session) return

  const rawId = req.query.id
  const id = typeof rawId === 'string' ? rawId : undefined
  if (!id) {
    res.status(404).json({ error: 'Report not found' })
    return
  }

  try {
    // 依檔名在指定資料夾內解析出實際檔案；找不到即 404（也擋掉任意檔名探測）
    const file = await resolveReportFile(id)
    if (!file) {
      res.status(404).json({ error: 'Report not found' })
      return
    }

    const content = await getDriveFileContent(file.id)
    // 完整讀入再回傳：Drive 上游不提供 Content-Length，而 Chrome 的 PDF 檢視器需要它才肯渲染。
    // 研究報告檔案不大（數 MB 內），一次讀入可接受，也保證帶正確的 Content-Length。
    const buffer = Buffer.from(await content.arrayBuffer())
    const total = buffer.length

    const contentType = file.mimeType || 'application/octet-stream'
    // Chrome 的 PDF 檢視器會發 Range 請求載入 PDF；需宣告 Accept-Ranges 並正確回應 206，
    // 否則檢視器會渲染成空白頁（圖片則不受影響）。
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Content-Type', contentType)
    // inline：瀏覽器直接顯示，不觸發強制下載（使用者仍可用檢視器內建的另存新檔）
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`)
    // no-cache（可存但每次需重新驗證），不用 no-store——no-store 會讓 PDF 檢視器的二次 Range 請求失敗
    res.setHeader('Cache-Control', 'private, no-cache')

    const range = req.headers.range
    const m = range ? /^bytes=(\d+)-(\d*)$/.exec(range) : null
    if (m) {
      const start = parseInt(m[1], 10)
      const end = m[2] ? parseInt(m[2], 10) : total - 1
      if (Number.isNaN(start) || start >= total || end >= total || start > end) {
        res.setHeader('Content-Range', `bytes */${total}`)
        res.status(416).end()
        return
      }
      const chunk = buffer.subarray(start, end + 1)
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`)
      res.setHeader('Content-Length', String(chunk.length))
      res.status(206).send(chunk)
      return
    }

    res.setHeader('Content-Length', String(total))
    res.status(200).send(buffer)
  } catch (err) {
    console.error('Failed to fetch report from Drive:', err)
    res.status(502).json({ error: 'Failed to load report' })
  }
}
