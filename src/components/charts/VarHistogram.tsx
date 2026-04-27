import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { TOOLTIP_STYLE, AXIS_TICK_STYLE, CHART_COLORS } from '../../utils/chartStyle'

interface VarHistogramProps {
  returns: number[]
  var95: number
  var99: number
}

export default function VarHistogram({ returns, var95, var99 }: VarHistogramProps) {
  if (returns.length === 0) return null

  const min = Math.min(...returns)
  const max = Math.max(...returns)
  const bins = 12
  const binWidth = (max - min) / bins

  const buckets: { label: string; count: number; x: number }[] = []
  for (let i = 0; i < bins; i++) {
    const lo = min + i * binWidth
    const hi = lo + binWidth
    const count = returns.filter((r) => r >= lo && (i === bins - 1 ? r <= hi : r < hi)).length
    buckets.push({
      label: (lo * 100).toFixed(1) + '%',
      count,
      x: lo + binWidth / 2,
    })
  }

  return (
    <div>
      <p className="text-small font-medium text-dim mb-2">報酬率分布</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={buckets} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="label" tick={{ ...AXIS_TICK_STYLE, fontSize: 9 }} interval={2} />
          <YAxis tick={AXIS_TICK_STYLE} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE.contentStyle}
            labelStyle={TOOLTIP_STYLE.labelStyle}
            itemStyle={TOOLTIP_STYLE.itemStyle}
            labelFormatter={(l) => `報酬率區間 ${l}`}
            formatter={(v: unknown) => [typeof v === 'number' ? v : String(v), '次數']}
          />
          <Bar dataKey="count" fill={CHART_COLORS.bar} radius={[2, 2, 0, 0]} />
          <ReferenceLine
            x={buckets.find((b) => b.x >= var95)?.label ?? ''}
            stroke={CHART_COLORS.var95}
            strokeWidth={2}
            strokeDasharray="4 2"
            label={{ value: 'VaR95', fontSize: 9, fill: CHART_COLORS.var95, position: 'top' }}
          />
          <ReferenceLine
            x={buckets.find((b) => b.x >= var99)?.label ?? ''}
            stroke={CHART_COLORS.var99}
            strokeWidth={2}
            strokeDasharray="4 2"
            label={{ value: 'VaR99', fontSize: 9, fill: CHART_COLORS.var99, position: 'top' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
