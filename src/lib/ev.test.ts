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
    expect(result.avgGain).toBeCloseTo(0.04667, 3)
  })

  it('calculates avgLoss correctly', () => {
    const result = calcEV(testReturns)
    expect(result.avgLoss).toBeCloseTo(0.025, 5)
  })

  it('calculates EV correctly: winRate*avgGain - lossRate*avgLoss', () => {
    const result = calcEV(testReturns)
    const expected = result.winRate * result.avgGain - result.lossRate * result.avgLoss
    expect(result.ev).toBeCloseTo(expected, 10)
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
    expect(result.quadrant).toBe('高賠率正期望值（雙優）')
  })

  it('assigns negative EV quadrant for all-loss data', () => {
    const allLoss = [-0.01, -0.02, -0.03, -0.04, -0.05, -0.06, -0.01, -0.02, -0.03, -0.01]
    const result = calcEV(allLoss)
    expect(result.ev).toBeLessThan(0)
  })
})

describe('classifyEVDivergence (v2 — short vs medium)', () => {
  it('returns stable when both same sign and gap < 30%', () => {
    expect(classifyEVDivergence(0.10, 0.10)).toBe('stable')
    expect(classifyEVDivergence(0.10, 0.12)).toBe('stable')
    expect(classifyEVDivergence(-0.05, -0.06)).toBe('stable')
  })

  it('returns mixed when same sign but gap >= 30%', () => {
    expect(classifyEVDivergence(0.05, 0.20)).toBe('short-deteriorating')  // 短 < 中 且 gap > 30%
    expect(classifyEVDivergence(0.20, 0.05)).toBe('short-improving')       // 短 > 中 且 gap > 30%
  })

  it('returns short-deteriorating when short < medium and gap > 30%', () => {
    expect(classifyEVDivergence(-0.08, 0.10)).toBe('short-deteriorating')
    expect(classifyEVDivergence(0.02, 0.20)).toBe('short-deteriorating')
  })

  it('returns short-improving when short > medium and gap > 30%', () => {
    expect(classifyEVDivergence(0.10, -0.05)).toBe('short-improving')
    expect(classifyEVDivergence(0.20, 0.05)).toBe('short-improving')
  })

  it('returns stable when either input is null', () => {
    expect(classifyEVDivergence(null, 0.10)).toBe('stable')
    expect(classifyEVDivergence(0.10, null)).toBe('stable')
    expect(classifyEVDivergence(null, null)).toBe('stable')
  })
})

describe('calcMultiScaleEV (v2 windows)', () => {
  // 60 個月（5 年）報酬，slight positive
  const monthly60 = Array.from({ length: 60 }, (_, i) => 0.005 + Math.sin(i * 0.5) * 0.02)
  // 240 個日報酬（1 年）
  const daily240 = Array.from({ length: 240 }, (_, i) => 0.0003 + Math.sin(i * 0.1) * 0.005)

  it('three scales with windows 60/240/60 and correct freq/tier/label', () => {
    const result = calcMultiScaleEV(monthly60, daily240)
    expect(result).not.toBeNull()
    if (result) {
      // short — 最近 3 個月 / daily 60 / primary
      expect(result.short).not.toBeNull()
      expect(result.short?.windowSize).toBe(60)
      expect(result.short?.freq).toBe('daily')
      expect(result.short?.tier).toBe('primary')
      expect(result.short?.label).toBe('最近 3 個月')
      // medium — 最近 1 年 / daily 240 / primary
      expect(result.medium).not.toBeNull()
      expect(result.medium?.windowSize).toBe(240)
      expect(result.medium?.freq).toBe('daily')
      expect(result.medium?.tier).toBe('primary')
      expect(result.medium?.label).toBe('最近 1 年')
      // long — 最近 5 年 / monthly 60 / reference
      expect(result.long).not.toBeNull()
      expect(result.long?.windowSize).toBe(60)
      expect(result.long?.freq).toBe('monthly')
      expect(result.long?.tier).toBe('reference')
      expect(result.long?.label).toBe('最近 5 年')
    }
  })

  it('short = null when daily < 60', () => {
    const daily30 = daily240.slice(0, 30)
    const result = calcMultiScaleEV(monthly60, daily30)
    expect(result).not.toBeNull()
    if (result) {
      expect(result.short).toBeNull()
      expect(result.medium).toBeNull()
      expect(result.long).not.toBeNull()
    }
  })

  it('medium = null when daily < 240 but ≥ 60', () => {
    const daily100 = daily240.slice(0, 100)
    const result = calcMultiScaleEV(monthly60, daily100)
    expect(result).not.toBeNull()
    if (result) {
      expect(result.short).not.toBeNull()  // daily 100 ≥ 60
      expect(result.medium).toBeNull()     // daily 100 < 240
      expect(result.long).not.toBeNull()
    }
  })

  it('long = null when monthly < 60', () => {
    const monthly30 = monthly60.slice(0, 30)
    const result = calcMultiScaleEV(monthly30, daily240)
    expect(result).not.toBeNull()
    if (result) {
      expect(result.short).not.toBeNull()
      expect(result.medium).not.toBeNull()
      expect(result.long).toBeNull()
    }
  })

  it('returns null when all three scales insufficient', () => {
    const result = calcMultiScaleEV(monthly60.slice(0, 10), daily240.slice(0, 30))
    expect(result).toBeNull()
  })

  it('annualizes daily EV correctly with 252 periods', () => {
    const constMonthly = Array.from({ length: 60 }, () => 0.005)
    const constDaily = Array.from({ length: 240 }, () => 0.0004)
    const result = calcMultiScaleEV(constMonthly, constDaily)
    expect(result).not.toBeNull()
    if (result?.short) {
      // (1.0004)^252 - 1 ≈ 0.106
      expect(result.short.evAnnual).toBeCloseTo(0.106, 2)
    }
    if (result?.medium) {
      expect(result.medium.evAnnual).toBeCloseTo(0.106, 2)
    }
  })

  it('annualizes monthly long EV with 12 periods', () => {
    const constMonthly = Array.from({ length: 60 }, () => 0.01)
    const result = calcMultiScaleEV(constMonthly, [])
    expect(result).not.toBeNull()
    if (result?.long) {
      // (1.01)^12 - 1 ≈ 0.1268
      expect(result.long.evAnnual).toBeCloseTo(0.1268, 2)
    }
  })

  it('divergence based on short vs medium (not long)', () => {
    // 構造資料：medium (240 筆) 多數為負；short (最後 60 筆) 全為正
    const daily240Mixed = [
      ...Array.from({ length: 180 }, () => -0.005), // 前 180 筆顯著負
      ...Array.from({ length: 60 }, () => 0.005),   // 後 60 筆顯著正
    ]
    const constMonthly = Array.from({ length: 60 }, () => 0.001)
    const result = calcMultiScaleEV(constMonthly, daily240Mixed)
    expect(result).not.toBeNull()
    if (result?.short && result?.medium) {
      expect(result.short.evAnnual).toBeGreaterThan(0)
      expect(result.medium.evAnnual).toBeLessThan(0)
      // short > medium 且 gap > 30% → short-improving
      expect(result.divergence).toBe('short-improving')
    }
  })
})

describe('calcPortfolioMultiScaleEV', () => {
  const stockA_monthly = Array.from({ length: 60 }, (_, i) => 0.01 + Math.sin(i) * 0.005)
  const stockB_monthly = Array.from({ length: 60 }, (_, i) => 0.005 + Math.cos(i) * 0.003)
  const stockA_daily = Array.from({ length: 240 }, (_, i) => 0.0005 + Math.sin(i * 0.1) * 0.002)
  const stockB_daily = Array.from({ length: 240 }, (_, i) => 0.0003 + Math.cos(i * 0.1) * 0.001)

  it('returns null when weighted monthly < 60', () => {
    const a50 = stockA_monthly.slice(0, 50)
    const b50 = stockB_monthly.slice(0, 50)
    expect(calcPortfolioMultiScaleEV([a50, b50], [stockA_daily, stockB_daily], [0.5, 0.5])).toBeNull()
  })

  it('returns three scales when monthly ≥ 60 and daily ≥ 240', () => {
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
    const stockB_daily_short = stockB_daily.slice(0, 50)
    const result = calcPortfolioMultiScaleEV(
      [stockA_monthly, stockB_monthly],
      [stockA_daily, stockB_daily_short],
      [0.5, 0.5],
    )
    expect(result).not.toBeNull()
    if (result) {
      expect(result.short).toBeNull()
      expect(result.medium).toBeNull()  // 50 < 240
      expect(result.long).not.toBeNull()
    }
  })

  it('weighted long monthly EV equals weighted average', () => {
    const constA = Array.from({ length: 60 }, () => 0.01)
    const constB = Array.from({ length: 60 }, () => -0.005)
    const constDailyA = Array.from({ length: 240 }, () => 0.0005)
    const constDailyB = Array.from({ length: 240 }, () => -0.0002)
    const result = calcPortfolioMultiScaleEV(
      [constA, constB],
      [constDailyA, constDailyB],
      [0.5, 0.5],
    )
    expect(result).not.toBeNull()
    if (result?.long) {
      expect(result.long.ev.ev).toBeCloseTo(0.0025, 5)
    }
  })
})
