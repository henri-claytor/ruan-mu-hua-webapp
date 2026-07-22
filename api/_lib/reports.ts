import { listFolderFiles, findFileByNameInFolder, type DriveFile } from './googleDrive'

export interface ReportSummary {
  /** 前端用來組 view 連結的識別碼；這裡用檔名，view 端點再依檔名在資料夾內解析出實際 fileId。 */
  id: string
  title: string
  date: string
  /** 讓前端選對的檢視元件：圖片用 <img>，其餘（PDF）用內嵌 iframe。 */
  kind: 'image' | 'pdf'
}

function getFolderId(): string {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!folderId) throw new Error('Missing GOOGLE_DRIVE_FOLDER_ID env var')
  return folderId
}

/**
 * 從檔名解析標題與日期。
 * 命名規則：`日期-標題.副檔名`，日期為 8 位數 `YYYYMMDD` 或帶連字號 `YYYY-MM-DD`，
 * 之後接一個分隔符（- _ 空白）再接標題。例：
 *   `20260721-立隆電.pdf`   → { date: '2026-07-21', title: '立隆電' }
 *   `2026-07-21-立隆電.pdf` → { date: '2026-07-21', title: '立隆電' }
 * 若檔名不符規則（無日期前綴），date 留空、title 用去副檔名後的整個檔名。
 */
export function parseFileName(name: string): { title: string; date: string } {
  const base = name.replace(/\.[^./\\]+$/, '') // 去副檔名
  const m = base.match(/^(\d{4})-?(\d{2})-?(\d{2})[-_\s]+(.+)$/)
  if (m) {
    const title = m[4].trim()
    if (title) return { date: `${m[1]}-${m[2]}-${m[3]}`, title }
  }
  return { date: '', title: base }
}

/** 列出資料夾內所有報告的摘要（不含 fileId）。 */
export async function listReports(): Promise<ReportSummary[]> {
  const files = await listFolderFiles(getFolderId())
  return files.map((f) => {
    const { title, date } = parseFileName(f.name)
    const kind: 'image' | 'pdf' = f.mimeType?.startsWith('image/') ? 'image' : 'pdf'
    return { id: f.name, title, date, kind }
  })
}

/** 依前端傳來的 id（= 檔名）解析出對應的 Drive 檔案；找不到回傳 null。 */
export async function resolveReportFile(id: string): Promise<DriveFile | null> {
  return findFileByNameInFolder(getFolderId(), id)
}
