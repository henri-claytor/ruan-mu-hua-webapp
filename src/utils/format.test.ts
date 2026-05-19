import { describe, it, expect } from 'vitest'
import { fmtPct, colorByReturn, fmtMoney, fmtWinRate, fmtRatio, fmtWan } from './format'

describe('fmtPct (預設 1 位小數)', () => {
  it('positive returns get + sign', () => {
    expect(fmtPct(0.123)).toBe('+12.3%')
    expect(fmtPct(0.0559)).toBe('+5.6%')
  })

  it('negative returns use unicode minus −', () => {
    expect(fmtPct(-0.0559)).toBe('−5.6%')
    expect(fmtPct(-0.045)).toBe('−4.5%')
  })

  it('zero shows no sign with 1-decimal default', () => {
    expect(fmtPct(0)).toBe('0.0%')
  })

  it('respects explicit digits argument', () => {
    expect(fmtPct(0.013253, 4)).toBe('+1.3253%')
    expect(fmtPct(-0.00005, 4)).toBe('−0.0050%')
    expect(fmtPct(0.5, 0)).toBe('+50%')
  })

  it('NaN / Infinity returns 0.0%', () => {
    expect(fmtPct(NaN)).toBe('0.0%')
    expect(fmtPct(Infinity)).toBe('0.0%')
  })
})

describe('fmtWinRate', () => {
  it('rounds to 0 decimals', () => {
    expect(fmtWinRate(0.6)).toBe('60%')
    expect(fmtWinRate(0.5833)).toBe('58%')
    expect(fmtWinRate(0.5)).toBe('50%')
  })

  it('NaN / Infinity returns —', () => {
    expect(fmtWinRate(NaN)).toBe('—')
    expect(fmtWinRate(Infinity)).toBe('—')
  })

  it('no plus/minus sign', () => {
    expect(fmtWinRate(0.4)).toBe('40%')
  })
})

describe('fmtRatio', () => {
  it('2 decimals by default', () => {
    expect(fmtRatio(1.4267)).toBe('1.43')
    expect(fmtRatio(0.62)).toBe('0.62')
    expect(fmtRatio(1.7)).toBe('1.70')
  })

  it('respects digits argument', () => {
    expect(fmtRatio(1.4267, 3)).toBe('1.427')
    expect(fmtRatio(1.4267, 0)).toBe('1')
  })

  it('Infinity returns ∞', () => {
    expect(fmtRatio(Infinity)).toBe('∞')
    expect(fmtRatio(NaN)).toBe('∞')
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

describe('fmtMoney (0 位小數 + 千分位)', () => {
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

describe('fmtWan', () => {
  it('converts to 萬 with 1 decimal', () => {
    expect(fmtWan(285000)).toBe('28.5 萬')
    expect(fmtWan(1000000)).toBe('100.0 萬')
    expect(fmtWan(-50000)).toBe('-5.0 萬')
  })

  it('Infinity returns ∞', () => {
    expect(fmtWan(Infinity)).toBe('∞')
    expect(fmtWan(NaN)).toBe('∞')
  })
})
