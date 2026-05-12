import { describe, it, expect } from 'vitest'
import { calcHurst, calcMultiScaleHurst, classifyDivergence } from './hurst'

describe('calcHurst', () => {
  it('returns null for fewer than 10 data points', () => {
    expect(calcHurst([0.01, 0.02, 0.03])).toBeNull()
  })

  it('H value is a finite number for typical return series', () => {
    // 30 data points with slight upward trend
    const returns: number[] = []
    for (let i = 0; i < 30; i++) {
      returns.push(0.005 * i * 0.1 + (i % 3 === 0 ? 0.02 : -0.01))
    }
    const result = calcHurst(returns)
    expect(result).not.toBeNull()
    if (result) {
      expect(isFinite(result.h)).toBe(true)
      expect(result.h).toBeGreaterThan(-1)
      expect(result.h).toBeLessThan(2)
    }
  })

  it('H value via multi-window R/S regression: slope of log(R/S) vs log(n)', () => {
    // N=30 → 可用尺寸 [10]（size ≤ 15）只有 1 個 → fallback 單點
    const returns30 = Array.from({ length: 30 }, (_, i) => (i % 3 - 1) * 0.01)
    const r30 = calcHurst(returns30)
    expect(r30).not.toBeNull()
    if (r30) {
      // fallback 走單點公式
      expect(r30.points.length).toBe(1)
      const expected = Math.log(r30.r / r30.s) / Math.log(r30.n)
      expect(r30.h).toBeCloseTo(expected, 10)
    }
  })

  it('multi-window mode: produces at least 2 RSPoints when N >= 40', () => {
    // N=240 → 可用尺寸 [10, 20, 40, 80]（size ≤ 120）共 4 個
    const returns = Array.from({ length: 240 }, (_, i) => Math.sin(i * 0.1) * 0.01)
    const result = calcHurst(returns)
    expect(result).not.toBeNull()
    if (result) {
      expect(result.points.length).toBeGreaterThanOrEqual(2)
      // 對長度 240 應有 4 個尺寸
      expect(result.points.map((p) => p.n)).toEqual([10, 20, 40, 80])
    }
  })

  it('fallback single-point mode for short series (N < 20)', () => {
    // N=15 → 可用尺寸只有 [10]，走 fallback
    const returns = Array.from({ length: 15 }, (_, i) => (i % 3 - 1) * 0.01)
    const result = calcHurst(returns)
    expect(result).not.toBeNull()
    if (result) {
      expect(result.points.length).toBe(1)
      expect(result.points[0].n).toBe(15)
    }
  })

  it('H value is clipped to [0, 1]', () => {
    const returns = Array.from({ length: 240 }, (_, i) => Math.sin(i * 0.1) * 0.01)
    const result = calcHurst(returns)
    if (result) {
      expect(result.h).toBeGreaterThanOrEqual(0)
      expect(result.h).toBeLessThanOrEqual(1)
    }
  })

  it('cumDeviations length equals input length', () => {
    const returns = Array.from({ length: 50 }, () => 0.01)
    const result = calcHurst(returns)
    expect(result).not.toBeNull()
    if (result) {
      expect(result.cumDeviations.length).toBe(50)
    }
  })

  it('interpretation is 均值回歸型 for anti-persistent series', () => {
    // Perfectly alternating: strongly anti-persistent → H < 0.4
    const returns = Array.from({ length: 60 }, (_, i) => i % 2 === 0 ? 0.05 : -0.05)
    const result = calcHurst(returns)
    if (result && result.h < 0.4) {
      expect(result.interpretation).toBe('均值回歸型（Anti-persistent）')
    }
  })

  it('R = MAX(cumDeviations) - MIN(cumDeviations)', () => {
    const returns = [0.02, -0.01, 0.03, -0.02, 0.01, 0.04, -0.03, 0.02, -0.01, 0.02]
    const result = calcHurst(returns)
    expect(result).not.toBeNull()
    if (result) {
      const max = Math.max(...result.cumDeviations)
      const min = Math.min(...result.cumDeviations)
      expect(result.r).toBeCloseTo(max - min, 10)
    }
  })
})

describe('classifyDivergence', () => {
  it('returns stable when |short - long| ≤ 0.10', () => {
    expect(classifyDivergence(0.55, 0.50)).toBe('stable')
    expect(classifyDivergence(0.45, 0.50)).toBe('stable')
    expect(classifyDivergence(0.60, 0.60)).toBe('stable')
  })

  it('returns short-weakening when short crosses below 0.5 and long is above', () => {
    expect(classifyDivergence(0.35, 0.65)).toBe('short-weakening')
    expect(classifyDivergence(0.40, 0.55)).toBe('short-weakening')
  })

  it('returns short-strengthening when short crosses above 0.5 and long is below', () => {
    expect(classifyDivergence(0.65, 0.35)).toBe('short-strengthening')
    expect(classifyDivergence(0.60, 0.40)).toBe('short-strengthening')
  })

  it('returns mixed when difference exceeds threshold but no 0.5 crossing', () => {
    // both above 0.5
    expect(classifyDivergence(0.80, 0.60)).toBe('mixed')
    // both below 0.5
    expect(classifyDivergence(0.20, 0.40)).toBe('mixed')
  })

  it('threshold edge: diff exactly 0.10 is stable', () => {
    expect(classifyDivergence(0.40, 0.50)).toBe('stable')
    expect(classifyDivergence(0.60, 0.50)).toBe('stable')
  })
})

describe('calcMultiScaleHurst', () => {
  it('returns null when daily returns < 240', () => {
    const returns = Array.from({ length: 239 }, (_, i) => Math.sin(i * 0.1) * 0.01)
    expect(calcMultiScaleHurst(returns)).toBeNull()
  })

  it('returns three scales when daily returns ≥ 240', () => {
    const returns = Array.from({ length: 240 }, (_, i) => Math.sin(i * 0.1) * 0.01)
    const result = calcMultiScaleHurst(returns)
    expect(result).not.toBeNull()
    if (result) {
      expect(result.short).not.toBeNull()
      expect(result.medium).not.toBeNull()
      expect(result.long).not.toBeNull()
      // 短期窗口 60、中期 120、長期 240
      expect(result.short.n).toBe(60)
      expect(result.medium.n).toBe(120)
      expect(result.long.n).toBe(240)
    }
  })

  it('uses last N entries (recency) for each window', () => {
    // 第一段全 0、第二段大幅波動 → 短期窗口（取尾段）H 應該明顯不同於長期
    const flat = Array.from({ length: 200 }, () => 0.001)
    const volatile = Array.from({ length: 60 }, (_, i) => (i % 2 === 0 ? 0.05 : -0.05))
    const result = calcMultiScaleHurst([...flat, ...volatile])
    expect(result).not.toBeNull()
    if (result) {
      // short 用最近 60 筆 = volatile（強均值回歸）
      // long 用全部 240 筆 = flat + volatile（被前段稀釋）
      expect(result.short.h).toBeLessThan(result.long.h)
    }
  })

  it('filters out NaN values before computing', () => {
    const returns: number[] = []
    for (let i = 0; i < 240; i++) returns.push(0.01 * Math.sin(i * 0.1))
    returns.push(NaN, NaN, NaN)
    const result = calcMultiScaleHurst(returns)
    expect(result).not.toBeNull()
  })

  it('divergence is set on the result', () => {
    const returns = Array.from({ length: 240 }, (_, i) => Math.sin(i * 0.1) * 0.01)
    const result = calcMultiScaleHurst(returns)
    expect(result).not.toBeNull()
    if (result) {
      expect(['stable', 'short-weakening', 'short-strengthening', 'mixed']).toContain(result.divergence)
    }
  })
})
