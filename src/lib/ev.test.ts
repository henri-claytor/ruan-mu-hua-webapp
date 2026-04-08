import { describe, it, expect } from 'vitest'
import { calcEV } from './ev'

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
