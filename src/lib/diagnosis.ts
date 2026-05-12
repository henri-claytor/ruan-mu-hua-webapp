/**
 * 績效診斷規則引擎
 *
 * 根據整體績效 + 個股統計，產生組合層級與個股層級的診斷建議。
 * 純函式，易測試、易擴充。
 */

import type { Trade, PortfolioPerformance, StockStats } from './trade'
export type { StockStats } from './trade'
import { daysBetween } from './trade'

export type DiagnosisLevel = 'advantage' | 'alert' | 'warning' | 'note' | 'info'

export interface Diagnosis {
  id: string
  level: DiagnosisLevel
  scope: 'portfolio' | 'stock'
  stockId?: string
  title: string
  message: string
  advice: string
}

// ── 排序輔助 ──────────────────────────────────────────────────────────────────

const LEVEL_ORDER: Record<DiagnosisLevel, number> = {
  advantage: 0,
  alert: 1,
  warning: 2,
  note: 3,
  info: 4,
}

function sortDiagnoses(arr: Diagnosis[]): Diagnosis[] {
  return arr.sort((a, b) => {
    const levelDiff = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]
    if (levelDiff !== 0) return levelDiff
    // 同 level 內 portfolio 先於 stock
    if (a.scope !== b.scope) return a.scope === 'portfolio' ? -1 : 1
    return 0
  })
}

// ── 組合層級「優勢」規則 ──────────────────────────────────────────────────────

function diagnoseAdvantages(performance: PortfolioPerformance): Diagnosis[] {
  const out: Diagnosis[] = []

  const pf = performance.profitFactor
  const winRate = performance.winRate
  const payoff = performance.payoffRatio

  // 1. adv-profit-factor-strong: profitFactor > 4（不互斥於其他）
  if (isFinite(pf) && pf > 4) {
    out.push({
      id: 'adv-profit-factor-strong',
      level: 'advantage',
      scope: 'portfolio',
      title: '獲利因子非常強勢',
      message: `獲利因子 ${pf.toFixed(2)}x 處於「非常強勢」區間（>4.0），每虧損 1 元可從其他交易賺回 ${pf.toFixed(2)} 元`,
      advice: '保持目前策略結構與資金管理',
    })
  }

  // 2. adv-balanced-win-payoff: winRate >= 0.7 且 payoffRatio >= 1.5
  const balancedTriggered =
    winRate >= 0.7 && isFinite(payoff) && payoff >= 1.5
  if (balancedTriggered) {
    out.push({
      id: 'adv-balanced-win-payoff',
      level: 'advantage',
      scope: 'portfolio',
      title: '勝率與損益比均衡',
      message: `勝率 ${(winRate * 100).toFixed(1)}% 配合損益比 ${payoff.toFixed(2)}，既能頻繁獲利、平均每次贏的幅度也超過輸的幅度`,
      advice: '策略結構健康，可持續執行',
    })
  }

  // 3. adv-high-win-rate: winRate >= 0.8（且未觸發 balanced）
  if (!balancedTriggered && winRate >= 0.8) {
    out.push({
      id: 'adv-high-win-rate',
      level: 'advantage',
      scope: 'portfolio',
      title: '勝率極高',
      message: `勝率 ${(winRate * 100).toFixed(1)}% 顯示選股或進場時機掌握精準`,
      advice: '留意是否依賴特定市況，建議測試不同行情下的表現',
    })
  }

  // 4. adv-strong-payoff: payoffRatio >= 2.5（且未觸發 balanced）
  if (!balancedTriggered && isFinite(payoff) && payoff >= 2.5) {
    out.push({
      id: 'adv-strong-payoff',
      level: 'advantage',
      scope: 'portfolio',
      title: '賠率優勢明顯',
      message: `賠率 ${payoff.toFixed(2)}x，平均每次贏的幅度顯著超過輸的幅度`,
      advice: '打法品質優秀，可保持',
    })
  }

  // 5. adv-positive-ev: expectedValue > 0 且 nTrades >= 10
  //    且未觸發 PF / balanced
  if (
    !balancedTriggered &&
    !(isFinite(pf) && pf > 4) &&
    performance.expectedValue > 0 &&
    performance.nTrades >= 10
  ) {
    out.push({
      id: 'adv-positive-ev',
      level: 'advantage',
      scope: 'portfolio',
      title: '期望值為正',
      message: `每筆平均期望值 ${Math.round(performance.expectedValue).toLocaleString()} 元，策略結構健康`,
      advice: '持續累積樣本以確認長期穩定',
    })
  }

  // 6. adv-low-drawdown: maxDrawdownPct > -0.05
  if (performance.maxDrawdownPct > -0.05) {
    out.push({
      id: 'adv-low-drawdown',
      level: 'advantage',
      scope: 'portfolio',
      title: '最大回撤可控',
      message: `最大回撤僅 ${(performance.maxDrawdownPct * 100).toFixed(2)}%，風險控制良好`,
      advice: '持續維持嚴謹的部位控制',
    })
  }

  return out
}

// ── 組合層級規則 ──────────────────────────────────────────────────────────────

function diagnosePortfolio(
  trades: Trade[],
  performance: PortfolioPerformance,
  stocks: StockStats[],
): Diagnosis[] {
  const out: Diagnosis[] = []

  // 1. concentration-risk: 前 2 大標的 |pnlContribution| 之和 > 0.4
  if (stocks.length >= 2) {
    const top2 = [...stocks]
      .sort((a, b) => Math.abs(b.pnlContribution) - Math.abs(a.pnlContribution))
      .slice(0, 2)
    const sumContrib = top2.reduce((s, x) => s + Math.abs(x.pnlContribution), 0)
    if (sumContrib > 0.4) {
      out.push({
        id: 'concentration-risk',
        level: 'warning',
        scope: 'portfolio',
        title: '集中度風險',
        message: `前 2 大標的（${top2[0].stockId}、${top2[1].stockId}）合計貢獻整體損益的 ${(sumContrib * 100).toFixed(1)}%`,
        advice: '分散持股，強勢標的達目標後可部分減倉以降低單一標的依賴',
      })
    }
  }

  // 2. stop-loss-discipline: 全敗標的數 >= 3 且合計虧損 / |totalPnl| > 0.1
  const allLossStocks = stocks.filter((s) => s.winRate === 0 && s.nTrades >= 1)
  if (allLossStocks.length >= 3 && performance.totalPnl !== 0) {
    const allLossSumPnl = allLossStocks.reduce((s, x) => s + x.totalPnl, 0)
    const ratio = Math.abs(allLossSumPnl) / Math.abs(performance.totalPnl)
    if (ratio > 0.1) {
      out.push({
        id: 'stop-loss-discipline',
        level: 'alert',
        scope: 'portfolio',
        title: '停損紀律不足',
        message: `${allLossStocks.length} 檔全敗標的合計虧損 ${Math.abs(allLossSumPnl).toLocaleString()} 元，佔總損益絕對值 ${(ratio * 100).toFixed(1)}%`,
        advice: '建立固定停損線機制（建議進場成本 −8% 至 −10%），達觸發點立即執行',
      })
    }
  }

  // 3. low-profit-factor: profitFactor < 2.0
  if (isFinite(performance.profitFactor) && performance.profitFactor < 2.0) {
    out.push({
      id: 'low-profit-factor',
      level: 'note',
      scope: 'portfolio',
      title: '獲利因子偏低',
      message: `獲利因子 ${performance.profitFactor.toFixed(2)} < 2.0，整體獲利相對虧損的倍數不足`,
      advice: '全面檢視策略邏輯，優先改善賠率',
    })
  }

  // 4. low-payoff: payoffRatio < 1.2
  if (isFinite(performance.payoffRatio) && performance.payoffRatio < 1.2) {
    out.push({
      id: 'low-payoff',
      level: 'note',
      scope: 'portfolio',
      title: '賠率偏低',
      message: `賠率 ${performance.payoffRatio.toFixed(2)} < 1.2，平均獲利幅度與虧損幅度相當`,
      advice: '改善停損或獲利了結節奏，讓獲利筆的幅度顯著高於虧損筆',
    })
  }

  // 5. high-frequency: 年均交易筆數 > 100
  if (trades.length > 0) {
    const opDays = daysBetween(performance.periodStart, performance.periodEnd) + 1
    const opYears = Math.max(opDays / 365, 1)
    const annualizedTrades = performance.nTrades / opYears
    if (annualizedTrades > 100) {
      out.push({
        id: 'high-frequency',
        level: 'note',
        scope: 'portfolio',
        title: '交易頻率過高',
        message: `年均約 ${annualizedTrades.toFixed(0)} 筆交易，可能侵蝕報酬於交易成本`,
        advice: '評估薄利多筆標的的交易成本侵蝕比例，集中於確信度高的進場時機',
      })
    }
  }

  // 6. low-sample: nTrades < 30
  if (performance.nTrades < 30) {
    out.push({
      id: 'low-sample',
      level: 'info',
      scope: 'portfolio',
      title: '樣本不足',
      message: `總交易筆數 ${performance.nTrades} 筆 < 30，統計可信度有限`,
      advice: '現有統計僅供參考，建議累積更多交易後再做策略評估',
    })
  }

  return out
}

// ── 個股層級規則 ──────────────────────────────────────────────────────────────

function diagnoseStock(s: StockStats): Diagnosis[] {
  const out: Diagnosis[] = []

  // 1+2. all-loss 互斥（先處理 3+ 再 2，避免重複）
  if (s.winRate === 0 && s.nTrades >= 3) {
    out.push({
      id: 'stock-all-loss-3plus',
      level: 'alert',
      scope: 'stock',
      stockId: s.stockId,
      title: '全敗多筆',
      message: `${s.stockName} 共 ${s.nTrades} 筆交易全數虧損`,
      advice: '持續進場代表選股邏輯可能整體有誤，而非執行問題；考慮停止操作此標的',
    })
  } else if (s.winRate === 0 && s.nTrades === 2) {
    out.push({
      id: 'stock-all-loss-2',
      level: 'alert',
      scope: 'stock',
      stockId: s.stockId,
      title: '連續虧損',
      message: `${s.stockName} 連續 2 筆交易全數虧損，疑似未執行停損`,
      advice: '建議設定明確停損條件，達觸發點立即執行，不論後續判斷',
    })
  }

  // 3. stock-low-payoff: payoffRatio < 0.8
  if (isFinite(s.payoffRatio) && s.payoffRatio < 0.8) {
    out.push({
      id: 'stock-low-payoff',
      level: 'warning',
      scope: 'stock',
      stockId: s.stockId,
      title: '打法品質偏低',
      message: `${s.stockName} 賠率 ${s.payoffRatio.toFixed(2)}，平均虧損幅度大於獲利`,
      advice: '靠勝率撐場結構脆弱，重新評估進出場邏輯，或改為只在確信度高時才進場',
    })
  }

  // 4. stock-money-management: payoff >= 1.5 且 profitFactor < 1.0
  if (s.payoffRatio >= 1.5 && isFinite(s.profitFactor) && s.profitFactor < 1.0) {
    out.push({
      id: 'stock-money-management',
      level: 'warning',
      scope: 'stock',
      stockId: s.stockId,
      title: '資金管理問題',
      message: `${s.stockName} 賠率 ${isFinite(s.payoffRatio) ? s.payoffRatio.toFixed(2) : '∞'}（打法尚可），但獲利因子僅 ${s.profitFactor.toFixed(2)}`,
      advice: '虧損筆部位明顯重於獲利筆，建議統一部位大小或縮減虧損筆倉位',
    })
  }

  // 5. stock-concentration: |pnlContribution| > 0.2
  if (Math.abs(s.pnlContribution) > 0.2) {
    out.push({
      id: 'stock-concentration',
      level: 'note',
      scope: 'stock',
      stockId: s.stockId,
      title: '集中度警示',
      message: `${s.stockName} 貢獻整體損益的 ${(s.pnlContribution * 100).toFixed(1)}%`,
      advice: '組合集中度過高，建議設定單一標的損益貢獻上限（如 25%），達到後分批減倉',
    })
  }

  // 6. stock-low-sample: nTrades < 5
  if (s.nTrades < 5) {
    out.push({
      id: 'stock-low-sample',
      level: 'info',
      scope: 'stock',
      stockId: s.stockId,
      title: '樣本不足',
      message: `${s.stockName} 交易筆數僅 ${s.nTrades} 筆`,
      advice: '建議累積更多樣本後再評估此標的',
    })
  }

  return out
}

// ── 主函式 ────────────────────────────────────────────────────────────────────

export function diagnose(
  trades: Trade[],
  performance: PortfolioPerformance | null,
  stocks: StockStats[],
): Diagnosis[] {
  if (trades.length === 0 || !performance) return []

  const out: Diagnosis[] = []
  out.push(...diagnoseAdvantages(performance))
  out.push(...diagnosePortfolio(trades, performance, stocks))
  for (const s of stocks) {
    out.push(...diagnoseStock(s))
  }
  return sortDiagnoses(out)
}

// ── 個股診斷摘要（用於矩陣表「診斷摘要」欄） ─────────────────────────────────
//
// 依優先順序回傳第一條符合的摘要文字：
//   全敗 → 全勝 → 賠率偏低 → 資金管理 → 集中度 → 雙優 → 樣本不足 → 預設
// 每條訊息含具體數字（金額、比例、報酬率）。

export function buildStockDiagSummary(s: StockStats): string {
  // 1. 全敗 ≥ 3 筆
  if (s.nWins === 0 && s.nLosses >= 3) {
    const avgLoss = Math.abs(s.avgLossReturnRate * 100).toFixed(1)
    return `${s.nTrades} 筆全敗，平均虧損 ${avgLoss}%，停損紀律需改善`
  }
  // 2. 全敗 2 筆
  if (s.nWins === 0 && s.nLosses === 2) {
    return `${s.nTrades} 筆全敗，疑似未停損`
  }
  // 3. 全勝 ≥ 5 筆
  if (s.nLosses === 0 && s.nWins >= 5) {
    const avgWin = s.avgWinReturnRate * 100
    let efficiency = ''
    if (avgWin < 10) efficiency = '，屬薄利多筆型'
    else if (avgWin > 25) efficiency = '，高報酬選股精準'
    if (s.avgHoldingDays < 15) efficiency += '，短週期高效率'
    return `${s.nTrades} 筆全勝，均報酬 ${avgWin.toFixed(1)}%${efficiency}`
  }
  // 4. 全勝 < 5 筆
  if (s.nLosses === 0 && s.nWins > 0 && s.nWins < 5) {
    return `${s.nTrades} 筆全勝，樣本少參考性有限`
  }
  // 5. 賠率偏低
  if (isFinite(s.payoffRatio) && s.payoffRatio > 0 && s.payoffRatio < 0.8) {
    return `賠率 ${s.payoffRatio.toFixed(2)} 偏低，靠勝率撐場，結構脆弱`
  }
  // 6. 資金管理問題（賠率好但 PF 差）
  if (
    s.payoffRatio >= 1.5 &&
    isFinite(s.payoffRatio) &&
    isFinite(s.profitFactor) &&
    s.profitFactor < 1.0
  ) {
    return `邏輯對（賠率 ${s.payoffRatio.toFixed(2)}）但押注管理有問題（PF ${s.profitFactor.toFixed(2)}）`
  }
  // 7. 集中度高
  if (Math.abs(s.pnlContribution) > 0.2) {
    const pct = (s.pnlContribution * 100).toFixed(1)
    return `貢獻整體 ${pct}%，集中度高`
  }
  // 8. 雙優
  if (
    s.payoffRatio >= 1.5 &&
    s.profitFactor >= 2.0 &&
    isFinite(s.payoffRatio) &&
    isFinite(s.profitFactor)
  ) {
    return `打法與結果雙優（賠率 ${s.payoffRatio.toFixed(2)}、PF ${s.profitFactor.toFixed(1)}）`
  }
  // 9. 樣本不足
  if (s.nTrades < 5) {
    return `${s.nTrades} 筆，樣本少需更多紀錄`
  }
  // 10. 預設
  return `${s.nTrades} 筆，勝率 ${(s.winRate * 100).toFixed(0)}%，均報酬 ${(s.avgWinReturnRate * 100).toFixed(1)}%`
}
