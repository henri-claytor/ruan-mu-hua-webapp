import { average, stdev } from './utils'

export type HurstInterpretation =
  | '趨勢延續型（Persistent）'
  | '隨機遊走型（Random Walk）'
  | '均值回歸型（Anti-persistent）'

/** 多窗口 R/S 迴歸的單一資料點 */
export interface RSPoint {
  n: number              // 子窗口尺寸
  rs: number             // 該尺寸下的 average R/S
  subWindowCount: number // 該尺寸切了幾個不重疊子窗口
}

export interface HurstResult {
  h: number                  // 多窗口 R/S 迴歸的斜率（短序列 fallback 為單點公式）
  r: number                  // 全序列 R = MAX(cumDev) - MIN(cumDev)
  s: number                  // 全序列 S = STDEV(returns)
  n: number                  // 全序列長度
  mu: number
  cumDeviations: number[]    // 全序列累積偏差
  interpretation: HurstInterpretation
  points: RSPoint[]          // 迴歸所用的 (n, R/S) 點集
}

// ── R/S 子窗口計算 ────────────────────────────────────────────────────────────

/** 對單一窗口計算 R/S 值（不取 log）。資料常數（s=0 或 r=0）回傳 NaN。 */
function calcRSForWindow(window: number[]): number {
  const mu = average(window)
  const s = stdev(window)
  if (s === 0) return NaN
  let cum = 0, max = -Infinity, min = Infinity
  for (const r of window) {
    cum += r - mu
    if (cum > max) max = cum
    if (cum < min) min = cum
  }
  const range = max - min
  if (range === 0) return NaN
  return range / s
}

/** Lanczos 近似計算 log Γ(x)，用於 Anis-Lloyd 修正中的 Γ 比例。 */
function lgamma(x: number): number {
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ]
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x)
  }
  x -= 1
  let a = c[0]
  const t = x + 7.5
  for (let i = 1; i < 9; i++) {
    a += c[i] / (x + i)
  }
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a)
}

/**
 * Anis-Lloyd (1976) 期望 R/S：給定隨機漫步 null 假設下，n 筆資料的 R/S 期望值。
 * 用於修正小樣本偏差。
 */
function expectedRS(n: number): number {
  let sum = 0
  for (let i = 1; i < n; i++) {
    sum += Math.sqrt((n - i) / i)
  }
  if (n <= 340) {
    // Γ((n-1)/2) / (√π × Γ(n/2)) × Σ
    const factor = Math.exp(lgamma((n - 1) / 2) - 0.5 * Math.log(Math.PI) - lgamma(n / 2))
    return factor * sum
  } else {
    // 1 / √(n*π/2) × Σ
    return sum / Math.sqrt((n * Math.PI) / 2)
  }
}

/** 最小平方法線性迴歸，回傳斜率。 */
function linearRegressionSlope(xs: number[], ys: number[]): number {
  const n = xs.length
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY)
    den += (xs[i] - meanX) ** 2
  }
  return den === 0 ? 0 : num / den
}

/** 候選子窗口尺寸（對數均勻分布，便於 log-log 迴歸） */
const CANDIDATE_SIZES = [10, 20, 40, 80, 160]

// ── 主要計算函式 ──────────────────────────────────────────────────────────────

export function calcHurst(returns: number[]): HurstResult | null {
  const values = returns.filter((v) => !isNaN(v))
  const n = values.length
  if (n < 10) return null

  const mu = average(values)
  const s = stdev(values)

  // 全序列累積偏差（供 HurstLineChart 顯示）
  const cumDeviations: number[] = []
  let cumSum = 0
  for (const r of values) {
    cumSum += r - mu
    cumDeviations.push(cumSum)
  }
  const maxX = Math.max(...cumDeviations)
  const minX = Math.min(...cumDeviations)
  const r = maxX - minX

  if (s === 0 || r === 0) return null

  // ── 多窗口 R/S 迴歸 ─────────────────────────────────────────────────────────
  // 過濾候選尺寸：size 必須 ≤ N/2 才能切出至少 2 個不重疊子窗口
  const availableSizes = CANDIDATE_SIZES.filter((size) => size <= Math.floor(n / 2))

  let h: number
  let points: RSPoint[]

  if (availableSizes.length >= 2) {
    // 多窗口 R/S 迴歸法（含 Anis-Lloyd 小樣本偏差修正）
    points = availableSizes
      .map((size) => {
        const subCount = Math.floor(n / size)
        const tailLen = subCount * size
        const tail = values.slice(n - tailLen)
        const rsValues: number[] = []
        for (let i = 0; i < subCount; i++) {
          const window = tail.slice(i * size, (i + 1) * size)
          const rs = calcRSForWindow(window)
          if (!isNaN(rs)) rsValues.push(rs)
        }
        if (rsValues.length === 0) return null
        const avgRS = rsValues.reduce((a, b) => a + b, 0) / rsValues.length
        return { n: size, rs: avgRS, subWindowCount: rsValues.length }
      })
      .filter((p): p is RSPoint => p !== null)

    if (points.length >= 2) {
      // Anis-Lloyd 修正：corrected_RS = RS − E[RS] + √(πn/2)
      // 然後對 log(corrected_RS) vs log(n) 做迴歸
      const xs = points.map((p) => Math.log(p.n))
      const ys = points.map((p) => {
        const expected = expectedRS(p.n)
        const corrected = p.rs - expected + Math.sqrt((Math.PI * p.n) / 2)
        // 防護：corrected 應為正
        return Math.log(Math.max(corrected, 1e-10))
      })
      const slope = linearRegressionSlope(xs, ys)
      h = Math.max(0, Math.min(1, slope))  // clip 到 [0, 1]
    } else {
      // 子窗口都失敗，fallback 單點
      h = Math.log(r / s) / Math.log(n)
      points = [{ n, rs: r / s, subWindowCount: 1 }]
    }
  } else {
    // N 太小，fallback 單點公式
    h = Math.log(r / s) / Math.log(n)
    points = [{ n, rs: r / s, subWindowCount: 1 }]
  }

  let interpretation: HurstInterpretation
  if (h > 0.6) {
    interpretation = '趨勢延續型（Persistent）'
  } else if (h < 0.4) {
    interpretation = '均值回歸型（Anti-persistent）'
  } else {
    interpretation = '隨機遊走型（Random Walk）'
  }

  return { h, r, s, n, mu, cumDeviations, interpretation, points }
}

// ── Multi-scale Hurst ──────────────────────────────────────────────────────────
//
// 對日報酬序列在固定的短/中/長三個窗口（60 / 120 / 240）各執行一次 R/S 分析。
// 僅支援日頻：月頻 fallback 已移除（時間語意不對等）。

export type Divergence =
  | 'stable'                // 三尺度一致
  | 'short-weakening'       // 短期偏弱、跨越 0.5 中性線（趨勢動能轉弱）
  | 'short-strengthening'   // 短期偏強、跨越 0.5 中性線（動能轉強）
  | 'mixed'                 // 有差距但未跨越中性線

export interface MultiScaleHurstResult {
  short:  HurstResult       // 60 日窗口
  medium: HurstResult       // 120 日窗口
  long:   HurstResult       // 240 日窗口
  divergence: Divergence
}

const MIN_DAILY_FOR_MULTISCALE = 240
const SHORT_WIN  = 60
const MEDIUM_WIN = 120
const LONG_WIN   = 240
const DIVERGENCE_THRESHOLD = 0.10

/** 依「短期 H 與長期 H 的差距 + 是否跨越 0.5 中性線」分四類。 */
export function classifyDivergence(short: number, long: number): Divergence {
  const diff = short - long
  if (Math.abs(diff) <= DIVERGENCE_THRESHOLD) return 'stable'

  // 跨越 0.5 中性線（regime change 訊號）
  if (diff < -DIVERGENCE_THRESHOLD && short < 0.5 && long >= 0.5) {
    return 'short-weakening'
  }
  if (diff > DIVERGENCE_THRESHOLD && short > 0.5 && long <= 0.5) {
    return 'short-strengthening'
  }

  return 'mixed'
}

/**
 * 多尺度 Hurst 計算。
 * @param dailyReturns 日報酬序列（必須 ≥ 240 筆）
 * @returns 三尺度結果 + divergence 狀態；資料不足時回傳 null
 */
export function calcMultiScaleHurst(dailyReturns: number[]): MultiScaleHurstResult | null {
  const clean = dailyReturns.filter((v) => !isNaN(v))
  if (clean.length < MIN_DAILY_FOR_MULTISCALE) return null

  const short  = calcHurst(clean.slice(-SHORT_WIN))
  const medium = calcHurst(clean.slice(-MEDIUM_WIN))
  const long   = calcHurst(clean.slice(-LONG_WIN))

  // 240 筆有效資料下三個窗口都應該成功；防禦性檢查
  if (!short || !medium || !long) return null

  return {
    short,
    medium,
    long,
    divergence: classifyDivergence(short.h, long.h),
  }
}
