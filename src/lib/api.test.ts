import { describe, it, expect } from 'vitest'
import { parsePercentString } from './api'

describe('parsePercentString', () => {
  it('parses a plain numeric string', () => {
    expect(parsePercentString('5.87')).toBeCloseTo(0.0587)
  })

  it('parses a negative value', () => {
    expect(parsePercentString('-2.31')).toBeCloseTo(-0.0231)
  })

  it('parses a string with a percent sign', () => {
    expect(parsePercentString('3.12%')).toBeCloseTo(0.0312)
  })

  it('returns NaN for empty string', () => {
    expect(parsePercentString('')).toBeNaN()
  })

  it('returns NaN for double-dash placeholder', () => {
    expect(parsePercentString('--')).toBeNaN()
  })

  it('returns NaN for N/A', () => {
    expect(parsePercentString('N/A')).toBeNaN()
  })

  it('returns NaN for non-numeric string', () => {
    expect(parsePercentString('abc')).toBeNaN()
  })

  it('handles zero correctly', () => {
    expect(parsePercentString('0')).toBe(0)
  })

  it('handles large positive value', () => {
    expect(parsePercentString('120.5')).toBeCloseTo(1.205)
  })

  it('handles whitespace-padded string', () => {
    expect(parsePercentString('  4.20  ')).toBeCloseTo(0.042)
  })
})

describe('NaN filtering in return arrays', () => {
  it('filters NaN values from an array', () => {
    const values = ['5.87', '--', '-2.31', 'N/A', '0.0'].map(parsePercentString)
    const filtered = values.filter((v) => !isNaN(v))
    expect(filtered).toHaveLength(3)
    expect(filtered[0]).toBeCloseTo(0.0587)
    expect(filtered[1]).toBeCloseTo(-0.0231)
    expect(filtered[2]).toBe(0)
  })

  it('returns empty array when all values are invalid', () => {
    const values = ['--', 'N/A', '', 'abc'].map(parsePercentString)
    const filtered = values.filter((v) => !isNaN(v))
    expect(filtered).toHaveLength(0)
  })
})
