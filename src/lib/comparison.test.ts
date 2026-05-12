import { describe, it, expect } from 'vitest'
import {
  compareEV,
  compareVaR,
  compareHurstCategory,
  categorizeHurst,
  getOverallVerdict,
  getVaROverallVerdict,
} from './comparison'

describe('compareEV', () => {
  it('same sign (both positive) → aligned', () => {
    expect(compareEV(0.05, 0.03)).toBe('aligned')
  })
  it('same sign (both negative) → aligned', () => {
    expect(compareEV(-0.02, -0.01)).toBe('aligned')
  })
  it('opposite signs → opposed', () => {
    expect(compareEV(0.05, -0.01)).toBe('opposed')
    expect(compareEV(-0.02, 0.03)).toBe('opposed')
  })
  it('zero stock EV with positive portfolio → aligned (0 視為正方向)', () => {
    expect(compareEV(0, 0.01)).toBe('aligned')
  })
  it('null stock EV → na', () => {
    expect(compareEV(null, 0.05)).toBe('na')
    expect(compareEV(undefined, 0.05)).toBe('na')
  })
})

describe('compareVaR', () => {
  it('stock VaR > 1.1x portfolio → higher-risk', () => {
    // portfolio -5%, stock -7% (ratio 1.4)
    expect(compareVaR(-0.07, -0.05)).toBe('higher-risk')
  })
  it('stock VaR < 0.9x portfolio → lower-risk', () => {
    expect(compareVaR(-0.04, -0.05)).toBe('lower-risk')
  })
  it('stock VaR in 0.9–1.1x range → similar', () => {
    expect(compareVaR(-0.052, -0.05)).toBe('similar')
    expect(compareVaR(-0.048, -0.05)).toBe('similar')
  })
  it('null stock VaR → na', () => {
    expect(compareVaR(null, -0.05)).toBe('na')
  })
  it('portfolio VaR = 0 → similar (避免除以零)', () => {
    expect(compareVaR(-0.01, 0)).toBe('similar')
  })
})

describe('categorizeHurst', () => {
  it('H > 0.6 → trending', () => {
    expect(categorizeHurst(0.7)).toBe('trending')
    expect(categorizeHurst(0.61)).toBe('trending')
  })
  it('H < 0.4 → mean-reverting', () => {
    expect(categorizeHurst(0.3)).toBe('mean-reverting')
    expect(categorizeHurst(0.39)).toBe('mean-reverting')
  })
  it('0.4 ≤ H ≤ 0.6 → random', () => {
    expect(categorizeHurst(0.5)).toBe('random')
    expect(categorizeHurst(0.4)).toBe('random')
    expect(categorizeHurst(0.6)).toBe('random')
  })
})

describe('compareHurstCategory', () => {
  it('same category → aligned', () => {
    expect(compareHurstCategory(0.7, 0.65)).toBe('aligned')  // 都 trending
    expect(compareHurstCategory(0.3, 0.35)).toBe('aligned')  // 都 mean-reverting
  })
  it('different category → opposed', () => {
    expect(compareHurstCategory(0.7, 0.45)).toBe('opposed')  // trending vs random
    expect(compareHurstCategory(0.3, 0.7)).toBe('opposed')   // reverting vs trending
  })
  it('null stock H → na', () => {
    expect(compareHurstCategory(null, 0.5)).toBe('na')
  })
})

describe('getOverallVerdict', () => {
  it('全 aligned → 一致', () => {
    expect(getOverallVerdict(['aligned', 'aligned', 'aligned'])).toBe('一致')
  })
  it('全 opposed → 全對立', () => {
    expect(getOverallVerdict(['opposed', 'opposed', 'opposed'])).toBe('全對立')
  })
  it('混合 → 部分對立', () => {
    expect(getOverallVerdict(['aligned', 'opposed', 'aligned'])).toBe('部分對立')
  })
  it('全 na → 資料不足', () => {
    expect(getOverallVerdict(['na', 'na', 'na'])).toBe('資料不足')
  })
  it('部分 na 但其餘 aligned → 一致', () => {
    expect(getOverallVerdict(['aligned', 'na', 'aligned'])).toBe('一致')
  })
})

describe('getVaROverallVerdict', () => {
  it('兩個都 higher-risk → 拉高風險', () => {
    expect(getVaROverallVerdict('higher-risk', 'higher-risk')).toBe('拉高風險')
  })
  it('兩個都 lower-risk → 降低風險', () => {
    expect(getVaROverallVerdict('lower-risk', 'lower-risk')).toBe('降低風險')
  })
  it('兩個都 similar → 接近組合', () => {
    expect(getVaROverallVerdict('similar', 'similar')).toBe('接近組合')
  })
  it('混合 → 混合', () => {
    expect(getVaROverallVerdict('higher-risk', 'lower-risk')).toBe('混合')
  })
  it('全 na → 資料不足', () => {
    expect(getVaROverallVerdict('na', 'na')).toBe('資料不足')
  })
})
