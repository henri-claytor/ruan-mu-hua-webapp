import { describe, it, expect } from 'vitest'
import { calcVaR } from './var'

// Generate 120 data points for realistic testing
function makeReturns(): number[] {
  const data: number[] = []
  for (let i = 0; i < 120; i++) {
    // Values from -0.12 to +0.12, evenly spaced
    data.push(-0.12 + (i * 0.24) / 119)
  }
  return data
}

describe('calcVaR', () => {
  it('returns sorted array in ascending order', () => {
    const returns = makeReturns()
    const result = calcVaR(returns)
    for (let i = 1; i < result.sorted.length; i++) {
      expect(result.sorted[i]).toBeGreaterThanOrEqual(result.sorted[i - 1])
    }
  })

  it('var95 is less than var99 (more negative)', () => {
    const returns = makeReturns()
    const result = calcVaR(returns)
    // var95 is at 5% percentile, var99 is at 1% → var99 should be more negative
    expect(result.var99).toBeLessThanOrEqual(result.var95)
  })

  it('VaR values are within the data range', () => {
    const returns = makeReturns()
    const result = calcVaR(returns)
    const min = Math.min(...returns)
    const max = Math.max(...returns)
    expect(result.var95).toBeGreaterThanOrEqual(min)
    expect(result.var95).toBeLessThanOrEqual(max)
    expect(result.var99).toBeGreaterThanOrEqual(min)
    expect(result.var99).toBeLessThanOrEqual(max)
  })

  it('sorted length equals input length', () => {
    const returns = makeReturns()
    const result = calcVaR(returns)
    expect(result.sorted.length).toBe(returns.length)
  })
})
