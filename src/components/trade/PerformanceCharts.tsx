import { useState } from 'react'
import CumulativePnlChart from '../charts/CumulativePnlChart'
import StockContributionBar from '../charts/StockContributionBar'
import HoldingDaysDistribution from '../charts/HoldingDaysDistribution'
import type { Trade, StockStats } from '../../lib/trade'

interface Props {
  trades: Trade[]
  stocks: StockStats[]
}

export default function PerformanceCharts({ trades, stocks }: Props) {
  const [open, setOpen] = useState(true)
  if (trades.length === 0) return null

  const sampleSmall = trades.length < 5

  return (
    <div className="bg-surface rounded-2xl border border-base overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-elevated transition-colors"
      >
        <div className="text-left">
          <h2 className="text-h2 font-semibold text-main">績效視覺化</h2>
          <p className="text-caption text-faint mt-0.5">
            累積損益曲線、個股貢獻、持有天數分佈
          </p>
        </div>
        <span className="text-faint text-small">{open ? '▼ 收折績效視覺化' : '▶ 展開績效視覺化'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4">
          {sampleSmall && (
            <p className="text-small text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              交易筆數較少（{trades.length} 筆 &lt; 5），圖表參考度有限
            </p>
          )}

          <CumulativePnlChart trades={trades} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StockContributionBar stocks={stocks} />
            <HoldingDaysDistribution trades={trades} />
          </div>
        </div>
      )}
    </div>
  )
}
