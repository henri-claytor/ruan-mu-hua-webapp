import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { TOOLTIP_STYLE, AXIS_TICK_STYLE, CHART_COLORS } from '../../utils/chartStyle'

interface HurstLineChartProps {
  cumDeviations: number[]
  /** e.g. "日頻 252 筆" or "月頻 120 筆" */
  subtitle?: string
}

export default function HurstLineChart({ cumDeviations, subtitle }: HurstLineChartProps) {
  if (cumDeviations.length === 0) return null

  const maxX = Math.max(...cumDeviations)
  const minX = Math.min(...cumDeviations)

  const data = cumDeviations.map((x, i) => ({ month: i + 1, Xt: x }))

  const titleText = subtitle
    ? `累積偏差序列（Xₜ）— ${subtitle}`
    : '累積偏差序列（Xₜ）'

  return (
    <div>
      <p className="text-small font-medium text-dim mb-2">{titleText}</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="month"
            tick={AXIS_TICK_STYLE}
            label={{ value: '月份', position: 'insideBottom', offset: -2, fontSize: 11 }}
          />
          <YAxis tick={AXIS_TICK_STYLE} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE.contentStyle}
            labelStyle={TOOLTIP_STYLE.labelStyle}
            itemStyle={TOOLTIP_STYLE.itemStyle}
            formatter={(v: unknown) => [
              typeof v === 'number' ? v.toFixed(6) : String(v),
              'Xₜ',
            ]}
            labelFormatter={(m) => `第 ${m} 月`}
          />
          <ReferenceLine
            y={maxX}
            stroke={CHART_COLORS.p95}
            strokeDasharray="5 3"
            label={{ value: `MAX=${maxX.toFixed(4)}`, fontSize: 9, fill: CHART_COLORS.p95, position: 'right' }}
          />
          <ReferenceLine
            y={minX}
            stroke={CHART_COLORS.p5}
            strokeDasharray="5 3"
            label={{ value: `MIN=${minX.toFixed(4)}`, fontSize: 9, fill: CHART_COLORS.p5, position: 'right' }}
          />
          <Line type="monotone" dataKey="Xt" stroke={CHART_COLORS.hurst} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-caption text-center text-faint mt-1">
        R = MAX − MIN = {(maxX - minX).toFixed(6)}（藍線區間即為 R）
      </p>
    </div>
  )
}
