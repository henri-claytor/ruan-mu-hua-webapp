import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Trade } from '../../lib/trade'
import { daysBetween } from '../../lib/trade'
import { calcPearsonCorrelation, interpretCorrelation } from '../../lib/correlation'
import { TOOLTIP_STYLE, AXIS_TICK_STYLE, CHART_COLORS } from '../../utils/chartStyle'

interface Props {
  trades: Trade[]
}

interface ScatterPoint {
  x: number       // 持有天數
  y: number       // 報酬率 %
  stockName: string
  stockId: string
}

function fmtR(r: number): string {
  const sign = r >= 0 ? '+' : ''
  return `${sign}${r.toFixed(2)}`
}

export default function HoldingReturnScatter({ trades }: Props) {
  if (trades.length < 5) {
    return (
      <div className="bg-elevated border border-base rounded-xl p-4">
        <h3 className="text-body font-semibold text-main mb-1">持有天數 vs 報酬率</h3>
        <p className="text-small text-dim">
          樣本不足無法計算相關性（目前 {trades.length} 筆，需要至少 5 筆）
        </p>
      </div>
    )
  }

  const points: ScatterPoint[] = trades.map((t) => ({
    x: daysBetween(t.buyDate, t.sellDate),
    y: t.returnRate * 100,
    stockName: t.stockName,
    stockId: t.stockId,
  }))

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const r = calcPearsonCorrelation(xs, ys)
  const interpretation = interpretCorrelation(r)

  return (
    <div className="bg-elevated border border-base rounded-xl p-4">
      <div className="mb-3">
        <h3 className="text-body font-semibold text-main">持有天數 vs 報酬率</h3>
        <p className="text-caption text-dim mt-1 num">
          相關係數 r = <span className="font-semibold">{fmtR(r)}</span>
          <span className="ml-2 text-main">| {interpretation}</span>
        </p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            type="number"
            dataKey="x"
            name="持有天數"
            unit=" 天"
            tick={AXIS_TICK_STYLE}
            label={{ value: '持有天數', position: 'insideBottom', offset: -15, fontSize: 11, fill: 'var(--color-dim)' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="報酬率"
            unit="%"
            tick={AXIS_TICK_STYLE}
            label={{ value: '報酬率 (%)', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--color-dim)' }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            {...TOOLTIP_STYLE}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null
              const p = payload[0].payload as ScatterPoint
              return (
                <div style={TOOLTIP_STYLE.contentStyle}>
                  <div style={{ fontWeight: 600, color: 'var(--color-main)' }}>
                    {p.stockName} {p.stockId}
                  </div>
                  <div style={{ color: 'var(--color-dim)', marginTop: 4 }}>
                    持有 {p.x} 天 · 報酬 {p.y >= 0 ? '+' : ''}{p.y.toFixed(2)}%
                  </div>
                </div>
              )
            }}
          />
          <Scatter data={points} fill={CHART_COLORS.bar}>
            {points.map((p, i) => (
              <Cell
                key={i}
                fill={p.y > 0 ? CHART_COLORS.positive : p.y < 0 ? CHART_COLORS.negative : '#9CA3AF'}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
