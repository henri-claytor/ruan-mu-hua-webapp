/**
 * 重點建議產生器
 *
 * 將 diagnoses 中具行動性的條目聚合為編號式重點建議，
 * 對應 PDF 報告的「重點建議」區塊。
 */

import type { Diagnosis } from './diagnosis'
import type { PortfolioPerformance, StockStats } from './trade'

export interface Recommendation {
  id: string
  title: string
  body: string
  priority: number
  scope: 'portfolio' | 'specific-stock'
  stockId?: string
}

export function buildRecommendations(
  diagnoses: Diagnosis[],
  stocks: StockStats[],
  performance: PortfolioPerformance | null,
): Recommendation[] {
  if (!performance || stocks.length === 0) return []

  const recs: Recommendation[] = []

  // 1. 強化停損紀律（priority 1）：聚合 stock-all-loss-3plus + stop-loss-discipline
  const allLoss3PlusDiagnoses = diagnoses.filter((d) => d.id === 'stock-all-loss-3plus')
  const hasStopLossDiscipline = diagnoses.some((d) => d.id === 'stop-loss-discipline')
  if (allLoss3PlusDiagnoses.length > 0 || hasStopLossDiscipline) {
    const allLossStocks = allLoss3PlusDiagnoses
      .map((d) => stocks.find((s) => s.stockId === d.stockId))
      .filter((s): s is StockStats => !!s)
    const names = allLossStocks.map((s) => s.stockName).join('、')
    const namePart = names ? `${names} 是最明顯的停損問題標的。` : ''
    recs.push({
      id: 'rec-stop-loss',
      title: '強化停損紀律',
      body: `${namePart}建議設定固定停損線（如進場成本 −8%），達到即出場，避免重複加碼虧損部位。`,
      priority: 1,
      scope: 'portfolio',
    })
  }

  // 2. 改善 {stockName} 操作方式（priority 2，每股一條）：stock-low-payoff
  const lowPayoffDiagnoses = diagnoses.filter((d) => d.id === 'stock-low-payoff')
  for (const d of lowPayoffDiagnoses) {
    const stock = stocks.find((s) => s.stockId === d.stockId)
    if (!stock) continue
    const payoff = isFinite(stock.payoffRatio) ? stock.payoffRatio.toFixed(2) : '∞'
    const ratio = isFinite(stock.payoffRatio) && stock.payoffRatio > 0
      ? (1 / stock.payoffRatio).toFixed(2)
      : '?'
    recs.push({
      id: `rec-low-payoff-${stock.stockId}`,
      title: `改善 ${stock.stockName} 操作方式`,
      body: `${stock.stockName} 損益比 ${payoff} 代表打法本身有問題——平均虧損幅度是獲利的 ${ratio} 倍。若要繼續操作此標的，需調整進出場策略，或縮小部位以控制整體風險。`,
      priority: 2,
      scope: 'specific-stock',
      stockId: stock.stockId,
    })
  }

  // 3. 檢討 {stockName} 押注管理（priority 3，每股一條）：stock-money-management
  const moneyMgmtDiagnoses = diagnoses.filter((d) => d.id === 'stock-money-management')
  for (const d of moneyMgmtDiagnoses) {
    const stock = stocks.find((s) => s.stockId === d.stockId)
    if (!stock) continue
    const payoff = isFinite(stock.payoffRatio) ? stock.payoffRatio.toFixed(2) : '∞'
    const pf = isFinite(stock.profitFactor) ? stock.profitFactor.toFixed(2) : '∞'
    recs.push({
      id: `rec-money-mgmt-${stock.stockId}`,
      title: `檢討 ${stock.stockName} 押注管理`,
      body: `${stock.stockName} 是「邏輯對但執行錯」的典型案例。損益比 ${payoff} 顯示打法尚可，但獲利因子 ${pf} 代表虧損筆部位遠大於獲利筆，屬資金管理問題。`,
      priority: 3,
      scope: 'specific-stock',
      stockId: stock.stockId,
    })
  }

  // 4. 降低組合集中度（priority 4）：concentration-risk
  if (diagnoses.some((d) => d.id === 'concentration-risk')) {
    const top2 = [...stocks]
      .sort((a, b) => Math.abs(b.pnlContribution) - Math.abs(a.pnlContribution))
      .slice(0, 2)
    if (top2.length >= 2) {
      const sumPct = (Math.abs(top2[0].pnlContribution) + Math.abs(top2[1].pnlContribution)) * 100
      recs.push({
        id: 'rec-concentration',
        title: '降低組合集中度',
        body: `前兩大標的（${top2[0].stockName}、${top2[1].stockName}）貢獻近 ${sumPct.toFixed(1)}% 獲利。可考慮在強勢標的達到目標報酬後分批減倉，將資金分散至其他高勝率標的。`,
        priority: 4,
        scope: 'portfolio',
      })
    }
  }

  // 9. 追蹤更多績效指標（priority 9，固定條目）
  recs.push({
    id: 'rec-track-more-metrics',
    title: '追蹤更多績效指標',
    body: '建議補充：分產業別分析、加碼行為分析、星期別勝率統計，讓評估更完整。',
    priority: 9,
    scope: 'portfolio',
  })

  // 依 priority 升序排列
  return recs.sort((a, b) => a.priority - b.priority)
}
