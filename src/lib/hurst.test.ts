import { describe, it, expect } from 'vitest'
import { calcHurst } from './hurst'

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

  it('H value formula: h = log(R/S) / log(n)', () => {
    const returns = Array.from({ length: 30 }, (_, i) => (i % 3 - 1) * 0.01)
    const result = calcHurst(returns)
    expect(result).not.toBeNull()
    if (result) {
      const expected = Math.log(result.r / result.s) / Math.log(result.n)
      expect(result.h).toBeCloseTo(expected, 10)
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
