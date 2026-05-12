import { describe, it, expect } from 'vitest'
import { buildRecommendations } from './recommendations'
import { diagnose } from './diagnosis'
import { calcPortfolioPerformance, calcAllStockStats, type Trade } from './trade'

function makeTrade(overrides: Partial<Trade> & { buyDate: string; sellDate: string; pnl: number; stockId?: string }): Trade {
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

function build(trades: Trade[]) {
  const perf = calcPortfolioPerformance(trades)
  const stocks = calcAllStockStats(trades)
  const diagnoses = diagnose(trades, perf, stocks)
  return buildRecommendations(diagnoses, stocks, perf)
}

describe('buildRecommendations', () => {
  it('returns empty array for no trades', () => {
    expect(buildRecommendations([], [], null)).toEqual([])
  })

  it('always includes 追蹤更多績效指標 when trades exist', () => {
    const trades = [
      makeTrade({ stockId: 'A', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 1000 }),
    ]
    const recs = build(trades)
    expect(recs.map((r) => r.id)).toContain('rec-track-more-metrics')
    expect(recs[recs.length - 1].id).toBe('rec-track-more-metrics') // priority 9 → 最後
  })

  it('produces rec-stop-loss when stop-loss-discipline triggered', () => {
    const trades: Trade[] = [
      makeTrade({ stockId: 'WIN', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 20000 }),
    ]
    for (let i = 0; i < 3; i++) {
      trades.push(makeTrade({
        stockId: `L${i}`,
        stockName: `輸家${i}`,
        buyDate: '2025-01-01',
        sellDate: '2025-02-01',
        pnl: -1000,
        returnRate: -0.01,
      }))
    }
    // 讓每個 loser 有 3 筆使 stock-all-loss-3plus 觸發
    for (let i = 0; i < 3; i++) {
      for (let j = 1; j < 3; j++) {
        trades.push(makeTrade({
          stockId: `L${i}`,
          stockName: `輸家${i}`,
          buyDate: `2025-0${j + 1}-01`,
          sellDate: `2025-0${j + 1}-15`,
          pnl: -1000,
          returnRate: -0.01,
        }))
      }
    }
    const recs = build(trades)
    const stop = recs.find((r) => r.id === 'rec-stop-loss')
    expect(stop).toBeDefined()
    expect(stop!.priority).toBe(1)
    // body 應含全敗標的名稱
    expect(stop!.body).toContain('輸家0')
  })

  it('produces per-stock rec-low-payoff for each stock-low-payoff diagnosis', () => {
    // 兩檔個股觸發 stock-low-payoff
    const trades: Trade[] = []
    for (const sid of ['BAD1', 'BAD2']) {
      trades.push(makeTrade({ stockId: sid, stockName: sid, buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 100, returnRate: 0.01 }))
      trades.push(makeTrade({ stockId: sid, stockName: sid, buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: 100, returnRate: 0.01 }))
      trades.push(makeTrade({ stockId: sid, stockName: sid, buyDate: '2025-03-01', sellDate: '2025-04-01', pnl: -200, returnRate: -0.02 }))
    }
    const recs = build(trades)
    const lowPayoffRecs = recs.filter((r) => r.id.startsWith('rec-low-payoff-'))
    expect(lowPayoffRecs.length).toBe(2)
    expect(lowPayoffRecs.every((r) => r.priority === 2)).toBe(true)
    expect(lowPayoffRecs[0].body).toMatch(/賠率/)
  })

  it('produces rec-money-mgmt for stock-money-management diagnosis', () => {
    const trades = [
      makeTrade({ stockId: 'MM', stockName: 'MM', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 1000, returnRate: 0.05 }),
      makeTrade({ stockId: 'MM', stockName: 'MM', buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: -2000, returnRate: -0.02 }),
      makeTrade({ stockId: 'MM', stockName: 'MM', buyDate: '2025-03-01', sellDate: '2025-04-01', pnl: -2000, returnRate: -0.02 }),
    ]
    const recs = build(trades)
    const rec = recs.find((r) => r.id === 'rec-money-mgmt-MM')
    expect(rec).toBeDefined()
    expect(rec!.priority).toBe(3)
    expect(rec!.body).toMatch(/獲利因子/)
  })

  it('produces rec-concentration when concentration-risk triggered', () => {
    const trades = [
      makeTrade({ stockId: 'A', stockName: 'Alpha', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 5000, returnRate: 0.05 }),
      makeTrade({ stockId: 'B', stockName: 'Beta', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 3000, returnRate: 0.03 }),
      makeTrade({ stockId: 'C', stockName: 'Gamma', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 500, returnRate: 0.005 }),
    ]
    const recs = build(trades)
    const conc = recs.find((r) => r.id === 'rec-concentration')
    expect(conc).toBeDefined()
    expect(conc!.priority).toBe(4)
    expect(conc!.body).toContain('Alpha')
  })

  it('sorts by priority ascending', () => {
    const trades: Trade[] = []
    // 觸發多種類別
    trades.push(makeTrade({ stockId: 'A', stockName: 'A', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 5000 }))
    trades.push(makeTrade({ stockId: 'B', stockName: 'B', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 3000 }))
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        trades.push(makeTrade({
          stockId: `L${i}`,
          stockName: `L${i}`,
          buyDate: `2025-0${j + 1}-01`,
          sellDate: `2025-0${j + 1}-15`,
          pnl: -500,
          returnRate: -0.005,
        }))
      }
    }
    const recs = build(trades)
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i].priority).toBeGreaterThanOrEqual(recs[i - 1].priority)
    }
  })
})
