import { useState } from 'react'
import ResultCard from '../ResultCard'
import QuadrantBadge from '../QuadrantBadge'
import { fmtMoney, fmtPct, colorByReturn } from '../../utils/format'
import type { PortfolioPerformance } from '../../lib/trade'

interface Props {
  performance: PortfolioPerformance
}

function fmtRatio(n: number, digits = 2): string {
  if (!isFinite(n)) return '∞'
  return n.toFixed(digits)
}

type MetricTone = 'pos' | 'neg' | 'neu' | 'red' | 'green' | 'default'
const TONE_TO_CLASS: Record<MetricTone, string> = {
  pos: 'pos',
  red: 'pos',
  neg: 'neg',
  green: 'neg',
  neu: 'neu',
  default: 'neu',
}

function MetricCard({ label, value, tone = 'neu', note }: {
  label: string
  value: string
  tone?: MetricTone
  note?: string
}) {
  const toneClass = TONE_TO_CLASS[tone] ?? 'neu'
  return (
    <div className="metric-card">
      <div className="metric-lbl">{label}</div>
      <div className={`metric-val ${toneClass}`}>{value}</div>
      {note && <div className="metric-note">{note}</div>}
    </div>
  )
}

export default function PortfolioPerformanceBlock({ performance: p }: Props) {
  const [stepsOpen, setStepsOpen] = useState(false)

  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
      {/* Header */}
      <div>
        <h2 className="font-serif text-h2 font-bold text-main tracking-wide">整體交易績效</h2>
        <p className="text-caption text-faint mt-0.5">
          期間 {p.periodStart} – {p.periodEnd} · 共 {p.nTrades} 筆交易（{p.nWins} 勝 / {p.nLosses} 敗 / {p.nFlat} 平）
        </p>
      </div>

      {/* Hero 列：總實現損益 + 4 象限 + 整體報酬率 */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
        <ResultCard
          title="總實現損益"
          value={fmtMoney(p.totalPnl)}
          color={colorByReturn(p.totalPnl)}
          emphasis="hero"
          subtitle={`整體報酬率 ${fmtPct(p.overallReturn)} · 年化 ${fmtPct(p.annualizedReturn)}`}
        />
        <div className="space-y-2">
          <QuadrantBadge quadrant={p.quadrant} size="large" />
          <p className="text-small text-dim">
            賠率 <span className="num font-semibold">{fmtRatio(p.payoffRatio)}</span>
            {' × '}
            獲利因子 <span className="num font-semibold">{fmtRatio(p.profitFactor)}</span>
          </p>
        </div>
      </div>

      {/* 8 張 metric-card（2 列 × 4 欄桌機 / 2 欄手機） */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="總實現損益" value={fmtMoney(p.totalPnl)} tone={colorByReturn(p.totalPnl)} />
        <MetricCard
          label="整體報酬率"
          value={fmtPct(p.overallReturn)}
          tone={colorByReturn(p.overallReturn)}
          note={`年化 ${fmtPct(p.annualizedReturn)}`}
        />
        <MetricCard label="整體勝率" value={fmtPct(p.winRate)} tone="neu" />
        <MetricCard
          label="獲利因子"
          value={fmtRatio(p.profitFactor)}
          tone={isFinite(p.profitFactor) && p.profitFactor >= 2.0 ? 'pos' : 'neu'}
          note="總獲利 ÷ 總虧損"
        />
        <MetricCard label="平均持有天數" value={`${p.avgHoldingDays.toFixed(1)} 天`} tone="neu" />
        <MetricCard label="勝場均報酬" value={fmtPct(p.avgWinReturnRate)} tone={colorByReturn(p.avgWinReturnRate)} />
        <MetricCard label="敗場均虧損" value={fmtPct(p.avgLossReturnRate)} tone={colorByReturn(p.avgLossReturnRate)} />
        <MetricCard
          label="損益比（賠率）"
          value={fmtRatio(p.payoffRatio)}
          tone={isFinite(p.payoffRatio) && p.payoffRatio >= 1.5 ? 'pos' : 'neu'}
          note="平均獲利 ÷ 平均虧損"
        />
      </div>

      {/* 弱化細節 inline 行（移除已上主層的指標）*/}
      <div className="border-t border-base pt-3 space-y-1">
        <p className="text-label text-faint mb-1.5">細部統計</p>
        <p className="text-small text-dim num">
          總投入 <span className="font-semibold">{fmtMoney(p.totalInvested)}</span>
          {' · '}
          期望值（每筆）<span className={`font-semibold ${colorByReturn(p.expectedValue) === 'red' ? 'text-red-700' : colorByReturn(p.expectedValue) === 'green' ? 'text-green-700' : ''}`}>{fmtMoney(p.expectedValue)}</span>
          {' · '}
          最大單筆獲利 <span className="font-semibold text-red-700">{fmtMoney(p.maxWinPnl)}</span>
          {' · '}
          最大單筆虧損 <span className="font-semibold text-green-700">{fmtMoney(p.maxLossPnl)}</span>
        </p>
        <p className="text-small text-dim num">
          最大回撤 <span className="font-semibold text-green-700">{fmtMoney(p.maxDrawdown)}</span>
          {p.maxDrawdownPct < 0 && (
            <>（從高點 {fmtPct(p.maxDrawdownPct)}）</>
          )}
          {' · '}
          最長持有 <span className="font-semibold">{p.maxHoldingDays} 天</span>
          {' · '}
          最短持有 <span className="font-semibold">{p.minHoldingDays} 天</span>
        </p>
      </div>

      {/* 計算依據摺疊 */}
      <div className="border-t border-base pt-3">
        <button
          type="button"
          onClick={() => setStepsOpen((v) => !v)}
          className="text-small text-dim hover:text-main transition-colors"
        >
          {stepsOpen ? '▼ 收折計算依據' : '▶ 展開計算依據'}
        </button>
        {stepsOpen && (
          <div className="mt-3 bg-elevated rounded-lg p-4 text-small num space-y-1.5 text-main">
            <p className="text-dim">主要指標推導：</p>
            <p>
              勝率 = {p.nWins} / {p.nTrades} = <span className="font-semibold">{fmtPct(p.winRate)}</span>
            </p>
            <p>
              賠率 = 平均獲利報酬率 {fmtPct(p.avgWinReturnRate)} ÷ |平均虧損報酬率 {fmtPct(p.avgLossReturnRate)}| = <span className="font-semibold">{fmtRatio(p.payoffRatio)}</span>
            </p>
            <p>
              獲利因子 = 總獲利 {fmtMoney(p.avgWinPnl * p.nWins)} ÷ |總虧損 {fmtMoney(p.avgLossPnl * p.nLosses)}| = <span className="font-semibold">{fmtRatio(p.profitFactor)}</span>
            </p>
            <p>
              期望值 = 勝率 × 平均獲利 + 敗率 × 平均虧損 = <span className="font-semibold">{fmtMoney(p.expectedValue)}</span>
            </p>
            <p>
              整體報酬 = 總損益 {fmtMoney(p.totalPnl)} ÷ 總投入 {fmtMoney(p.totalInvested)} = <span className="font-semibold">{fmtPct(p.overallReturn)}</span>
            </p>
            <p>
              年化 = (1 + 整體報酬)^(365/操作天數) − 1 = <span className="font-semibold">{fmtPct(p.annualizedReturn)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
