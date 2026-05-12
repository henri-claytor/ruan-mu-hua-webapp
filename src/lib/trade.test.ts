import { describe, it, expect } from 'vitest'
import {
  calcPortfolioPerformance,
  calcStockStats,
  calcAllStockStats,
  classifyPerformanceQuadrant,
  daysBetween,
  holdingDaysHistogram,
  type Trade,
} from './trade'

function makeTrade(overrides: Partial<Trade> & { buyDate: string; sellDate: string; pnl: number }): Trade {
  return {
    id: overrides.id ?? `t-${Math.random()}`,
    stockId: overrides.stockId ?? '2330',
    stockName: overrides.stockName ?? '台積電',
    buyDate: overrides.buyDate,
    sellDate: overrides.sellDate,
    buyPrice: overrides.buyPrice ?? 100,
    sellPrice: overrides.sellPrice ?? 100,
    shares: overrides.shares ?? 1000,
    buyAmount: overrides.buyAmount ?? 100000,
    sellAmount: overrides.sellAmount ?? 100000 + overrides.pnl,
    pnl: overrides.pnl,
    returnRate: overrides.returnRate ?? overrides.pnl / 100000,
    note: overrides.note,
  }
}

describe('daysBetween', () => {
  it('calculates days correctly', () => {
    expect(daysBetween('2025-01-01', '2025-01-10')).toBe(9)
    expect(daysBetween('2025-01-01', '2025-01-01')).toBe(0)
    expect(daysBetween('2024-12-31', '2025-01-01')).toBe(1)
  })
})

describe('classifyPerformanceQuadrant', () => {
  it('Q1 when both high', () => {
    expect(classifyPerformanceQuadrant(2.0, 3.0)).toBe('Q1: 打法好・結果好')
    expect(classifyPerformanceQuadrant(1.5, 2.0)).toBe('Q1: 打法好・結果好')
  })

  it('Q2 when payoff low but profit factor high', () => {
    expect(classifyPerformanceQuadrant(1.0, 2.5)).toBe('Q2: 打法差・結果好（靠重倉或勝率撐場）')
  })

  it('Q3 when payoff high but profit factor low', () => {
    expect(classifyPerformanceQuadrant(2.0, 1.5)).toBe('Q3: 打法好・結果差（資金管理需改善）')
  })

  it('Q4 when both low', () => {
    expect(classifyPerformanceQuadrant(1.0, 1.0)).toBe('Q4: 打法差・結果差（全面檢討）')
  })

  it('Infinity (all wins) without nWins/nLosses params → Q1 (向後相容)', () => {
    expect(classifyPerformanceQuadrant(Infinity, Infinity)).toBe('Q1: 打法好・結果好')
    expect(classifyPerformanceQuadrant(Infinity, 3.0)).toBe('Q1: 打法好・結果好')
  })

  it('全勝（nWins > 0 且 nLosses === 0）→ 單向紀錄', () => {
    expect(classifyPerformanceQuadrant(Infinity, Infinity, 5, 0)).toBe('單向紀錄（全勝或全敗）')
    expect(classifyPerformanceQuadrant(Infinity, 3.0, 10, 0)).toBe('單向紀錄（全勝或全敗）')
  })

  it('全敗（nWins === 0 且 nLosses > 0）→ 單向紀錄', () => {
    expect(classifyPerformanceQuadrant(0, 0, 0, 3)).toBe('單向紀錄（全勝或全敗）')
    expect(classifyPerformanceQuadrant(0, 0, 0, 9)).toBe('單向紀錄（全勝或全敗）')
  })

  it('有勝有敗仍走既有 4 象限規則', () => {
    expect(classifyPerformanceQuadrant(2.0, 3.0, 5, 2)).toBe('Q1: 打法好・結果好')
    expect(classifyPerformanceQuadrant(1.0, 1.0, 5, 5)).toBe('Q4: 打法差・結果差（全面檢討）')
  })
})

describe('calcPortfolioPerformance', () => {
  it('returns null for empty trades', () => {
    expect(calcPortfolioPerformance([])).toBeNull()
  })

  it('counts nTrades / nWins / nLosses / nFlat correctly', () => {
    const trades = [
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 1000 }),
      makeTrade({ buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: -500 }),
      makeTrade({ buyDate: '2025-03-01', sellDate: '2025-04-01', pnl: 0 }),
      makeTrade({ buyDate: '2025-04-01', sellDate: '2025-05-01', pnl: 2000 }),
    ]
    const r = calcPortfolioPerformance(trades)!
    expect(r.nTrades).toBe(4)
    expect(r.nWins).toBe(2)
    expect(r.nLosses).toBe(1)
    expect(r.nFlat).toBe(1)
    expect(r.winRate).toBeCloseTo(0.5, 5)
  })

  it('totalPnl is sum of all pnl', () => {
    const trades = [
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 1500 }),
      makeTrade({ buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: -800 }),
      makeTrade({ buyDate: '2025-03-01', sellDate: '2025-04-01', pnl: 300 }),
    ]
    const r = calcPortfolioPerformance(trades)!
    expect(r.totalPnl).toBe(1000)
  })

  it('payoffRatio = avgWinReturnRate / abs(avgLossReturnRate)', () => {
    const trades = [
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 2000, returnRate: 0.02 }),
      makeTrade({ buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: -1000, returnRate: -0.01 }),
    ]
    const r = calcPortfolioPerformance(trades)!
    // avgWin 2% / |avgLoss 1%| = 2.0
    expect(r.payoffRatio).toBeCloseTo(2.0, 5)
  })

  it('payoffRatio = Infinity when no losses', () => {
    const trades = [
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 1000 }),
      makeTrade({ buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: 500 }),
    ]
    const r = calcPortfolioPerformance(trades)!
    expect(r.payoffRatio).toBe(Infinity)
    expect(r.profitFactor).toBe(Infinity)
  })

  it('profitFactor = sum(win pnl) / abs(sum(loss pnl))', () => {
    const trades = [
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 3000 }),
      makeTrade({ buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: 2000 }),
      makeTrade({ buyDate: '2025-03-01', sellDate: '2025-04-01', pnl: -1500 }),
      makeTrade({ buyDate: '2025-04-01', sellDate: '2025-05-01', pnl: -500 }),
    ]
    const r = calcPortfolioPerformance(trades)!
    // win sum 5000 / |loss sum -2000| = 2.5
    expect(r.profitFactor).toBeCloseTo(2.5, 5)
  })

  it('maxDrawdown computed by cumulative pnl', () => {
    // Cumulative: +1000 → +3000 (peak) → +1500 (drawdown -1500) → +800 (peak still 3000, dd -2200) → +2500
    const trades = [
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 1000 }),
      makeTrade({ buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: 2000 }),
      makeTrade({ buyDate: '2025-03-01', sellDate: '2025-04-01', pnl: -1500 }),
      makeTrade({ buyDate: '2025-04-01', sellDate: '2025-05-01', pnl: -700 }),
      makeTrade({ buyDate: '2025-05-01', sellDate: '2025-06-01', pnl: 1700 }),
    ]
    const r = calcPortfolioPerformance(trades)!
    expect(r.maxDrawdown).toBe(-2200)
    // peak before dd was 3000 → pct = -2200/3000
    expect(r.maxDrawdownPct).toBeCloseTo(-2200 / 3000, 5)
  })

  it('maxDrawdownPct = 0 when never positive peak', () => {
    const trades = [
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: -500 }),
      makeTrade({ buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: -300 }),
    ]
    const r = calcPortfolioPerformance(trades)!
    expect(r.maxDrawdownPct).toBe(0)
  })

  it('annualizedReturn for 1-year operation matches overallReturn', () => {
    // Single trade, 365 days, overall return 10% → annualized ≈ 10%
    const trades = [
      makeTrade({
        buyDate: '2025-01-01',
        sellDate: '2025-12-31',
        pnl: 10000,
        buyAmount: 100000,
        returnRate: 0.10,
      }),
    ]
    const r = calcPortfolioPerformance(trades)!
    expect(r.overallReturn).toBeCloseTo(0.10, 5)
    expect(r.annualizedReturn).toBeCloseTo(0.10, 2)
  })

  it('holding days computed from buyDate / sellDate', () => {
    const trades = [
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-01-10', pnl: 100 }), // 9
      makeTrade({ buyDate: '2025-02-01', sellDate: '2025-02-21', pnl: -50 }), // 20
    ]
    const r = calcPortfolioPerformance(trades)!
    expect(r.avgHoldingDays).toBeCloseTo(14.5, 5)
    expect(r.maxHoldingDays).toBe(20)
    expect(r.minHoldingDays).toBe(9)
  })

  it('quadrant assignment via payoff × profit factor', () => {
    const trades = [
      // 高賠率：贏的幅度 5%、輸的幅度 2%
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 5000, returnRate: 0.05 }),
      makeTrade({ buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: 5000, returnRate: 0.05 }),
      makeTrade({ buyDate: '2025-03-01', sellDate: '2025-04-01', pnl: -2000, returnRate: -0.02 }),
    ]
    const r = calcPortfolioPerformance(trades)!
    // payoff = 0.05 / 0.02 = 2.5 (>=1.5)
    // profit factor = 10000 / 2000 = 5 (>=2.0)
    expect(r.quadrant).toBe('Q1: 打法好・結果好')
  })

  it('period dates from min(buy) and max(sell)', () => {
    const trades = [
      makeTrade({ buyDate: '2025-03-01', sellDate: '2025-09-15', pnl: 500 }),
      makeTrade({ buyDate: '2025-01-15', sellDate: '2025-06-30', pnl: -200 }),
    ]
    const r = calcPortfolioPerformance(trades)!
    expect(r.periodStart).toBe('2025-01-15')
    expect(r.periodEnd).toBe('2025-09-15')
  })
})

describe('calcStockStats', () => {
  it('returns null when no trades for stockId', () => {
    const trades = [makeTrade({ buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 1000 })]
    expect(calcStockStats(trades, '0000', 1000)).toBeNull()
  })

  it('aggregates multiple trades of same stock correctly', () => {
    const trades = [
      makeTrade({ stockId: '2330', stockName: '台積電', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 5000, returnRate: 0.05 }),
      makeTrade({ stockId: '2330', stockName: '台積電', buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: -2000, returnRate: -0.02 }),
      makeTrade({ stockId: '2330', stockName: '台積電', buyDate: '2025-03-01', sellDate: '2025-04-01', pnl: 3000, returnRate: 0.03 }),
    ]
    const stats = calcStockStats(trades, '2330', 6000)!
    expect(stats.nTrades).toBe(3)
    expect(stats.nWins).toBe(2)
    expect(stats.nLosses).toBe(1)
    expect(stats.totalPnl).toBe(6000)
    expect(stats.winRate).toBeCloseTo(2 / 3, 5)
    expect(stats.payoffRatio).toBeCloseTo((0.04) / 0.02, 5) // avg win 4% / avg loss 2%
    expect(stats.profitFactor).toBeCloseTo(8000 / 2000, 5)
  })

  it('all-win stock: payoff=Infinity, quadrant=單向紀錄', () => {
    const trades = [
      makeTrade({ stockId: '2330', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 1000 }),
      makeTrade({ stockId: '2330', buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: 500 }),
    ]
    const stats = calcStockStats(trades, '2330', 1500)!
    expect(stats.payoffRatio).toBe(Infinity)
    expect(stats.profitFactor).toBe(Infinity)
    expect(stats.quadrant).toBe('單向紀錄（全勝或全敗）')
  })

  it('all-loss stock: quadrant=Q4', () => {
    const trades = [
      makeTrade({ stockId: '2317', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: -500 }),
      makeTrade({ stockId: '2317', buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: -300 }),
    ]
    const stats = calcStockStats(trades, '2317', -800)!
    expect(stats.winRate).toBe(0)
    expect(stats.payoffRatio).toBe(0)
    expect(stats.profitFactor).toBe(0)
    expect(stats.quadrant).toBe('單向紀錄（全勝或全敗）')
  })

  it('pnlContribution computed correctly', () => {
    const trades = [
      makeTrade({ stockId: '2330', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 8000 }),
      makeTrade({ stockId: '2317', buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: 2000 }),
    ]
    const stats = calcStockStats(trades, '2330', 10000)!
    expect(stats.pnlContribution).toBeCloseTo(0.8, 5)
  })

  it('pnlContribution = 0 when total portfolio pnl is 0', () => {
    const trades = [
      makeTrade({ stockId: '2330', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 1000 }),
      makeTrade({ stockId: '2317', buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: -1000 }),
    ]
    const stats = calcStockStats(trades, '2330', 0)!
    expect(stats.pnlContribution).toBe(0)
  })
})

describe('calcAllStockStats', () => {
  it('returns empty array for no trades', () => {
    expect(calcAllStockStats([])).toEqual([])
  })

  it('aggregates trades by unique stockId', () => {
    const trades = [
      makeTrade({ stockId: '2330', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 1000 }),
      makeTrade({ stockId: '2317', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 500 }),
      makeTrade({ stockId: '2330', buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: 2000 }),
    ]
    const all = calcAllStockStats(trades)
    expect(all).toHaveLength(2)
    const codes = all.map((s) => s.stockId).sort()
    expect(codes).toEqual(['2317', '2330'])
  })

  it('sorts by |totalPnl| descending', () => {
    const trades = [
      makeTrade({ stockId: 'A', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 500 }),
      makeTrade({ stockId: 'B', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: -3000 }),
      makeTrade({ stockId: 'C', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 1500 }),
    ]
    const all = calcAllStockStats(trades)
    expect(all.map((s) => s.stockId)).toEqual(['B', 'C', 'A'])
  })
})

describe('holdingDaysHistogram', () => {
  it('empty array returns 6 buckets all zero', () => {
    const r = holdingDaysHistogram([])
    expect(r).toHaveLength(6)
    expect(r.every((b) => b.wins === 0 && b.losses === 0)).toBe(true)
    expect(r.map((b) => b.bucket)).toEqual([
      '0-7 天', '8-14 天', '15-30 天', '31-60 天', '61-90 天', '90+ 天',
    ])
  })

  it('assigns trades to correct buckets by holding days', () => {
    const trades = [
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-01-05', pnl: 100 }),  // 4 天 → 0-7
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-01-12', pnl: -50 }), // 11 天 → 8-14
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-01-25', pnl: 200 }), // 24 天 → 15-30
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-04-15', pnl: 500 }), // 104 天 → 90+
    ]
    const r = holdingDaysHistogram(trades)
    expect(r[0].wins).toBe(1)  // 0-7
    expect(r[1].losses).toBe(1) // 8-14
    expect(r[2].wins).toBe(1)  // 15-30
    expect(r[5].wins).toBe(1)  // 90+
  })

  it('separates wins and losses in same bucket', () => {
    const trades = [
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-01-05', pnl: 100, returnRate: 0.05 }),
      makeTrade({ buyDate: '2025-02-01', sellDate: '2025-02-05', pnl: -50, returnRate: -0.02 }),
      makeTrade({ buyDate: '2025-03-01', sellDate: '2025-03-04', pnl: 200, returnRate: 0.03 }),
    ]
    const r = holdingDaysHistogram(trades)
    expect(r[0].wins).toBe(2)
    expect(r[0].losses).toBe(1)
    expect(r[0].avgWinReturn).toBeCloseTo((0.05 + 0.03) / 2, 5)
    expect(r[0].avgLossReturn).toBeCloseTo(-0.02, 5)
  })
})
