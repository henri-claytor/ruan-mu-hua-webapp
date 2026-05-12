import { describe, it, expect } from 'vitest'
import { calcEV, calcMultiScaleEV, calcPortfolioMultiScaleEV, classifyEVDivergence } from './ev'

// Test data: 6 gains, 4 losses → winRate=0.6, lossRate=0.4
const testReturns = [0.05, 0.03, 0.08, 0.02, 0.04, 0.06, -0.02, -0.03, -0.01, -0.04]

describe('calcEV', () => {
  it('calculates winRate and lossRate correctly', () => {
    const result = calcEV(testReturns)
    expect(result.winRate).toBeCloseTo(0.6, 5)
    expect(result.lossRate).toBeCloseTo(0.4, 5)
  })

  it('calculates avgGain correctly', () => {
    const result = calcEV(testReturns)
    // gains: 0.05, 0.03, 0.08, 0.02, 0.04, 0.06 → avg = 0.28/6 ≈ 0.04667
    expect(result.avgGain).toBeCloseTo(0.04667, 3)
  })

  it('calculates avgLoss correctly', () => {
    const result = calcEV(testReturns)
    // losses: -0.02, -0.03, -0.01, -0.04 → avg abs = 0.1/4 = 0.025
    expect(result.avgLoss).toBeCloseTo(0.025, 5)
  })

  it('calculates EV correctly: winRate*avgGain - lossRate*avgLoss', () => {
    const result = calcEV(testReturns)
    const expected = result.winRate * result.avgGain - result.lossRate * result.avgLoss
    expect(result.ev).toBeCloseTo(expected, 10)
    // Should be positive
    expect(result.ev).toBeGreaterThan(0)
  })

  it('calculates actualOdds = avgGain / avgLoss', () => {
    const result = calcEV(testReturns)
    expect(result.actualOdds).toBeCloseTo(result.avgGain / result.avgLoss, 5)
  })

  it('calculates breakEvenOdds = lossRate / winRate', () => {
    const result = calcEV(testReturns)
    expect(result.breakEvenOdds).toBeCloseTo(result.lossRate / result.winRate, 5)
  })

  it('assigns correct quadrant for positive EV with high odds', () => {
    const result = calcEV(testReturns)
    // actualOdds ≈ 1.87, breakEvenOdds ≈ 0.67 → actualOdds > breakEvenOdds, EV > 0
    expect(result.quadrant).toBe('高賠率正期望值（最佳）')
  })

  it('assigns negative EV quadrant for all-loss data', () => {
    const allLoss = [-0.01, -0.02, -0.03, -0.04, -0.05, -0.06, -0.01, -0.02, -0.03, -0.01]
    const result = calcEV(allLoss)
    expect(result.ev).toBeLessThan(0)
  })
})

describe('classifyEVDivergence', () => {
  it('returns stable when |short - long| <= 0.05', () => {
    expect(classifyEVDivergence(0.10, 0.08)).toBe('stable')
    expect(classifyEVDivergence(0.05, 0.10)).toBe('stable')
    expect(classifyEVDivergence(-0.05, -0.05)).toBe('stable')
  })

  it('returns short-deteriorating when short crosses below 0 and long is positive', () => {
    expect(classifyEVDivergence(-0.08, 0.10)).toBe('short-deteriorating')
    expect(classifyEVDivergence(-0.20, 0.05)).toBe('short-deteriorating')
  })

  it('returns short-improving when short crosses above 0 and long is negative', () => {
    expect(classifyEVDivergence(0.10, -0.05)).toBe('short-improving')
    expect(classifyEVDivergence(0.20, -0.10)).toBe('short-improving')
  })

  it('returns mixed when difference exceeds threshold but no 0 crossing', () => {
    // both positive, different
    expect(classifyEVDivergence(0.20, 0.05)).toBe('mixed')
    // both negative, different
    expect(classifyEVDivergence(-0.20, -0.05)).toBe('mixed')
  })

  it('returns stable when short is null', () => {
    expect(classifyEVDivergence(null, 0.10)).toBe('stable')
    expect(classifyEVDivergence(null, -0.10)).toBe('stable')
  })
})

describe('calcMultiScaleEV', () => {
  // 60+ months of returns（cycling pattern, mostly positive）
  const monthly60 = Array.from({ length: 60 }, (_, i) => 0.005 + Math.sin(i * 0.5) * 0.02)
  // 60+ days of returns
  const daily60 = Array.from({ length: 60 }, (_, i) => 0.0003 + Math.sin(i * 0.3) * 0.01)

  it('returns null when monthly < 60', () => {
    const monthly59 = monthly60.slice(0, 59)
    expect(calcMultiScaleEV(monthly59, daily60)).toBeNull()
  })

  it('returns three scales when monthly ≥ 60 and daily ≥ 60', () => {
    const result = calcMultiScaleEV(monthly60, daily60)
    expect(result).not.toBeNull()
    if (result) {
      expect(result.short).not.toBeNull()
      expect(result.medium).not.toBeNull()
      expect(result.long).not.toBeNull()
      expect(result.short?.windowSize).toBe(60)
      expect(result.short?.freq).toBe('daily')
      expect(result.medium?.windowSize).toBe(36)
      expect(result.medium?.freq).toBe('monthly')
      expect(result.long.windowSize).toBe(60)
      expect(result.long.freq).toBe('monthly')
    }
  })

  it('short = null when daily < 60', () => {
    const daily59 = daily60.slice(0, 59)
    const result = calcMultiScaleEV(monthly60, daily59)
    expect(result).not.toBeNull()
    if (result) {
      expect(result.short).toBeNull()
      expect(result.medium).not.toBeNull()
      expect(result.long).not.toBeNull()
      // short null → divergence stable
      expect(result.divergence).toBe('stable')
    }
  })

  it('annualizes monthly EV correctly: 1% monthly → ~12.68% annual', () => {
    // Construct returns with EV ≈ 0.01 (1% monthly average)
    const constReturns = Array.from({ length: 60 }, () => 0.01)
    const result = calcMultiScaleEV(constReturns, daily60)
    expect(result).not.toBeNull()
    if (result) {
      // (1.01)^12 - 1 ≈ 0.1268
      expect(result.long.evAnnual).toBeCloseTo(0.1268, 2)
    }
  })

  it('annualizes daily EV correctly: 0.04% daily → ~10.6% annual', () => {
    const constMonthly = Array.from({ length: 60 }, () => 0.005)
    const constDaily = Array.from({ length: 60 }, () => 0.0004)
    const result = calcMultiScaleEV(constMonthly, constDaily)
    expect(result).not.toBeNull()
    if (result?.short) {
      // (1.0004)^252 - 1 ≈ 0.106
      expect(result.short.evAnnual).toBeCloseTo(0.106, 2)
    }
  })
})

describe('calcPortfolioMultiScaleEV', () => {
  // 60 個月、60 日報酬的簡單測試資料
  const stockA_monthly = Array.from({ length: 60 }, (_, i) => 0.01 + Math.sin(i) * 0.005)
  const stockB_monthly = Array.from({ length: 60 }, (_, i) => 0.005 + Math.cos(i) * 0.003)
  const stockA_daily = Array.from({ length: 60 }, (_, i) => 0.0005 + Math.sin(i * 0.1) * 0.002)
  const stockB_daily = Array.from({ length: 60 }, (_, i) => 0.0003 + Math.cos(i * 0.1) * 0.001)

  it('returns null when weighted monthly < 60', () => {
    // 只給 50 筆月報酬
    const a50 = stockA_monthly.slice(0, 50)
    const b50 = stockB_monthly.slice(0, 50)
    expect(calcPortfolioMultiScaleEV([a50, b50], [stockA_daily, stockB_daily], [0.5, 0.5])).toBeNull()
  })

  it('returns three scales when both monthly ≥ 60 and daily ≥ 60', () => {
    const result = calcPortfolioMultiScaleEV(
      [stockA_monthly, stockB_monthly],
      [stockA_daily, stockB_daily],
      [0.5, 0.5],
    )
    expect(result).not.toBeNull()
    if (result) {
      expect(result.short).not.toBeNull()
      expect(result.medium).not.toBeNull()
      expect(result.long).not.toBeNull()
    }
  })

  it('short = null when any stock daily < 60', () => {
    const stockB_daily_short = stockB_daily.slice(0, 50)  // 只有 50 筆
    const result = calcPortfolioMultiScaleEV(
      [stockA_monthly, stockB_monthly],
      [stockA_daily, stockB_daily_short],
      [0.5, 0.5],
    )
    expect(result).not.toBeNull()
    if (result) {
      expect(result.short).toBeNull()
      expect(result.medium).not.toBeNull()
      expect(result.long).not.toBeNull()
    }
  })

  it('weighted EV equals weighted average of stock EVs (sanity check)', () => {
    // 50/50 加權的兩支股票，組合 EV 應等於兩個 EV 的平均
    const constA = Array.from({ length: 60 }, () => 0.01)  // EV = 0.01
    const constB = Array.from({ length: 60 }, () => -0.005) // EV = -0.005
    const constDailyA = Array.from({ length: 60 }, () => 0.0005)
    const constDailyB = Array.from({ length: 60 }, () => -0.0002)
    const result = calcPortfolioMultiScaleEV(
      [constA, constB],
      [constDailyA, constDailyB],
      [0.5, 0.5],
    )
    expect(result).not.toBeNull()
    if (result) {
      // 加權月 EV = 0.5 * 0.01 + 0.5 * (-0.005) = 0.0025
      expect(result.long.ev.ev).toBeCloseTo(0.0025, 5)
    }
  })
})
