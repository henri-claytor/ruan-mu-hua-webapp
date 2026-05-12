/**
 * Hurst 計算公式診斷測試
 *
 * 用「已知性質」的合成資料檢驗 calcHurst 與 calcMultiScaleHurst 的輸出。
 * 目的：判斷使用者觀察到「實際股票 H 都接近 0.5」是因為：
 *   (a) 公式本身有偏差（朝 0.5 收斂）
 *   (b) 市場真的近似隨機
 *
 * 驗證方法：
 *   - 純隨機（iid Gaussian）→ 理論 H ≈ 0.50
 *   - 強趨勢（AR(1) phi=0.9 + drift）→ 應 > 0.55
 *   - 強反趨勢（接近交替正負）→ 應 < 0.45
 *   - 累積偏差小但隨機 → 控制組
 */

import { describe, it, expect } from 'vitest'
import { calcHurst, calcMultiScaleHurst } from './hurst'

// ── Seeded PRNG (Mulberry32) ─────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gaussian(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-9)
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

// ── Synthetic series builders ────────────────────────────────────────────────

/** 純隨機 Gaussian：理論 H ≈ 0.50 */
function makeWhiteNoise(n: number, seed: number, sigma = 0.01): number[] {
  const rng = mulberry32(seed)
  return Array.from({ length: n }, () => gaussian(rng) * sigma)
}

/** 強正自相關 AR(1): r_t = phi*r_{t-1} + sqrt(1-phi^2)*eps_t */
function makePersistent(n: number, seed: number, phi = 0.9, sigma = 0.01): number[] {
  const rng = mulberry32(seed)
  const out: number[] = []
  let prev = gaussian(rng) * sigma
  out.push(prev)
  const noiseScale = Math.sqrt(1 - phi * phi) * sigma
  for (let i = 1; i < n; i++) {
    const cur = phi * prev + gaussian(rng) * noiseScale
    out.push(cur)
    prev = cur
  }
  return out
}

/** 強反趨勢：接近完美交替（加少量噪音避免 s=0） */
function makeAntiPersistent(n: number, seed: number, sigma = 0.05): number[] {
  const rng = mulberry32(seed)
  return Array.from({ length: n }, (_, i) => {
    const sign = i % 2 === 0 ? 1 : -1
    return sign * sigma + gaussian(rng) * (sigma * 0.05)
  })
}

/** 對數累積噪音（cumulative-like）：應該明顯 > 0.5 */
function makeCumulativeDrift(n: number, seed: number, sigma = 0.01, drift = 0.001): number[] {
  const rng = mulberry32(seed)
  return Array.from({ length: n }, () => drift + gaussian(rng) * sigma)
}

// ── Diagnostic block ─────────────────────────────────────────────────────────

describe('Hurst 公式診斷（已知合成資料）', () => {
  const N = 240
  const SAMPLES = 5    // 每種類型跑 5 個 seed 取平均，降低噪音

  function avgH(builder: (n: number, seed: number) => number[]): { mean: number; values: number[] } {
    const values: number[] = []
    for (let s = 1; s <= SAMPLES; s++) {
      const series = builder(N, s)
      const result = calcHurst(series)
      if (result) values.push(result.h)
    }
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    return { mean, values }
  }

  it('純隨機（白噪音）H 值應接近 0.5', () => {
    const { mean, values } = avgH(makeWhiteNoise)
    console.log(`\n[白噪音] N=${N} 平均 H = ${mean.toFixed(4)} | 各次: [${values.map(v => v.toFixed(3)).join(', ')}]`)
    expect(mean).toBeGreaterThan(0.40)
    expect(mean).toBeLessThan(0.60)
  })

  it('強正自相關（AR(1) phi=0.9）H 值應 ≥ 0.65', () => {
    const { mean, values } = avgH(makePersistent)
    console.log(`\n[強正自相關] N=${N} 平均 H = ${mean.toFixed(4)} | 各次: [${values.map(v => v.toFixed(3)).join(', ')}]`)
    expect(mean).toBeGreaterThanOrEqual(0.65)
  })

  it('強反趨勢（接近交替）H 值應 ≤ 0.30', () => {
    const { mean, values } = avgH(makeAntiPersistent)
    console.log(`\n[強反趨勢] N=${N} 平均 H = ${mean.toFixed(4)} | 各次: [${values.map(v => v.toFixed(3)).join(', ')}]`)
    expect(mean).toBeLessThanOrEqual(0.30)
  })

  it('累積飄移噪音 H 值', () => {
    const { mean, values } = avgH(makeCumulativeDrift)
    console.log(`\n[累積飄移] N=${N} 平均 H = ${mean.toFixed(4)} | 各次: [${values.map(v => v.toFixed(3)).join(', ')}]`)
  })

  it('多尺度 H 範圍展示（白噪音 vs 強自相關）', () => {
    const noiseSeries = makeWhiteNoise(N, 42)
    const persistSeries = makePersistent(N, 42)

    const ms1 = calcMultiScaleHurst(noiseSeries)
    const ms2 = calcMultiScaleHurst(persistSeries)

    console.log('\n[多尺度] 白噪音：', ms1 && {
      short: ms1.short.h.toFixed(3),
      medium: ms1.medium.h.toFixed(3),
      long: ms1.long.h.toFixed(3),
      div: ms1.divergence,
    })
    console.log('[多尺度] 強自相關：', ms2 && {
      short: ms2.short.h.toFixed(3),
      medium: ms2.medium.h.toFixed(3),
      long: ms2.long.h.toFixed(3),
      div: ms2.divergence,
    })
  })
})
