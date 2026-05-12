/**
 * 交易紀錄資料模型 + 整體績效指標計算
 *
 * 與既有 EV/VaR/Hurst 不同：本模組基於使用者實際完成交易（已實現損益），
 * 計算勝率、賠率、獲利因子等「事後反思」型指標。
 */

// ── 資料模型 ──────────────────────────────────────────────────────────────────

export interface Trade {
  id: string                  // crypto.randomUUID()
  stockId: string             // "2330"
  stockName: string           // "台積電"
  buyDate: string             // ISO 'YYYY-MM-DD'
  sellDate: string            // ISO 'YYYY-MM-DD'
  buyPrice: number            // 買進均價
  sellPrice: number           // 賣出均價
  shares: number              // 股數
  buyAmount: number           // 買進價金（含手續費）
  sellAmount: number          // 賣出價金（扣除費用）
  pnl: number                 // 實現損益（元）
  returnRate: number          // 報酬率（小數，如 0.0587 = 5.87%）
  note?: string               // 備註（選填）
}

export type PerformanceQuadrant =
  | 'Q1: 打法好・結果好'
  | 'Q2: 打法差・結果好（靠重倉或勝率撐場）'
  | 'Q3: 打法好・結果差（資金管理需改善）'
  | 'Q4: 打法差・結果差（全面檢討）'
  | '單向紀錄（全勝或全敗）'

export interface PortfolioPerformance {
  // 期間
  periodStart: string  // min(buyDate)
  periodEnd: string    // max(sellDate)

  // 計數
  nTrades: number
  nWins: number
  nLosses: number
  nFlat: number

  // 報酬
  totalPnl: number
  totalInvested: number
  overallReturn: number
  annualizedReturn: number

  // 勝率與打法
  winRate: number
  payoffRatio: number
  profitFactor: number

  // 期望值
  expectedValue: number
  expectedReturnRate: number

  // 平均
  avgWinPnl: number
  avgLossPnl: number          // 負值
  avgWinReturnRate: number
  avgLossReturnRate: number   // 負值

  // 風險
  maxWinPnl: number
  maxLossPnl: number          // 負值
  maxDrawdown: number         // 負值或 0
  maxDrawdownPct: number      // 比例（負值或 0）

  // 持有期間
  avgHoldingDays: number
  maxHoldingDays: number
  minHoldingDays: number

  // 分類
  quadrant: PerformanceQuadrant
}

// ── 工具函式 ──────────────────────────────────────────────────────────────────

/** 計算兩個 ISO 日期字串之間的天數差（含尾不含頭，sellDate − buyDate）。 */
export function daysBetween(buyDate: string, sellDate: string): number {
  const b = new Date(buyDate + 'T00:00:00Z').getTime()
  const s = new Date(sellDate + 'T00:00:00Z').getTime()
  return Math.round((s - b) / 86400000)
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

// ── 4 象限分類 ───────────────────────────────────────────────────────────────

const PAYOFF_THRESHOLD = 1.5
const PROFIT_FACTOR_THRESHOLD = 2.0

/**
 * 賠率 × 獲利因子的 5 象限分類。
 * - 全勝（nWins > 0 且 nLosses === 0）或全敗（nWins === 0 且 nLosses > 0）→ 單向紀錄
 * - 否則依 4 象限規則（Infinity 視為高）
 * 若未提供 nWins / nLosses 則沿用舊 4 象限邏輯（向後相容）。
 */
export function classifyPerformanceQuadrant(
  payoffRatio: number,
  profitFactor: number,
  nWins?: number,
  nLosses?: number,
): PerformanceQuadrant {
  // 先判斷單向紀錄
  if (nWins !== undefined && nLosses !== undefined) {
    if (nWins > 0 && nLosses === 0) return '單向紀錄（全勝或全敗）'
    if (nWins === 0 && nLosses > 0) return '單向紀錄（全勝或全敗）'
  }

  const payoffHigh = !isFinite(payoffRatio) || payoffRatio >= PAYOFF_THRESHOLD
  const pfHigh = !isFinite(profitFactor) || profitFactor >= PROFIT_FACTOR_THRESHOLD

  if (payoffHigh && pfHigh) return 'Q1: 打法好・結果好'
  if (!payoffHigh && pfHigh) return 'Q2: 打法差・結果好（靠重倉或勝率撐場）'
  if (payoffHigh && !pfHigh) return 'Q3: 打法好・結果差（資金管理需改善）'
  return 'Q4: 打法差・結果差（全面檢討）'
}

// ── 主要計算函式 ──────────────────────────────────────────────────────────────

// ── 持有天數分佈 ──────────────────────────────────────────────────────────────

export interface HoldingDaysBucket {
  bucket: string          // 顯示標籤，如「0-7 天」
  minDays: number         // 包含
  maxDays: number         // 包含
  wins: number            // 勝場數
  losses: number          // 敗場數
  avgWinReturn: number    // 此桶內勝場平均報酬率
  avgLossReturn: number   // 此桶內敗場平均報酬率（負值）
}

const HOLDING_DAYS_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: '0-7 天',   min: 0,  max: 7 },
  { label: '8-14 天',  min: 8,  max: 14 },
  { label: '15-30 天', min: 15, max: 30 },
  { label: '31-60 天', min: 31, max: 60 },
  { label: '61-90 天', min: 61, max: 90 },
  { label: '90+ 天',   min: 91, max: Infinity },
]

/**
 * 將交易依持有天數分到 6 個固定桶，每桶分別計算勝敗場數與平均報酬率。
 */
export function holdingDaysHistogram(trades: Trade[]): HoldingDaysBucket[] {
  return HOLDING_DAYS_BUCKETS.map(({ label, min, max }) => {
    const bucketTrades = trades.filter((t) => {
      const d = daysBetween(t.buyDate, t.sellDate)
      return d >= min && d <= max
    })
    const wins = bucketTrades.filter((t) => t.pnl > 0)
    const losses = bucketTrades.filter((t) => t.pnl < 0)
    return {
      bucket: label,
      minDays: min,
      maxDays: max,
      wins: wins.length,
      losses: losses.length,
      avgWinReturn: average(wins.map((t) => t.returnRate)),
      avgLossReturn: average(losses.map((t) => t.returnRate)),
    }
  })
}

// ── 個股層級統計 ──────────────────────────────────────────────────────────────

export interface StockStats {
  stockId: string
  stockName: string
  nTrades: number
  nWins: number
  nLosses: number
  winRate: number
  avgWinReturnRate: number
  avgLossReturnRate: number    // 負值
  payoffRatio: number           // Infinity if no losses
  totalWinPnl: number
  totalLossPnl: number          // 負值
  profitFactor: number          // Infinity if no losses
  totalPnl: number
  pnlContribution: number       // stockTotalPnl / totalPortfolioPnl（可正可負）
  avgHoldingDays: number
  quadrant: PerformanceQuadrant
}

/**
 * 對單一股票計算 StockStats。
 * @param trades 整體 trades 陣列（會內部過濾 stockId）
 * @param stockId 目標股票代號
 * @param totalPortfolioPnl 整體組合總損益（用於 pnlContribution）
 */
export function calcStockStats(
  trades: Trade[],
  stockId: string,
  totalPortfolioPnl: number,
): StockStats | null {
  const subset = trades.filter((t) => t.stockId === stockId)
  if (subset.length === 0) return null

  // 取最早（依 sellDate 升序）的一筆當作 stockName 來源
  const sortedBySell = [...subset].sort((a, b) =>
    a.sellDate < b.sellDate ? -1 : a.sellDate > b.sellDate ? 1 : 0,
  )
  const stockName = sortedBySell[0].stockName

  const wins = subset.filter((t) => t.pnl > 0)
  const losses = subset.filter((t) => t.pnl < 0)
  const n = subset.length
  const nWins = wins.length
  const nLosses = losses.length
  const winRate = nWins / n

  const avgWinReturnRate = average(wins.map((t) => t.returnRate))
  const avgLossReturnRate = average(losses.map((t) => t.returnRate)) // 負值
  const payoffRatio =
    avgLossReturnRate < 0
      ? avgWinReturnRate / Math.abs(avgLossReturnRate)
      : Infinity

  const totalWinPnl = wins.reduce((s, t) => s + t.pnl, 0)
  const totalLossPnl = losses.reduce((s, t) => s + t.pnl, 0)
  const profitFactor = totalLossPnl < 0 ? totalWinPnl / Math.abs(totalLossPnl) : Infinity

  const totalPnl = subset.reduce((s, t) => s + t.pnl, 0)
  const pnlContribution = totalPortfolioPnl !== 0 ? totalPnl / totalPortfolioPnl : 0

  const avgHoldingDays = average(subset.map((t) => daysBetween(t.buyDate, t.sellDate)))

  const quadrant = classifyPerformanceQuadrant(payoffRatio, profitFactor, wins.length, losses.length)

  return {
    stockId,
    stockName,
    nTrades: n,
    nWins,
    nLosses,
    winRate,
    avgWinReturnRate,
    avgLossReturnRate,
    payoffRatio,
    totalWinPnl,
    totalLossPnl,
    profitFactor,
    totalPnl,
    pnlContribution,
    avgHoldingDays,
    quadrant,
  }
}

/**
 * 計算所有有交易的個股的 StockStats，依 |totalPnl| 降序排列。
 */
export function calcAllStockStats(trades: Trade[]): StockStats[] {
  if (trades.length === 0) return []
  const totalPortfolioPnl = trades.reduce((s, t) => s + t.pnl, 0)
  const uniqueIds = Array.from(new Set(trades.map((t) => t.stockId)))
  const result: StockStats[] = []
  for (const id of uniqueIds) {
    const stats = calcStockStats(trades, id, totalPortfolioPnl)
    if (stats) result.push(stats)
  }
  result.sort((a, b) => Math.abs(b.totalPnl) - Math.abs(a.totalPnl))
  return result
}

// ── 整體組合計算 ──────────────────────────────────────────────────────────────

export function calcPortfolioPerformance(trades: Trade[]): PortfolioPerformance | null {
  const n = trades.length
  if (n === 0) return null

  const wins = trades.filter((t) => t.pnl > 0)
  const losses = trades.filter((t) => t.pnl < 0)
  const flats = trades.filter((t) => t.pnl === 0)

  // 計數
  const nWins = wins.length
  const nLosses = losses.length
  const nFlat = flats.length
  const winRate = nWins / n

  // 損益
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0)
  const totalInvested = trades.reduce((s, t) => s + t.buyAmount, 0)
  const overallReturn = totalInvested > 0 ? totalPnl / totalInvested : 0

  // 期間
  const buyDates = trades.map((t) => t.buyDate).sort()
  const sellDates = trades.map((t) => t.sellDate).sort()
  const periodStart = buyDates[0]
  const periodEnd = sellDates[sellDates.length - 1]
  const operationDays = daysBetween(periodStart, periodEnd) + 1
  const annualizedReturn =
    operationDays > 0 && totalInvested > 0
      ? Math.pow(Math.max(1 + overallReturn, 0.01), 365 / operationDays) - 1
      : 0

  // 平均盈虧
  const avgWinPnl = average(wins.map((t) => t.pnl))
  const avgLossPnl = average(losses.map((t) => t.pnl)) // 負值
  const avgWinReturnRate = average(wins.map((t) => t.returnRate))
  const avgLossReturnRate = average(losses.map((t) => t.returnRate)) // 負值

  // 賠率
  const payoffRatio =
    avgLossReturnRate < 0
      ? avgWinReturnRate / Math.abs(avgLossReturnRate)
      : Infinity

  // 獲利因子
  const sumWinPnl = wins.reduce((s, t) => s + t.pnl, 0)
  const sumLossPnl = losses.reduce((s, t) => s + t.pnl, 0) // 負值
  const profitFactor = sumLossPnl < 0 ? sumWinPnl / Math.abs(sumLossPnl) : Infinity

  // 期望值
  const lossRate = nLosses / n
  const expectedValue = winRate * avgWinPnl + lossRate * avgLossPnl
  const expectedReturnRate = winRate * avgWinReturnRate + lossRate * avgLossReturnRate

  // 風險
  const maxWinPnl = wins.length > 0 ? Math.max(...wins.map((t) => t.pnl)) : 0
  const maxLossPnl = losses.length > 0 ? Math.min(...losses.map((t) => t.pnl)) : 0

  // 最大回撤（依 sellDate 升序排）
  const sortedBySell = [...trades].sort((a, b) =>
    a.sellDate < b.sellDate ? -1 : a.sellDate > b.sellDate ? 1 : 0,
  )
  let cum = 0
  let runningMax = 0
  let maxDrawdown = 0
  let runningMaxAtTrough = 0
  for (const t of sortedBySell) {
    cum += t.pnl
    if (cum > runningMax) runningMax = cum
    const dd = cum - runningMax
    if (dd < maxDrawdown) {
      maxDrawdown = dd
      runningMaxAtTrough = runningMax
    }
  }
  const maxDrawdownPct = runningMaxAtTrough > 0 ? maxDrawdown / runningMaxAtTrough : 0

  // 持有期間
  const holdingDays = trades.map((t) => daysBetween(t.buyDate, t.sellDate))
  const avgHoldingDays = average(holdingDays)
  const maxHoldingDays = Math.max(...holdingDays)
  const minHoldingDays = Math.min(...holdingDays)

  // 5 象限（全勝/全敗 → 單向紀錄）
  const quadrant = classifyPerformanceQuadrant(payoffRatio, profitFactor, nWins, nLosses)

  return {
    periodStart,
    periodEnd,
    nTrades: n,
    nWins,
    nLosses,
    nFlat,
    totalPnl,
    totalInvested,
    overallReturn,
    annualizedReturn,
    winRate,
    payoffRatio,
    profitFactor,
    expectedValue,
    expectedReturnRate,
    avgWinPnl,
    avgLossPnl,
    avgWinReturnRate,
    avgLossReturnRate,
    maxWinPnl,
    maxLossPnl,
    maxDrawdown,
    maxDrawdownPct,
    avgHoldingDays,
    maxHoldingDays,
    minHoldingDays,
    quadrant,
  }
}
