import { average } from './utils'
import { calcPortfolioReturns } from './portfolio'

export type Quadrant =
  | '高賠率正期望值（最佳）'
  | '低賠率正期望值（勝率驅動）'
  | '高賠率負期望值（賠率驅動但勝率不足）'
  | '低賠率負期望值（避免）'

export interface EVResult {
  winRate: number      // 0–1
  lossRate: number     // 0–1
  avgGain: number      // average of positive returns
  avgLoss: number      // average of absolute negative returns（正值）
  ev: number           // expected value（單期）
  actualOdds: number   // avgGain / avgLoss
  breakEvenOdds: number // lossRate / winRate
  quadrant: Quadrant
}

export function calcEV(returns: number[]): EVResult {
  const gains = returns.filter((r) => r > 0)
  const losses = returns.filter((r) => r < 0)
  const n = returns.length

  const winRate = gains.length / n
  const lossRate = losses.length / n
  const avgGain = gains.length > 0 ? average(gains) : 0
  const avgLoss = losses.length > 0 ? Math.abs(average(losses)) : 0

  const ev = winRate * avgGain - lossRate * avgLoss
  const actualOdds = avgLoss > 0 ? avgGain / avgLoss : 0
  const breakEvenOdds = winRate > 0 ? lossRate / winRate : 0

  let quadrant: Quadrant
  if (ev > 0 && actualOdds > breakEvenOdds) {
    quadrant = '高賠率正期望值（最佳）'
  } else if (ev > 0) {
    quadrant = '低賠率正期望值（勝率驅動）'
  } else if (actualOdds > breakEvenOdds) {
    quadrant = '高賠率負期望值（賠率驅動但勝率不足）'
  } else {
    quadrant = '低賠率負期望值（避免）'
  }

  return { winRate, lossRate, avgGain, avgLoss, ev, actualOdds, breakEvenOdds, quadrant }
}

// ── Multi-scale EV（年化版） ──────────────────────────────────────────────────
//
// 短期：日報酬 60 筆（≈3 個月）→ 年化 252
// 中期：月報酬 36 筆（3 年）→ 年化 12
// 長期：月報酬全部（5–10 年）→ 年化 12
//
// 三尺度年化 EV 數量級對齊（年化報酬 %），可直接比較。

export type EVDivergence =
  | 'stable'
  | 'short-improving'
  | 'short-deteriorating'
  | 'mixed'

export interface ScaleEV {
  ev: EVResult
  evAnnual: number       // 年化後 EV
  windowSize: number     // 此尺度使用的資料筆數
  freq: 'daily' | 'monthly'
}

export interface MultiScaleEVResult {
  short:  ScaleEV | null   // 60 日窗口
  medium: ScaleEV | null   // 36 月窗口
  long:   ScaleEV          // 全部月報酬
  divergence: EVDivergence
}

const MIN_MONTHLY_FOR_LONG = 60
const MEDIUM_MONTHLY_WIN = 36
const SHORT_DAILY_WIN = 60
const PERIODS_PER_YEAR_DAILY = 252
const PERIODS_PER_YEAR_MONTHLY = 12
const EV_DIVERGENCE_THRESHOLD = 0.05  // 5% 年化差距

/** 複利年化：(1+ev)^N − 1。處理極端值避免 NaN。 */
function annualize(ev: number, periodsPerYear: number): number {
  // 防護：1+ev 必須 > 0；極端虧損 clip 到 −0.99
  const base = Math.max(1 + ev, 0.01)
  return Math.pow(base, periodsPerYear) - 1
}

/** 依「短期年化 vs 長期年化」差距 + 0% 跨越判斷四狀態。 */
export function classifyEVDivergence(
  shortAnnual: number | null,
  longAnnual: number,
): EVDivergence {
  if (shortAnnual === null) return 'stable'
  const diff = shortAnnual - longAnnual
  if (Math.abs(diff) <= EV_DIVERGENCE_THRESHOLD) return 'stable'

  // 跨越 0%（賺/虧分界）
  if (diff < -EV_DIVERGENCE_THRESHOLD && shortAnnual < 0 && longAnnual >= 0) {
    return 'short-deteriorating'
  }
  if (diff > EV_DIVERGENCE_THRESHOLD && shortAnnual > 0 && longAnnual <= 0) {
    return 'short-improving'
  }
  return 'mixed'
}

/**
 * 多尺度年化 EV 計算。
 * @param monthly 月報酬序列
 * @param daily   日報酬序列
 * @returns 三尺度結果 + divergence；月報酬 < 60 筆回傳 null
 */
export function calcMultiScaleEV(
  monthly: number[],
  daily: number[],
): MultiScaleEVResult | null {
  const cleanMonthly = monthly.filter((v) => !isNaN(v))
  const cleanDaily = daily.filter((v) => !isNaN(v))

  if (cleanMonthly.length < MIN_MONTHLY_FOR_LONG) return null

  // 長期：全部月報酬
  const longEV = calcEV(cleanMonthly)
  const long: ScaleEV = {
    ev: longEV,
    evAnnual: annualize(longEV.ev, PERIODS_PER_YEAR_MONTHLY),
    windowSize: cleanMonthly.length,
    freq: 'monthly',
  }

  // 中期：近 36 月
  let medium: ScaleEV | null = null
  if (cleanMonthly.length >= MEDIUM_MONTHLY_WIN) {
    const mediumEV = calcEV(cleanMonthly.slice(-MEDIUM_MONTHLY_WIN))
    medium = {
      ev: mediumEV,
      evAnnual: annualize(mediumEV.ev, PERIODS_PER_YEAR_MONTHLY),
      windowSize: MEDIUM_MONTHLY_WIN,
      freq: 'monthly',
    }
  }

  // 短期：近 60 日
  let short: ScaleEV | null = null
  if (cleanDaily.length >= SHORT_DAILY_WIN) {
    const shortEV = calcEV(cleanDaily.slice(-SHORT_DAILY_WIN))
    short = {
      ev: shortEV,
      evAnnual: annualize(shortEV.ev, PERIODS_PER_YEAR_DAILY),
      windowSize: SHORT_DAILY_WIN,
      freq: 'daily',
    }
  }

  return {
    short,
    medium,
    long,
    divergence: classifyEVDivergence(short?.evAnnual ?? null, long.evAnnual),
  }
}

// ── 投資組合多尺度年化 EV ──────────────────────────────────────────────────────
//
// 對加權組合計算多尺度 EV：內部組合 calcPortfolioReturns + calcMultiScaleEV，
// 不重新實作邏輯。
//
// - 短期日頻 60：需所有股票日報酬 ≥ 60；不足則 short = null
// - 中期月頻 36：對加權月報酬切尾 36 筆
// - 長期月頻全期：用全部加權月報酬

/**
 * 投資組合多尺度年化 EV。
 * @param stockMonthlyArrays 各股票月報酬陣列
 * @param stockDailyArrays   各股票日報酬陣列
 * @param weights            各股票比重（小數，如 0.5）
 * @returns 多尺度結果；加權月報酬 < 60 筆時回傳 null
 */
export function calcPortfolioMultiScaleEV(
  stockMonthlyArrays: number[][],
  stockDailyArrays: number[][],
  weights: number[],
): MultiScaleEVResult | null {
  // 1. 加權組合月報酬（既有 calcPortfolioReturns 處理對齊）
  const weightedMonthly = calcPortfolioReturns(stockMonthlyArrays, weights)
  if (weightedMonthly.length < 60) return null

  // 2. 加權組合日報酬：只取所有股票都有 ≥ 60 日的尾段
  const allHaveSixtyDaily = stockDailyArrays.every((d) => d.length >= 60)
  const weightedDaily60 = allHaveSixtyDaily
    ? calcPortfolioReturns(
        stockDailyArrays.map((d) => d.slice(-60)),
        weights,
      )
    : []

  // 3. 重用 calcMultiScaleEV（內部會自動處理 daily < 60 時 short = null）
  return calcMultiScaleEV(weightedMonthly, weightedDaily60)
}
