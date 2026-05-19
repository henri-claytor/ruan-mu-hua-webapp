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
// 個股頁三尺度定義（v2）：
//   short  ＝ 日報酬 最近 60  筆（「最近 3 個月」，主要判斷）→ 年化 252
//   medium ＝ 日報酬 最近 240 筆（「最近 1 年」，主要判斷）→ 年化 252
//   long   ＝ 月報酬 最近 60  筆（「最近 5 年」，參考用）→ 年化 12
//
// Divergence 判讀只看主要判斷的兩個（short + medium），long 僅供畫面參考。

export type EVDivergence =
  | 'stable'
  | 'short-improving'
  | 'short-deteriorating'
  | 'mixed'

export interface ScaleEV {
  ev: EVResult
  evAnnual: number                          // 年化後 EV
  windowSize: number                        // 此尺度使用的資料筆數
  freq: 'daily' | 'monthly'
  /** 主要判斷 vs 參考用 — 用於 UI 視覺權重 */
  tier: 'primary' | 'reference'
  /** 顯示用標題（如「最近 3 個月」） */
  label: string
}

export interface MultiScaleEVResult {
  short:  ScaleEV | null   // 主要 · 日報酬 60 筆
  medium: ScaleEV | null   // 主要 · 日報酬 240 筆
  long:   ScaleEV | null   // 參考 · 月報酬 60 筆
  divergence: EVDivergence
}

const SHORT_DAILY_WIN = 60        // 最近 3 個月
const MEDIUM_DAILY_WIN = 240      // 最近 1 年
const LONG_MONTHLY_WIN = 60       // 最近 5 年
const PERIODS_PER_YEAR_DAILY = 252
const PERIODS_PER_YEAR_MONTHLY = 12
const EV_DIVERGENCE_GAP_RATIO = 0.3   // 主要兩尺度年化 EV 相對差距 30%

/** 複利年化：(1+ev)^N − 1。處理極端值避免 NaN。 */
function annualize(ev: number, periodsPerYear: number): number {
  // 防護：1+ev 必須 > 0；極端虧損 clip 到 −0.99
  const base = Math.max(1 + ev, 0.01)
  return Math.pow(base, periodsPerYear) - 1
}

/**
 * 只比較兩個主要尺度（最近 3 個月 vs 最近 1 年）。
 * - 兩者皆有資料 + 同號 + gap < 30% → stable
 * - 同號但 gap ≥ 30% → mixed
 * - 短低於中 + gap > 30% → short-deteriorating
 * - 短高於中 + gap > 30% → short-improving
 * - 任一為 null → stable（資料不足無法判讀）
 */
export function classifyEVDivergence(
  shortAnnual: number | null,
  mediumAnnual: number | null,
): EVDivergence {
  if (shortAnnual === null || mediumAnnual === null) return 'stable'

  const denom = Math.max(Math.abs(shortAnnual), Math.abs(mediumAnnual))
  const gap = denom > 0 ? Math.abs(shortAnnual - mediumAnnual) / denom : 0
  const sameSign =
    (shortAnnual > 0 && mediumAnnual > 0) ||
    (shortAnnual < 0 && mediumAnnual < 0) ||
    (shortAnnual === 0 && mediumAnnual === 0)

  if (sameSign && gap < EV_DIVERGENCE_GAP_RATIO) return 'stable'

  if (shortAnnual < mediumAnnual && gap > EV_DIVERGENCE_GAP_RATIO) return 'short-deteriorating'
  if (shortAnnual > mediumAnnual && gap > EV_DIVERGENCE_GAP_RATIO) return 'short-improving'
  return 'mixed'
}

/**
 * 多尺度年化 EV 計算（v2 個股版）。
 *
 * @param monthly 月報酬序列
 * @param daily   日報酬序列
 * @returns 三尺度結果 + divergence；三尺度全部資料不足時回傳 null
 */
export function calcMultiScaleEV(
  monthly: number[],
  daily: number[],
): MultiScaleEVResult | null {
  const cleanMonthly = monthly.filter((v) => !isNaN(v))
  const cleanDaily = daily.filter((v) => !isNaN(v))

  // short：日報酬最近 60 筆（主要 · 最近 3 個月）
  let short: ScaleEV | null = null
  if (cleanDaily.length >= SHORT_DAILY_WIN) {
    const shortEV = calcEV(cleanDaily.slice(-SHORT_DAILY_WIN))
    short = {
      ev: shortEV,
      evAnnual: annualize(shortEV.ev, PERIODS_PER_YEAR_DAILY),
      windowSize: SHORT_DAILY_WIN,
      freq: 'daily',
      tier: 'primary',
      label: '最近 3 個月',
    }
  }

  // medium：日報酬最近 240 筆（主要 · 最近 1 年）
  let medium: ScaleEV | null = null
  if (cleanDaily.length >= MEDIUM_DAILY_WIN) {
    const mediumEV = calcEV(cleanDaily.slice(-MEDIUM_DAILY_WIN))
    medium = {
      ev: mediumEV,
      evAnnual: annualize(mediumEV.ev, PERIODS_PER_YEAR_DAILY),
      windowSize: MEDIUM_DAILY_WIN,
      freq: 'daily',
      tier: 'primary',
      label: '最近 1 年',
    }
  }

  // long：月報酬最近 60 筆（參考 · 最近 5 年）
  let long: ScaleEV | null = null
  if (cleanMonthly.length >= LONG_MONTHLY_WIN) {
    const longEV = calcEV(cleanMonthly.slice(-LONG_MONTHLY_WIN))
    long = {
      ev: longEV,
      evAnnual: annualize(longEV.ev, PERIODS_PER_YEAR_MONTHLY),
      windowSize: LONG_MONTHLY_WIN,
      freq: 'monthly',
      tier: 'reference',
      label: '最近 5 年',
    }
  }

  // 三尺度全部不足 → null（呼叫端顯示「資料不足」）
  if (!short && !medium && !long) return null

  return {
    short,
    medium,
    long,
    divergence: classifyEVDivergence(short?.evAnnual ?? null, medium?.evAnnual ?? null),
  }
}

// ── 投資組合多尺度年化 EV ──────────────────────────────────────────────────────
//
// 注意：組合頁目前沿用 v2 窗口定義（short=日60 / medium=日240 / long=月60）。
// 標籤與 tier 由 calcMultiScaleEV 自動帶入；組合頁 UI 可以選擇是否套用視覺權重。

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

  // 2. 加權組合日報酬：取所有股票最短長度的尾段（讓 calcMultiScaleEV 自行判定 60/240 窗口是否足夠）
  const minDaily = stockDailyArrays.length > 0
    ? Math.min(...stockDailyArrays.map((d) => d.length))
    : 0
  const weightedDaily = minDaily > 0
    ? calcPortfolioReturns(
        stockDailyArrays.map((d) => d.slice(-minDaily)),
        weights,
      )
    : []

  // 3. 重用 calcMultiScaleEV（內部依資料筆數自動處理 short/medium/long）
  return calcMultiScaleEV(weightedMonthly, weightedDaily)
}
