import { GoogleAuth } from 'google-auth-library'

const DRIVE_READONLY_SCOPE = 'https://www.googleapis.com/auth/drive.readonly'

function getCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON env var')
  return JSON.parse(raw)
}

let cachedAuth: GoogleAuth | null = null

function getAuth(): GoogleAuth {
  if (!cachedAuth) {
    cachedAuth = new GoogleAuth({ credentials: getCredentials(), scopes: [DRIVE_READONLY_SCOPE] })
  }
  return cachedAuth
}

async function getAccessToken(): Promise<string> {
  const client = await getAuth().getClient()
  const { token } = await client.getAccessToken()
  if (!token) throw new Error('Failed to obtain Google access token')
  return token
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  createdTime: string
}

/** Drive 檔名的單引號需 escape，才能安全放進 files.list 的 q 查詢字串。 */
function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

/** 列出指定資料夾內所有未刪除的檔案（依檔名遞減排序，讓 YYYYMMDD 前綴的新報告在前）。 */
export async function listFolderFiles(folderId: string): Promise<DriveFile[]> {
  const token = await getAccessToken()
  const q = `'${escapeQueryValue(folderId)}' in parents and trashed = false`
  const params = new URLSearchParams({
    q,
    fields: 'files(id,name,mimeType,createdTime)',
    orderBy: 'name desc',
    pageSize: '1000',
  })
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Drive list failed: ${res.status}`)
  const data = (await res.json()) as { files?: DriveFile[] }
  return data.files ?? []
}

/**
 * 依檔名在指定資料夾內找檔案。回傳 null 表示找不到。
 * 以「資料夾 + 檔名」雙條件查詢，確保只會命中該資料夾內的檔案，
 * 呼叫端不需（也不能）自行傳入雲端硬碟的 fileId。
 */
export async function findFileByNameInFolder(folderId: string, name: string): Promise<DriveFile | null> {
  const token = await getAccessToken()
  const q = `name = '${escapeQueryValue(name)}' and '${escapeQueryValue(folderId)}' in parents and trashed = false`
  const params = new URLSearchParams({
    q,
    fields: 'files(id,name,mimeType,createdTime)',
    pageSize: '1',
  })
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Drive lookup failed: ${res.status}`)
  const data = (await res.json()) as { files?: DriveFile[] }
  return data.files?.[0] ?? null
}

/** 回傳檔案內容的 fetch Response，呼叫端負責把 body 串流轉發給客戶端。 */
export async function getDriveFileContent(fileId: string): Promise<Response> {
  const token = await getAccessToken()
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) throw new Error(`Drive content fetch failed: ${res.status}`)
  return res
}
