import { describe, it, expect } from 'vitest'
import { calcPearsonCorrelation, interpretCorrelation } from './correlation'

describe('calcPearsonCorrelation', () => {
  it('完全正相關 y = 2x', () => {
    const r = calcPearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])
    expect(r).toBeCloseTo(1.0, 4)
  })

  it('完全負相關 y = -x', () => {
    const r = calcPearsonCorrelation([1, 2, 3, 4, 5], [5, 4, 3, 2, 1])
    expect(r).toBeCloseTo(-1.0, 4)
  })

  it('無明顯相關', () => {
    const r = calcPearsonCorrelation([1, 2, 3, 4, 5], [3, 1, 4, 1, 2])
    expect(Math.abs(r)).toBeLessThan(0.5)
  })

  it('所有 xs 相同 → r = 0', () => {
    const r = calcPearsonCorrelation([5, 5, 5, 5], [1, 2, 3, 4])
    expect(r).toBe(0)
  })

  it('所有 ys 相同 → r = 0', () => {
    const r = calcPearsonCorrelation([1, 2, 3, 4], [7, 7, 7, 7])
    expect(r).toBe(0)
  })

  it('樣本只有 1 筆 → r = 0', () => {
    const r = calcPearsonCorrelation([5], [10])
    expect(r).toBe(0)
  })

  it('陣列長度不一致 → throw', () => {
    expect(() => calcPearsonCorrelation([1, 2, 3], [1, 2])).toThrow()
  })

  it('r 值範圍限制在 [-1, 1]', () => {
    const r = calcPearsonCorrelation([1, 2, 3], [2, 4, 6])
    expect(r).toBeGreaterThanOrEqual(-1)
    expect(r).toBeLessThanOrEqual(1)
  })
})

describe('interpretCorrelation', () => {
  it('r >= 0.7 → 強正相關', () => {
    expect(interpretCorrelation(0.75)).toContain('強正相關')
    expect(interpretCorrelation(1.0)).toContain('強正相關')
  })

  it('0.3 <= r < 0.7 → 中度正相關', () => {
    expect(interpretCorrelation(0.5)).toContain('中度正相關')
    expect(interpretCorrelation(0.3)).toContain('中度正相關')
  })

  it('-0.3 < r < 0.3 → 無顯著關聯', () => {
    expect(interpretCorrelation(0)).toContain('無顯著關聯')
    expect(interpretCorrelation(0.2)).toContain('無顯著關聯')
    expect(interpretCorrelation(-0.25)).toContain('無顯著關聯')
  })

  it('-0.7 < r <= -0.3 → 中度負相關', () => {
    expect(interpretCorrelation(-0.5)).toContain('中度負相關')
    expect(interpretCorrelation(-0.3)).toContain('中度負相關')
  })

  it('r <= -0.7 → 強負相關', () => {
    expect(interpretCorrelation(-0.8)).toContain('強負相關')
    expect(interpretCorrelation(-1.0)).toContain('強負相關')
  })
})
