import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { StockStats } from '../../lib/trade'
import { TOOLTIP_STYLE, AXIS_TICK_STYLE, CHART_COLORS } from '../../utils/chartStyle'
import { fmtMoney } from '../../utils/format'

interface Props {
  stocks: StockStats[]
}

const TOP_N = 15

interface BarDatum {
  label: string
  pnl: number
}

function buildData(stocks: StockStats[]): BarDatum[] {
  const sorted = [...stocks].sort((a, b) => Math.abs(b.totalPnl) - Math.abs(a.totalPnl))
  if (sorted.length <= TOP_N) {
    return sorted.map((s) => ({
      label: `${s.stockId} ${s.stockName}`,
      pnl: s.totalPnl,
    }))
  }
  const top = sorted.slice(0, TOP_N)
  const rest = sorted.slice(TOP_N)
  const restPnl = rest.reduce((s, x) => s + x.totalPnl, 0)
  return [
    ...top.map((s) => ({ label: `${s.stockId} ${s.stockName}`, pnl: s.totalPnl })),
    { label: `其他（${rest.length} 檔）`, pnl: restPnl },
  ]
}

export default function StockContributionBar({ stocks }: Props) {
  if (stocks.length === 0) return null
  const data = buildData(stocks)
  const height = Math.max(220, data.length * 28 + 40)

  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-3">
      <div>
        <h3 className="font-serif text-h2 font-bold text-main tracking-wide">個股損益貢獻</h3>
        <p className="text-caption text-faint mt-0.5">
          前 {Math.min(TOP_N, stocks.length)} 檔依絕對損益排序 · 紅漲綠跌
        </p>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, bottom: 5, left: 90 }}
          >
            <XAxis
              type="number"
              tick={AXIS_TICK_STYLE}
              tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}`}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={AXIS_TICK_STYLE}
              width={88}
              interval={0}
            />
            <ReferenceLine x={0} stroke={CHART_COLORS.refLine} />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(v) => [fmtMoney(Number(v)), '損益']}
            />
            <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.pnl >= 0 ? CHART_COLORS.negative : CHART_COLORS.positive}
                  // negative 對應 red token = 漲 = 正報酬；positive 對應 green token = 跌 = 負報酬
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
