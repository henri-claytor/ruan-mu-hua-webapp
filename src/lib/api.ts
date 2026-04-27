/**
 * CMoney API Client
 * All requests are proxied via /api/proxy to avoid CORS issues.
 */

interface CMoneyResponse {
  Title: string[]
  Data: string[][]
}

const CMONEY_BASE =
  'https://www.cmoney.tw/MobileService/ashx/GetDtnoData.ashx'
const ACTION = 'Action=GetDtNoData&FilterNo=0'

/** Build a CMoney API URL */
function buildCMoneyUrl(dtNo: string, paramStr?: string): string {
  let url = `${CMONEY_BASE}?DtNo=${dtNo}&${ACTION}`
  if (paramStr) url += `&ParamStr=${paramStr}`
  return url
}

/** Fetch from CMoney via the Vercel Edge proxy */
async function fetchCMoney(dtNo: string, paramStr?: string): Promise<CMoneyResponse> {
  const cmUrl = buildCMoneyUrl(dtNo, paramStr)
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(cmUrl)}`
  const res = await fetch(proxyUrl)
  if (!res.ok) {
    throw new Error(`CMoney API error: ${res.status} ${res.statusText}`)
  }
  const json = await res.json()
  if (!Array.isArray(json.Title) || !Array.isArray(json.Data)) {
    throw new Error('Unexpected CMoney response shape')
  }
  return json as CMoneyResponse
}

/**
 * Parse a percentage string such as "5.87" → 0.0587
 * Returns NaN for unparseable values.
 */
export function parsePercentString(s: string): number {
  if (!s || s.trim() === '' || s.trim() === '--' || s.trim() === 'N/A') {
    return NaN
  }
  const cleaned = s.replace('%', '').trim()
  const n = parseFloat(cleaned)
  return isNaN(n) ? NaN : n / 100
}

/** Find the column index whose title contains the given keyword */
function findColumn(title: string[], keyword: string, fallback: number): number {
  const idx = title.findIndex((t) => t.includes(keyword))
  return idx >= 0 ? idx : fallback
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface StockItem {
  code: string
  name: string
}

/**
 * Fetch the full Taiwan stock list.
 * DtNo=133054167 — returns { Title, Data } where Data[i][0]=code, Data[i][1]=name
 */
export async function fetchStockList(): Promise<StockItem[]> {
  const data = await fetchCMoney('133054167')
  const codeIdx = findColumn(data.Title, '代號', 0)
  const nameIdx = findColumn(data.Title, '名稱', 1)
  return data.Data.map((row) => ({
    code: (row[codeIdx] ?? '').trim(),
    name: (row[nameIdx] ?? '').trim(),
  })).filter((s) => s.code !== '' && s.name !== '')
}

/**
 * Fetch monthly returns for a stock (DtNo=133066054).
 * Returns the latest 120 parsed values as decimal fractions (e.g. 0.0587).
 */
export async function fetchMonthlyReturns(code: string): Promise<number[]> {
  const data = await fetchCMoney('133066054', `AssignID=${code}`)
  const retIdx = findColumn(data.Title, '報酬', 1)
  const all = data.Data.map((row) => parsePercentString(row[retIdx] ?? '')).filter(
    (v) => !isNaN(v)
  )
  // Take the latest 120 records
  return all.slice(-120)
}

/**
 * Fetch daily returns for a stock (DtNo=133057193).
 * Returns all parsed values as decimal fractions.
 */
export async function fetchDailyReturns(code: string): Promise<number[]> {
  const data = await fetchCMoney('133057193', `AssignID=${code}`)
  const retIdx = findColumn(data.Title, '報酬', 1)
  return data.Data.map((row) => parsePercentString(row[retIdx] ?? '')).filter(
    (v) => !isNaN(v)
  )
}
