/**
 * 交易紀錄 CSV 解析 / 格式化
 *
 * 必填欄位：6 個（stock_id, buy_date, sell_date, buy_amount, sell_amount, shares）
 * 選填欄位：6 個（stock_name, buy_price, sell_price, pnl, return_rate, note）— 缺則自動推算
 *
 * 嚴格驗證：日期必須 YYYY-MM-DD、缺必填欄位即報錯。
 * 註解行（# 開頭）與空白行跳過。
 *
 * 向下相容：舊版 12 欄 CSV 仍可讀，提供值優先於推算。
 */

import type { Trade } from './trade'

const HEADER = [
  'stock_id',
  'stock_name',
  'buy_date',
  'sell_date',
  'buy_price',
  'sell_price',
  'shares',
  'buy_amount',
  'sell_amount',
  'pnl',
  'return_rate',
  'note',
]

const REQUIRED_HEADER = [
  'stock_id',
  'buy_date',
  'sell_date',
  'buy_amount',
  'sell_amount',
  'shares',
]

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export interface ParseResult {
  trades: Trade[]
  errors: string[]
}

// ── CSV 解析 ──────────────────────────────────────────────────────────────────

/**
 * 簡易 CSV 行解析（支援雙引號內含逗號）。
 */
function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

/** 解析單一數值欄位，去除千分位逗號與貨幣符號。 */
function parseNumber(s: string): number {
  if (!s || s.trim() === '' || s.trim() === '--') return NaN
  const cleaned = s.replace(/[,$￥%\s]/g, '')
  return parseFloat(cleaned)
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 解析 CSV 文字內容為 Trade 陣列。
 * 第一行必須為 header，其餘行依序解析。
 * 註解行（# 開頭）與空白行跳過，計入錯誤摘要。
 */
export function parseTradesCSV(text: string): ParseResult {
  const lines = text.split(/\r?\n/)
  const errors: string[] = []
  const trades: Trade[] = []

  if (lines.length === 0) {
    errors.push('CSV 檔案為空')
    return { trades, errors }
  }

  // Parse header
  const headerLine = lines[0].trim()
  if (!headerLine) {
    errors.push('第 1 行 (header) 為空')
    return { trades, errors }
  }
  const headers = splitCSVLine(headerLine).map((h) => h.toLowerCase().trim())
  for (const required of REQUIRED_HEADER) {
    if (!headers.includes(required)) {
      errors.push(`Header 缺少必要欄位「${required}」`)
    }
  }
  if (errors.length > 0) return { trades, errors }

  // Build column index map
  const idx = (col: string) => headers.indexOf(col)
  const has = (col: string) => idx(col) >= 0
  const cellOpt = (cells: string[], col: string): string => {
    const i = idx(col)
    return i >= 0 ? (cells[i]?.trim() ?? '') : ''
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i]
    const trimmed = raw.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#')) continue

    const cells = splitCSVLine(raw)
    const lineNo = i + 1

    // ── 必填 ──
    const stockId = cellOpt(cells, 'stock_id')
    const buyDate = cellOpt(cells, 'buy_date')
    const sellDate = cellOpt(cells, 'sell_date')

    if (!stockId) {
      errors.push(`第 ${lineNo} 行：stock_id 不可為空`)
      continue
    }
    if (!DATE_PATTERN.test(buyDate)) {
      errors.push(`第 ${lineNo} 行：buy_date 格式錯誤（需 YYYY-MM-DD），收到「${buyDate}」`)
      continue
    }
    if (!DATE_PATTERN.test(sellDate)) {
      errors.push(`第 ${lineNo} 行：sell_date 格式錯誤（需 YYYY-MM-DD），收到「${sellDate}」`)
      continue
    }
    if (sellDate < buyDate) {
      errors.push(`第 ${lineNo} 行：sell_date (${sellDate}) 早於 buy_date (${buyDate})`)
      continue
    }

    const buyAmount = parseNumber(cellOpt(cells, 'buy_amount'))
    const sellAmount = parseNumber(cellOpt(cells, 'sell_amount'))
    const shares = parseNumber(cellOpt(cells, 'shares'))

    const requiredNumChecks: { key: string; value: number }[] = [
      { key: 'buy_amount', value: buyAmount },
      { key: 'sell_amount', value: sellAmount },
      { key: 'shares', value: shares },
    ]
    let badField: string | null = null
    for (const c of requiredNumChecks) {
      if (isNaN(c.value)) {
        badField = c.key
        break
      }
    }
    if (badField) {
      errors.push(`第 ${lineNo} 行：${badField} 不是有效數值`)
      continue
    }

    // ── 選填（有則用、無則推算） ──
    const stockName = has('stock_name') && cellOpt(cells, 'stock_name')
      ? cellOpt(cells, 'stock_name')
      : stockId

    let buyPrice = has('buy_price') ? parseNumber(cellOpt(cells, 'buy_price')) : NaN
    if (isNaN(buyPrice)) buyPrice = shares > 0 ? buyAmount / shares : 0

    let sellPrice = has('sell_price') ? parseNumber(cellOpt(cells, 'sell_price')) : NaN
    if (isNaN(sellPrice)) sellPrice = shares > 0 ? sellAmount / shares : 0

    let pnl = has('pnl') ? parseNumber(cellOpt(cells, 'pnl')) : NaN
    if (isNaN(pnl)) pnl = sellAmount - buyAmount

    let returnRate = has('return_rate') ? parseNumber(cellOpt(cells, 'return_rate')) : NaN
    if (isNaN(returnRate)) returnRate = buyAmount > 0 ? pnl / buyAmount : 0

    // 報酬率自動偵測：> 1 視為百分比格式（如 24.03 → 0.2403）
    if (Math.abs(returnRate) > 1) {
      returnRate = returnRate / 100
    }

    const note = has('note') && cellOpt(cells, 'note') ? cellOpt(cells, 'note') : undefined

    trades.push({
      id: makeId(),
      stockId,
      stockName,
      buyDate,
      sellDate,
      buyPrice,
      sellPrice,
      shares: Math.round(shares),
      buyAmount,
      sellAmount,
      pnl,
      returnRate,
      note,
    })
  }

  return { trades, errors }
}

// ── CSV 格式化（匯出） ────────────────────────────────────────────────────────

/** 轉成 CSV 字串。日期、note 用雙引號包住，其餘數值不包。 */
export function formatTradesCSV(trades: Trade[]): string {
  const escape = (s: string) =>
    /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s

  const lines: string[] = [HEADER.join(',')]
  for (const t of trades) {
    const row = [
      escape(t.stockId),
      escape(t.stockName),
      t.buyDate,
      t.sellDate,
      String(t.buyPrice),
      String(t.sellPrice),
      String(t.shares),
      String(t.buyAmount),
      String(t.sellAmount),
      String(t.pnl),
      String(t.returnRate),
      t.note ? escape(t.note) : '',
    ]
    lines.push(row.join(','))
  }
  return lines.join('\n')
}

/** 範例 CSV（給空態下載連結使用）— 6 欄精簡版。 */
export const EXAMPLE_CSV = `stock_id,buy_date,sell_date,buy_amount,sell_amount,shares
2330,2025-03-15,2025-09-20,580500,720000,1000
2317,2025-04-01,2025-07-15,330000,317000,2000
0050,2025-01-10,2026-01-10,405000,444600,3000
`
