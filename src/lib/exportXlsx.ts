/**
 * 績效分析 Excel 匯出。
 * 4 個分頁：整體指標 / 個股統計 / 交易明細 / 診斷觀察。
 *
 * 使用 dynamic import 載入 xlsx，避免初始 bundle 過大。
 */

import type { Trade, PortfolioPerformance, StockStats } from './trade'
import type { Diagnosis } from './diagnosis'
import { daysBetween } from './trade'
import { WORDING } from './wording'

/** 安全格式化 ratio：Infinity 顯示為 '∞' */
function fmtRatio(n: number): string {
  if (!isFinite(n)) return '∞'
  return n.toFixed(4)
}

export async function exportPerformanceXlsx(
  performance: PortfolioPerformance,
  stocks: StockStats[],
  trades: Trade[],
  diagnoses: Diagnosis[],
  filename: string,
): Promise<void> {
  // Dynamic import 避免 xlsx 進入初始 bundle
  const XLSX = await import('xlsx')

  const wb = XLSX.utils.book_new()

  // ── Sheet 1：整體指標 ─────────────────────────────────────────────────────
  const overall = [
    ['項目', '值'],
    ['期間', `${performance.periodStart} – ${performance.periodEnd}`],
    ['總交易筆數', performance.nTrades],
    ['勝場數', performance.nWins],
    ['敗場數', performance.nLosses],
    ['平手數', performance.nFlat],
    ['總投入金額（元）', performance.totalInvested],
    ['總實現損益（元）', performance.totalPnl],
    ['整體報酬率', performance.overallReturn],
    ['年化報酬率', performance.annualizedReturn],
    ['勝率', performance.winRate],
    ['賠率（payoff ratio）', fmtRatio(performance.payoffRatio)],
    ['獲利因子（profit factor）', fmtRatio(performance.profitFactor)],
    ['期望值（每筆，元）', performance.expectedValue],
    ['期望報酬率', performance.expectedReturnRate],
    ['平均獲利金額（元）', performance.avgWinPnl],
    ['平均虧損金額（元）', performance.avgLossPnl],
    ['最大單筆獲利（元）', performance.maxWinPnl],
    ['最大單筆虧損（元）', performance.maxLossPnl],
    ['最大回撤（元）', performance.maxDrawdown],
    ['最大回撤比例', performance.maxDrawdownPct],
    ['平均持有天數', performance.avgHoldingDays],
    ['最長持有天數', performance.maxHoldingDays],
    ['最短持有天數', performance.minHoldingDays],
    ['四象限分類', performance.quadrant],
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(overall)
  XLSX.utils.book_append_sheet(wb, ws1, '整體指標')

  // ── Sheet 2：個股統計 ─────────────────────────────────────────────────────
  const stockHeader = [
    '股票代號', '股票名稱', '交易筆數', '勝場', '敗場', '勝率',
    '平均獲利報酬率', '平均虧損報酬率', '賠率', '獲利因子',
    '總獲利金額', '總虧損金額', '總損益', '損益貢獻度', '平均持有天數',
    '四象限分類', '觸發診斷',
  ]
  const stockRows = stocks.map((s) => {
    const stockDiag = diagnoses
      .filter((d) => d.scope === 'stock' && d.stockId === s.stockId)
      .map((d) => d.id)
      .join('; ')
    return [
      s.stockId, s.stockName, s.nTrades, s.nWins, s.nLosses, s.winRate,
      s.avgWinReturnRate, s.avgLossReturnRate,
      fmtRatio(s.payoffRatio), fmtRatio(s.profitFactor),
      s.totalWinPnl, s.totalLossPnl, s.totalPnl, s.pnlContribution,
      s.avgHoldingDays, s.quadrant, stockDiag,
    ]
  })
  const ws2 = XLSX.utils.aoa_to_sheet([stockHeader, ...stockRows])
  XLSX.utils.book_append_sheet(wb, ws2, '個股統計')

  // ── Sheet 3：交易明細 ─────────────────────────────────────────────────────
  const tradeHeader = [
    'stock_id', 'stock_name', 'buy_date', 'sell_date',
    'buy_price', 'sell_price', 'shares',
    'buy_amount', 'sell_amount', 'pnl', 'return_rate',
    'holding_days', 'note',
  ]
  const sortedTrades = [...trades].sort((a, b) =>
    a.sellDate < b.sellDate ? 1 : a.sellDate > b.sellDate ? -1 : 0,
  )
  const tradeRows = sortedTrades.map((t) => [
    t.stockId, t.stockName, t.buyDate, t.sellDate,
    t.buyPrice, t.sellPrice, t.shares,
    t.buyAmount, t.sellAmount, t.pnl, t.returnRate,
    daysBetween(t.buyDate, t.sellDate), t.note ?? '',
  ])
  const ws3 = XLSX.utils.aoa_to_sheet([tradeHeader, ...tradeRows])
  XLSX.utils.book_append_sheet(wb, ws3, '交易明細')

  // ── Sheet 4：診斷觀察 ─────────────────────────────────────────────────────
  const diagHeader = ['id', 'level', 'scope', 'stockId', 'title', 'message', 'advice']
  const diagRows = diagnoses.map((d) => [
    d.id, d.level, d.scope, d.stockId ?? '', d.title, d.message, d.advice,
  ])
  const ws4 = XLSX.utils.aoa_to_sheet([diagHeader, ...diagRows])
  XLSX.utils.book_append_sheet(wb, ws4, WORDING.excelDiagSheet)

  // 寫檔
  XLSX.writeFile(wb, filename)
}
