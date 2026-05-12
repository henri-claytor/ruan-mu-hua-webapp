/**
 * 報酬率顯示格式 utility（台股「紅漲綠跌」慣例）
 *
 * fmtPct: 永遠帶正負號，例如 +0.47% / −5.59% / 0.00%
 * colorByReturn: 依正負回傳 ResultCard 的 color prop
 */

export type ReturnColor = 'red' | 'green' | 'default'

/**
 * 永遠帶正負號的百分比格式化。
 * @example
 *   fmtPct(0.0047) → "+0.47%"
 *   fmtPct(-0.0559) → "−5.59%"
 *   fmtPct(0) → "0.00%"
 */
export function fmtPct(n: number, digits = 2): string {
  if (n === 0 || !isFinite(n)) {
    return `${(0).toFixed(digits)}%`
  }
  const sign = n > 0 ? '+' : '−'
  return `${sign}${(Math.abs(n) * 100).toFixed(digits)}%`
}

/**
 * 依報酬正負回傳 ResultCard 的 color prop。
 * 台股慣例：紅漲綠跌。
 */
export function colorByReturn(n: number): ReturnColor {
  if (n > 0) return 'red'
  if (n < 0) return 'green'
  return 'default'
}

/**
 * 千分位 + 強制正負號的金額格式化（單位：元）。
 * @example
 *   fmtMoney(139500) → "+139,500 元"
 *   fmtMoney(-5200)  → "−5,200 元"
 *   fmtMoney(0)      → "0 元"
 */
export function fmtMoney(n: number, digits = 0): string {
  if (n === 0 || !isFinite(n)) {
    return `${(0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })} 元`
  }
  const sign = n > 0 ? '+' : '−'
  const abs = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  return `${sign}${abs} 元`
}
