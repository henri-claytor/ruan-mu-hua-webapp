import { describe, it, expect } from 'vitest'
import { parseReturns } from './utils'

describe('parseReturns', () => {
  it('parses newline-separated decimals', () => {
    const result = parseReturns('0.0412\n-0.0231\n0.0587')
    expect(result).toEqual([0.0412, -0.0231, 0.0587])
  })

  it('parses comma-separated decimals', () => {
    const result = parseReturns('0.04,-0.02,0.05')
    expect(result).toEqual([0.04, -0.02, 0.05])
  })

  it('parses percentage format (3.12% → 0.0312)', () => {
    const result = parseReturns('3.12%\n-2.31%\n5.87%')
    expect(result[0]).toBeCloseTo(0.0312)
    expect(result[1]).toBeCloseTo(-0.0231)
    expect(result[2]).toBeCloseTo(0.0587)
  })

  it('parses Tab-separated values (from Excel)', () => {
    const result = parseReturns('0.04\t-0.02\t0.05')
    expect(result).toEqual([0.04, -0.02, 0.05])
  })

  it('parses mixed newline and comma', () => {
    const result = parseReturns('0.04\n-0.02,0.05')
    expect(result).toHaveLength(3)
  })

  it('filters empty lines', () => {
    const result = parseReturns('\n\n0.04\n\n-0.02\n')
    expect(result).toHaveLength(2)
  })

  it('filters non-numeric header text', () => {
    const result = parseReturns('月報酬率\n0.04\n-0.02')
    expect(result).toEqual([0.04, -0.02])
  })

  it('returns empty array for empty input', () => {
    expect(parseReturns('')).toEqual([])
    expect(parseReturns('   ')).toEqual([])
  })
})
