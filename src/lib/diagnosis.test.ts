import { describe, it, expect } from 'vitest'
import { diagnose, buildStockDiagSummary } from './diagnosis'
import type { StockStats } from './trade'
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

function setup(trades: Trade[]) {
  const performance = calcPortfolioPerformance(trades)
  const stocks = calcAllStockStats(trades)
  return diagnose(trades, performance, stocks)
}

describe('diagnose', () => {
  it('returns empty array for no trades', () => {
    expect(diagnose([], null, [])).toEqual([])
  })

  it('orders results by level (advantage → alert → warning → note → info)', () => {
    // Construct trades that trigger multiple levels:
    //   - all-loss 3 stocks (alert: stop-loss-discipline + stock-all-loss-3plus)
    //   - low payoff (note)
    //   - low sample (info)
    const trades: Trade[] = []
    for (let i = 0; i < 3; i++) {
      // 3 stocks all losing 3 times each
      const sid = `LOSS${i}`
      for (let j = 0; j < 3; j++) {
        trades.push(makeTrade({
          stockId: sid,
          stockName: `Loser ${i}`,
          buyDate: `2025-0${j + 1}-01`,
          sellDate: `2025-0${j + 1}-10`,
          pnl: -1000,
          returnRate: -0.01,
        }))
      }
    }
    const result = setup(trades)
    // 第一條應為 advantage 或 alert（取決於是否觸發 low-drawdown 等優勢規則）
    const firstLevel = result[0]?.level
    expect(['advantage', 'alert']).toContain(firstLevel)
    // alert 應出現在 warning / note / info 之前
    const alertIdx = result.findIndex((d) => d.level === 'alert')
    const noteIdx = result.findIndex((d) => d.level === 'note')
    if (alertIdx >= 0 && noteIdx >= 0) {
      expect(alertIdx).toBeLessThan(noteIdx)
    }
  })
})

describe('Portfolio diagnoses', () => {
  it('triggers concentration-risk when top 2 stocks > 40%', () => {
    const trades = [
      makeTrade({ stockId: 'A', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 5000, returnRate: 0.05 }),
      makeTrade({ stockId: 'B', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 3000, returnRate: 0.03 }),
      makeTrade({ stockId: 'C', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 500, returnRate: 0.005 }),
    ]
    const result = setup(trades)
    const ids = result.map((d) => d.id)
    expect(ids).toContain('concentration-risk')
  })

  it('triggers stop-loss-discipline when 3+ all-loss stocks > 10% of total', () => {
    const trades: Trade[] = []
    // 1 winner: +20000
    trades.push(makeTrade({ stockId: 'WIN', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 20000 }))
    // 3 all-loss stocks: each -1000 (total -3000, > 10% of total |20000-3000|=17000? 3000/17000=17.6% > 10%)
    for (let i = 0; i < 3; i++) {
      trades.push(makeTrade({
        stockId: `L${i}`,
        buyDate: '2025-01-01',
        sellDate: '2025-02-01',
        pnl: -1000,
        returnRate: -0.01,
      }))
    }
    const result = setup(trades)
    expect(result.map((d) => d.id)).toContain('stop-loss-discipline')
  })

  it('triggers low-profit-factor when profitFactor < 2', () => {
    const trades = [
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 1000 }),
      makeTrade({ buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: -800 }),
    ]
    const result = setup(trades)
    expect(result.map((d) => d.id)).toContain('low-profit-factor')
  })

  it('does NOT trigger low-profit-factor when profitFactor >= 2', () => {
    const trades = [
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 5000, returnRate: 0.05 }),
      makeTrade({ buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: 3000, returnRate: 0.03 }),
      makeTrade({ buyDate: '2025-03-01', sellDate: '2025-04-01', pnl: -1000, returnRate: -0.01 }),
    ]
    const result = setup(trades)
    expect(result.map((d) => d.id)).not.toContain('low-profit-factor')
  })

  it('triggers low-sample when nTrades < 30', () => {
    const trades = [
      makeTrade({ buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 1000 }),
    ]
    const result = setup(trades)
    expect(result.map((d) => d.id)).toContain('low-sample')
  })

  it('does NOT trigger low-sample when nTrades >= 30', () => {
    const trades: Trade[] = []
    for (let i = 0; i < 30; i++) {
      trades.push(makeTrade({
        stockId: `S${i}`,
        buyDate: '2025-01-01',
        sellDate: '2025-02-01',
        pnl: i % 2 === 0 ? 1000 : -500,
      }))
    }
    const result = setup(trades)
    expect(result.map((d) => d.id)).not.toContain('low-sample')
  })
})

describe('Stock diagnoses', () => {
  it('triggers stock-all-loss-2 for 2 consecutive losses', () => {
    const trades = [
      makeTrade({ stockId: 'LOSER', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: -1000 }),
      makeTrade({ stockId: 'LOSER', buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: -500 }),
    ]
    const result = setup(trades)
    const ids = result.map((d) => d.id)
    expect(ids).toContain('stock-all-loss-2')
    expect(ids).not.toContain('stock-all-loss-3plus')
  })

  it('triggers stock-all-loss-3plus (NOT 2) for 3+ consecutive losses', () => {
    const trades = [
      makeTrade({ stockId: 'LOSER', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: -1000 }),
      makeTrade({ stockId: 'LOSER', buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: -500 }),
      makeTrade({ stockId: 'LOSER', buyDate: '2025-03-01', sellDate: '2025-04-01', pnl: -300 }),
    ]
    const result = setup(trades)
    const ids = result.map((d) => d.id)
    expect(ids).toContain('stock-all-loss-3plus')
    expect(ids).not.toContain('stock-all-loss-2')
  })

  it('triggers stock-low-payoff when payoff < 0.8', () => {
    // wins 1%, losses 2% → payoff 0.5
    const trades = [
      makeTrade({ stockId: 'BAD', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 100, returnRate: 0.01 }),
      makeTrade({ stockId: 'BAD', buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: 100, returnRate: 0.01 }),
      makeTrade({ stockId: 'BAD', buyDate: '2025-03-01', sellDate: '2025-04-01', pnl: -200, returnRate: -0.02 }),
    ]
    const result = setup(trades)
    expect(result.map((d) => d.id)).toContain('stock-low-payoff')
  })

  it('triggers stock-money-management when payoff >= 1.5 but PF < 1', () => {
    // Need: payoff >= 1.5, profit factor < 1
    // 1 small win 5%, 2 large losses 2% each → payoff 5/2=2.5, PF: win 1000 / loss (2000+2000)=4000 → 0.25
    const trades = [
      makeTrade({ stockId: 'MM', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 1000, returnRate: 0.05 }),
      makeTrade({ stockId: 'MM', buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: -2000, returnRate: -0.02 }),
      makeTrade({ stockId: 'MM', buyDate: '2025-03-01', sellDate: '2025-04-01', pnl: -2000, returnRate: -0.02 }),
    ]
    const result = setup(trades)
    expect(result.map((d) => d.id)).toContain('stock-money-management')
  })

  it('triggers stock-concentration when |pnlContribution| > 0.2', () => {
    // Single stock dominating: ALL pnl from one stock
    const trades = [
      makeTrade({ stockId: 'BIG', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 10000 }),
      makeTrade({ stockId: 'small', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 100 }),
    ]
    const result = setup(trades)
    const concDiag = result.find((d) => d.id === 'stock-concentration' && d.stockId === 'BIG')
    expect(concDiag).toBeDefined()
  })

  it('triggers stock-low-sample when nTrades < 5', () => {
    const trades = [
      makeTrade({ stockId: 'A', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 100 }),
    ]
    const result = setup(trades)
    expect(result.map((d) => d.id)).toContain('stock-low-sample')
  })

  it('does NOT trigger stock-low-sample when nTrades >= 5', () => {
    const trades: Trade[] = []
    for (let i = 0; i < 6; i++) {
      trades.push(makeTrade({
        stockId: 'A',
        buyDate: `2025-0${i + 1}-01`,
        sellDate: `2025-0${i + 1}-15`,
        pnl: i % 2 === 0 ? 100 : -50,
      }))
    }
    const result = setup(trades)
    const aLowSample = result.find((d) => d.id === 'stock-low-sample' && d.stockId === 'A')
    expect(aLowSample).toBeUndefined()
  })
})

// ── Advantage diagnoses ───────────────────────────────────────────────────────

describe('Advantage diagnoses', () => {
  it('triggers adv-profit-factor-strong when PF > 4', () => {
    // win 10000, loss -2000 → PF = 5
    const trades = [
      makeTrade({ stockId: 'A', buyDate: '2025-01-01', sellDate: '2025-02-01', pnl: 10000, returnRate: 0.10 }),
      makeTrade({ stockId: 'B', buyDate: '2025-02-01', sellDate: '2025-03-01', pnl: -2000, returnRate: -0.02 }),
    ]
    const result = setup(trades)
    expect(result.map((d) => d.id)).toContain('adv-profit-factor-strong')
  })

  it('triggers adv-balanced-win-payoff when winRate >= 0.7 and payoff >= 1.5', () => {
    // 7 wins @+3000(3%), 3 losses @-1000(-1%) → winRate 0.7, payoff 3
    const trades: Trade[] = []
    for (let i = 0; i < 7; i++) {
      trades.push(makeTrade({
        stockId: `W${i}`,
        buyDate: `2025-01-${String(i + 1).padStart(2, '0')}`,
        sellDate: `2025-02-${String(i + 1).padStart(2, '0')}`,
        pnl: 3000,
        returnRate: 0.03,
      }))
    }
    for (let i = 0; i < 3; i++) {
      trades.push(makeTrade({
        stockId: `L${i}`,
        buyDate: `2025-03-${String(i + 1).padStart(2, '0')}`,
        sellDate: `2025-04-${String(i + 1).padStart(2, '0')}`,
        pnl: -1000,
        returnRate: -0.01,
      }))
    }
    const result = setup(trades)
    const ids = result.map((d) => d.id)
    expect(ids).toContain('adv-balanced-win-payoff')
    // mutex: balanced 觸發時 high-win/strong-payoff/positive-ev 不再觸發
    expect(ids).not.toContain('adv-high-win-rate')
    expect(ids).not.toContain('adv-strong-payoff')
    expect(ids).not.toContain('adv-positive-ev')
  })

  it('triggers adv-high-win-rate when winRate >= 0.8 and balanced NOT triggered', () => {
    // 8 wins @+500(0.5%), 2 losses @-2000(-2%) → winRate 0.8, payoff 0.25（<1.5 → balanced 未觸發）
    const trades: Trade[] = []
    for (let i = 0; i < 8; i++) {
      trades.push(makeTrade({
        stockId: `W${i}`,
        buyDate: `2025-01-${String(i + 1).padStart(2, '0')}`,
        sellDate: `2025-02-${String(i + 1).padStart(2, '0')}`,
        pnl: 500,
        returnRate: 0.005,
      }))
    }
    for (let i = 0; i < 2; i++) {
      trades.push(makeTrade({
        stockId: `L${i}`,
        buyDate: `2025-03-${String(i + 1).padStart(2, '0')}`,
        sellDate: `2025-04-${String(i + 1).padStart(2, '0')}`,
        pnl: -2000,
        returnRate: -0.02,
      }))
    }
    const result = setup(trades)
    const ids = result.map((d) => d.id)
    expect(ids).toContain('adv-high-win-rate')
    expect(ids).not.toContain('adv-balanced-win-payoff')
  })

  it('triggers adv-strong-payoff when payoff >= 2.5 and balanced NOT triggered', () => {
    // 3 wins @+5000(5%), 7 losses @-1000(-1%) → winRate 0.3（<0.7 → balanced 未觸發）, payoff 5
    const trades: Trade[] = []
    for (let i = 0; i < 3; i++) {
      trades.push(makeTrade({
        stockId: `W${i}`,
        buyDate: `2025-01-${String(i + 1).padStart(2, '0')}`,
        sellDate: `2025-02-${String(i + 1).padStart(2, '0')}`,
        pnl: 5000,
        returnRate: 0.05,
      }))
    }
    for (let i = 0; i < 7; i++) {
      trades.push(makeTrade({
        stockId: `L${i}`,
        buyDate: `2025-03-${String(i + 1).padStart(2, '0')}`,
        sellDate: `2025-04-${String(i + 1).padStart(2, '0')}`,
        pnl: -1000,
        returnRate: -0.01,
      }))
    }
    const result = setup(trades)
    const ids = result.map((d) => d.id)
    expect(ids).toContain('adv-strong-payoff')
    expect(ids).not.toContain('adv-balanced-win-payoff')
  })

  it('triggers adv-positive-ev when EV > 0 and nTrades >= 10 (without PF/balanced)', () => {
    // 5 wins @+800(0.8%), 5 losses @-500(-0.5%) → EV>0, PF=1.6 (<=4), payoff 1.6, winRate 0.5 → balanced 不觸發
    const trades: Trade[] = []
    for (let i = 0; i < 5; i++) {
      trades.push(makeTrade({
        stockId: `W${i}`,
        buyDate: `2025-01-${String(i + 1).padStart(2, '0')}`,
        sellDate: `2025-02-${String(i + 1).padStart(2, '0')}`,
        pnl: 800,
        returnRate: 0.008,
      }))
    }
    for (let i = 0; i < 5; i++) {
      trades.push(makeTrade({
        stockId: `L${i}`,
        buyDate: `2025-03-${String(i + 1).padStart(2, '0')}`,
        sellDate: `2025-04-${String(i + 1).padStart(2, '0')}`,
        pnl: -500,
        returnRate: -0.005,
      }))
    }
    const result = setup(trades)
    const ids = result.map((d) => d.id)
    expect(ids).toContain('adv-positive-ev')
  })

  it('does NOT trigger adv-positive-ev when balanced is triggered (mutex)', () => {
    // balanced 觸發場景：應排除 positive-ev
    const trades: Trade[] = []
    for (let i = 0; i < 7; i++) {
      trades.push(makeTrade({
        stockId: `W${i}`,
        buyDate: `2025-01-${String(i + 1).padStart(2, '0')}`,
        sellDate: `2025-02-${String(i + 1).padStart(2, '0')}`,
        pnl: 3000,
        returnRate: 0.03,
      }))
    }
    for (let i = 0; i < 3; i++) {
      trades.push(makeTrade({
        stockId: `L${i}`,
        buyDate: `2025-03-${String(i + 1).padStart(2, '0')}`,
        sellDate: `2025-04-${String(i + 1).padStart(2, '0')}`,
        pnl: -1000,
        returnRate: -0.01,
      }))
    }
    const result = setup(trades)
    expect(result.map((d) => d.id)).not.toContain('adv-positive-ev')
  })

  it('triggers adv-low-drawdown when maxDrawdownPct > -0.05', () => {
    // 連續獲利 → 回撤幾乎為 0
    const trades: Trade[] = []
    for (let i = 0; i < 5; i++) {
      trades.push(makeTrade({
        stockId: `W${i}`,
        buyDate: `2025-01-${String(i + 1).padStart(2, '0')}`,
        sellDate: `2025-02-${String(i + 1).padStart(2, '0')}`,
        pnl: 1000,
        returnRate: 0.01,
      }))
    }
    const result = setup(trades)
    expect(result.map((d) => d.id)).toContain('adv-low-drawdown')
  })

  it('adv-profit-factor-strong is NOT mutex with adv-balanced-win-payoff', () => {
    // 高 PF + balanced 場景：兩者同時觸發
    // 7 wins @+5000(5%), 3 losses @-1000(-1%) → winRate 0.7, payoff 5, PF: 35000/3000 ≈ 11.67
    const trades: Trade[] = []
    for (let i = 0; i < 7; i++) {
      trades.push(makeTrade({
        stockId: `W${i}`,
        buyDate: `2025-01-${String(i + 1).padStart(2, '0')}`,
        sellDate: `2025-02-${String(i + 1).padStart(2, '0')}`,
        pnl: 5000,
        returnRate: 0.05,
      }))
    }
    for (let i = 0; i < 3; i++) {
      trades.push(makeTrade({
        stockId: `L${i}`,
        buyDate: `2025-03-${String(i + 1).padStart(2, '0')}`,
        sellDate: `2025-04-${String(i + 1).padStart(2, '0')}`,
        pnl: -1000,
        returnRate: -0.01,
      }))
    }
    const result = setup(trades)
    const ids = result.map((d) => d.id)
    expect(ids).toContain('adv-profit-factor-strong')
    expect(ids).toContain('adv-balanced-win-payoff')
  })
})

// ── buildStockDiagSummary 摘要文字 ─────────────────────────────────────────────

function makeStats(overrides: Partial<StockStats>): StockStats {
  return {
    stockId: '2330',
    stockName: '台積電',
    nTrades: 10,
    nWins: 6,
    nLosses: 4,
    winRate: 0.6,
    avgWinReturnRate: 0.05,
    avgLossReturnRate: -0.02,
    payoffRatio: 2.5,
    totalWinPnl: 5000,
    totalLossPnl: -1000,
    profitFactor: 5,
    totalPnl: 4000,
    pnlContribution: 0.1,
    avgHoldingDays: 30,
    quadrant: 'Q1: 打法好・結果好',
    ...overrides,
  }
}

describe('buildStockDiagSummary', () => {
  it('全敗 3+ 筆 → 平均虧損訊息', () => {
    const s = makeStats({
      nTrades: 9,
      nWins: 0,
      nLosses: 9,
      avgLossReturnRate: -0.101,
    })
    expect(buildStockDiagSummary(s)).toBe('9 筆全敗，平均虧損 10.1%，停損紀律需改善')
  })

  it('全敗 2 筆 → 疑似未停損', () => {
    const s = makeStats({ nTrades: 2, nWins: 0, nLosses: 2 })
    expect(buildStockDiagSummary(s)).toBe('2 筆全敗，疑似未停損')
  })

  it('全勝 ≥5 筆 + 薄利', () => {
    const s = makeStats({
      nTrades: 29,
      nWins: 29,
      nLosses: 0,
      avgWinReturnRate: 0.08,
      avgHoldingDays: 50,
    })
    expect(buildStockDiagSummary(s)).toBe('29 筆全勝，均報酬 8.0%，屬薄利多筆型')
  })

  it('全勝 ≥5 筆 + 高報酬 + 短週期', () => {
    const s = makeStats({
      nTrades: 5,
      nWins: 5,
      nLosses: 0,
      avgWinReturnRate: 0.30,
      avgHoldingDays: 12,
    })
    expect(buildStockDiagSummary(s)).toBe('5 筆全勝，均報酬 30.0%，高報酬選股精準，短週期高效率')
  })

  it('全勝 < 5 筆 → 樣本少', () => {
    const s = makeStats({
      nTrades: 3,
      nWins: 3,
      nLosses: 0,
      avgWinReturnRate: 0.15,
    })
    expect(buildStockDiagSummary(s)).toBe('3 筆全勝，樣本少參考性有限')
  })

  it('賠率偏低 → 結構脆弱', () => {
    const s = makeStats({
      nWins: 7,
      nLosses: 2,
      payoffRatio: 0.47,
      profitFactor: 1.8,
    })
    expect(buildStockDiagSummary(s)).toBe('賠率 0.47 偏低，靠勝率撐場，結構脆弱')
  })

  it('資金管理問題（高賠率但低 PF）', () => {
    const s = makeStats({
      nWins: 1,
      nLosses: 2,
      payoffRatio: 2.18,
      profitFactor: 0.32,
    })
    expect(buildStockDiagSummary(s)).toBe('邏輯對（賠率 2.18）但押注管理有問題（PF 0.32）')
  })

  it('集中度高', () => {
    const s = makeStats({
      payoffRatio: 1.2,
      profitFactor: 1.5,
      pnlContribution: 0.244,
    })
    expect(buildStockDiagSummary(s)).toBe('貢獻整體 24.4%，集中度高')
  })

  it('雙優', () => {
    const s = makeStats({
      nWins: 17,
      nLosses: 1,
      payoffRatio: 6.15,
      profitFactor: 449.5,
      pnlContribution: 0.1,
    })
    expect(buildStockDiagSummary(s)).toBe('打法與結果雙優（賠率 6.15、PF 449.5）')
  })

  it('樣本不足', () => {
    const s = makeStats({
      nTrades: 4,
      nWins: 2,
      nLosses: 2,
      payoffRatio: 1.2,
      profitFactor: 1.5,
      pnlContribution: 0.05,
    })
    expect(buildStockDiagSummary(s)).toBe('4 筆，樣本少需更多紀錄')
  })

  it('預設訊息', () => {
    const s = makeStats({
      nTrades: 10,
      nWins: 6,
      nLosses: 4,
      winRate: 0.6,
      avgWinReturnRate: 0.05,
      payoffRatio: 1.2,
      profitFactor: 1.5,
      pnlContribution: 0.05,
    })
    expect(buildStockDiagSummary(s)).toBe('10 筆，勝率 60%，均報酬 5.0%')
  })
})
