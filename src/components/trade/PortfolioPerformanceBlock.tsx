import { useState } from 'react'
import { fmtMoney, fmtPct } from '../../utils/format'
import type { PortfolioPerformance } from '../../lib/trade'

interface Props {
  performance: PortfolioPerformance
}

function fmtRatio(n: number, digits = 2): string {
  if (!isFinite(n)) return '∞'
  return n.toFixed(digits)
}

type ToneClass = 'pos' | 'neg' | 'neu'

function toneFromValue(n: number): ToneClass {
  if (n > 0) return 'pos'
  if (n < 0) return 'neg'
  return 'neu'
}

function KpiCard({
  label,
  value,
  tone = 'neu',
  base,
}: {
  label: string
  value: string
  tone?: ToneClass
  base?: string
}) {
  const valueClass =
    tone === 'pos' ? 'text-red-700' :
    tone === 'neg' ? 'text-green-700' :
    'text-main'
  return (
    <div className="bg-elevated border border-base rounded-xl px-4 py-3">
      <div className="text-caption text-dim mb-1">{label}</div>
      <div className={`font-serif text-display font-bold leading-none num ${valueClass}`}>
        {value}
      </div>
      {base && <div className="text-caption text-faint mt-2 num">{base}</div>}
    </div>
  )
}

export default function PortfolioPerformanceBlock({ performance: p }: Props) {
  const [stepsOpen, setStepsOpen] = useState(false)

  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
      <div>
        <h2 className="font-serif text-h2 font-bold text-main tracking-wide">
          一、整體投資組合概覽
        </h2>
        <p className="text-caption text-faint mt-0.5">
          共 {p.nTrades} 筆交易（{p.nWins} 勝 / {p.nLosses} 敗 / {p.nFlat} 平）
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="總實現損益"
          value={fmtMoney(p.totalPnl)}
          tone={toneFromValue(p.totalPnl)}
          base={
            p.maxDrawdownPct === 0
              ? '無回撤'
              : `最大回撤 ${fmtMoney(p.maxDrawdown)}（${fmtPct(p.maxDrawdownPct)}）`
          }
        />
        <KpiCard
          label="整體報酬率"
          value={fmtPct(p.overallReturn)}
          tone={toneFromValue(p.overallReturn)}
          base={`年化 ${fmtPct(p.annualizedReturn)}`}
        />
        <KpiCard
          label="整體勝率"
          value={fmtPct(p.winRate)}
          tone="neu"
          base={`勝 ${p.nWins} / 共 ${p.nTrades}`}
        />
        <KpiCard
          label="獲利因子"
          value={`${fmtRatio(p.profitFactor)}x`}
          tone="neu"
        />
        <KpiCard
          label="平均持有天數"
          value={`${p.avgHoldingDays.toFixed(1)} 天`}
          tone="neu"
          base={`最長 ${p.maxHoldingDays} / 最短 ${p.minHoldingDays}`}
        />
        <KpiCard
          label="勝場均報酬"
          value={fmtPct(p.avgWinReturnRate)}
          tone={toneFromValue(p.avgWinReturnRate)}
        />
        <KpiCard
          label="敗場均虧損"
          value={fmtPct(p.avgLossReturnRate)}
          tone={toneFromValue(p.avgLossReturnRate)}
        />
        <KpiCard
          label="損益比（賠率）"
          value={`${fmtRatio(p.payoffRatio)}x`}
          tone="neu"
        />
      </div>

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
            <p>勝率 = {p.nWins} / {p.nTrades} = <span className="font-semibold">{fmtPct(p.winRate)}</span></p>
            <p>損益比 = |平均獲利報酬率 {fmtPct(p.avgWinReturnRate)}| ÷ |平均虧損報酬率 {fmtPct(p.avgLossReturnRate)}| = <span className="font-semibold">{fmtRatio(p.payoffRatio)}</span></p>
            <p>獲利因子 = 總獲利 {fmtMoney(p.avgWinPnl * p.nWins)} ÷ |總虧損 {fmtMoney(p.avgLossPnl * p.nLosses)}| = <span className="font-semibold">{fmtRatio(p.profitFactor)}</span></p>
            <p>整體報酬 = 總損益 {fmtMoney(p.totalPnl)} ÷ 總投入 {fmtMoney(p.totalInvested)} = <span className="font-semibold">{fmtPct(p.overallReturn)}</span></p>
            <p>年化報酬 = (1 + 整體報酬)^(365/操作天數) − 1 = <span className="font-semibold">{fmtPct(p.annualizedReturn)}</span></p>
          </div>
        )}
      </div>
    </div>
  )
}
