/**
 * 報酬率顯示格式 utility（台股「紅漲綠跌」慣例）
 *
 * 分類化小數規則：
 *   金額   → 0 位、千分位、含 ± 號（fmtMoney）
 *   百分比 → 1 位、含 ± 號（fmtPct，預設）
 *   勝率   → 0 位、無號（fmtWinRate）
 *   指標   → 2 位、無號（fmtRatio）
 *   萬元   → 1 位（fmtWan）
 */

export type ReturnColor = 'red' | 'green' | 'default'

/**
 * 永遠帶正負號的百分比格式化。預設 1 位小數。
 * @example
 *   fmtPct(0.123)       → "+12.3%"
 *   fmtPct(-0.045)      → "−4.5%"
 *   fmtPct(0)           → "0.0%"
 *   fmtPct(0.013253, 4) → "+1.3253%"
 */
export function fmtPct(n: number, digits = 1): string {
  if (n === 0 || !isFinite(n)) {
    return `${(0).toFixed(digits)}%`
  }
  const sign = n > 0 ? '+' : '−'
  return `${sign}${(Math.abs(n) * 100).toFixed(digits)}%`
}

/**
 * 勝率／敗率：0 位小數、無正負號。
 * @example fmtWinRate(0.6) → "60%"
 *          fmtWinRate(0.5833) → "58%"
 */
export function fmtWinRate(n: number): string {
  if (!isFinite(n)) return '—'
  return `${Math.round(n * 100)}%`
}

/**
 * 一般指標（賠率、PF、Hurst、D、Sharpe 等）：2 位小數、無號。
 * Infinity → '∞'。
 */
export function fmtRatio(n: number, digits = 2): string {
  if (!isFinite(n)) return '∞'
  return n.toFixed(digits)
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
 * 千分位 + 強制正負號的金額格式化（單位：元，預設 0 位小數）。
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

/**
 * 金額轉萬元（1 位小數）。
 * @example fmtWan(285000) → "28.5 萬"
 */
export function fmtWan(n: number): string {
  if (!isFinite(n)) return '∞'
  return `${(n / 10000).toFixed(1)} 萬`
}
