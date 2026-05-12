import { describe, it, expect } from 'vitest'
import { fmtPct, colorByReturn, fmtMoney } from './format'

describe('fmtPct', () => {
  it('positive returns get + sign', () => {
    expect(fmtPct(0.0047)).toBe('+0.47%')
    expect(fmtPct(0.0559)).toBe('+5.59%')
  })

  it('negative returns use unicode minus −', () => {
    expect(fmtPct(-0.0559)).toBe('−5.59%')
    expect(fmtPct(-0.001)).toBe('−0.10%')
  })

  it('zero shows no sign', () => {
    expect(fmtPct(0)).toBe('0.00%')
  })

  it('respects digits argument', () => {
    expect(fmtPct(0.12345, 4)).toBe('+12.3450%')
    expect(fmtPct(-0.00005, 4)).toBe('−0.0050%')
  })

  it('NaN / Infinity returns 0.00%', () => {
    expect(fmtPct(NaN)).toBe('0.00%')
    expect(fmtPct(Infinity)).toBe('0.00%')
  })
})

describe('colorByReturn', () => {
  it('positive → red (台股紅漲)', () => {
    expect(colorByReturn(0.01)).toBe('red')
    expect(colorByReturn(0.5)).toBe('red')
  })

  it('negative → green (台股綠跌)', () => {
    expect(colorByReturn(-0.01)).toBe('green')
    expect(colorByReturn(-0.5)).toBe('green')
  })

  it('zero → default', () => {
    expect(colorByReturn(0)).toBe('default')
  })
})

describe('fmtMoney', () => {
  it('positive amounts get + sign and commas', () => {
    expect(fmtMoney(139500)).toBe('+139,500 元')
    expect(fmtMoney(1234567)).toBe('+1,234,567 元')
  })

  it('negative amounts use unicode minus', () => {
    expect(fmtMoney(-5200)).toBe('−5,200 元')
    expect(fmtMoney(-1000000)).toBe('−1,000,000 元')
  })

  it('zero shows no sign', () => {
    expect(fmtMoney(0)).toBe('0 元')
  })

  it('NaN / Infinity returns "0 元"', () => {
    expect(fmtMoney(NaN)).toBe('0 元')
    expect(fmtMoney(Infinity)).toBe('0 元')
  })

  it('respects digits argument', () => {
    expect(fmtMoney(1234.5678, 2)).toBe('+1,234.57 元')
  })
})
