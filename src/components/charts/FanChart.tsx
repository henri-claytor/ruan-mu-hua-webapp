import { useState } from 'react'
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

interface FanChartProps {
  paths: number[][] // paths[path][month], month 0 = initial value
}

type Range = '1Y' | '3Y' | '5Y'
const RANGE_MONTHS: Record<Range, number> = { '1Y': 12, '3Y': 36, '5Y': 60 }

function pct(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.floor(sorted.length * p)
  return sorted[Math.min(idx, sorted.length - 1)]
}

function fmtWan(v: number): string {
  return (v / 10000).toFixed(0) + '萬'
}

export default function FanChart({ paths }: FanChartProps) {
  const [activeRange, setActiveRange] = useState<Range>('5Y')

  if (paths.length === 0) return null

  const totalMonths = paths[0].length - 1
  const displayMonths = Math.min(RANGE_MONTHS[activeRange], totalMonths)

  const data: { month: number; p5: number; p50: number; p95: number }[] = []
  for (let m = 0; m <= displayMonths; m++) {
    const values = paths.map((p) => p[m])
    data.push({
      month: m,
      p5: pct(values, 0.05),
      p50: pct(values, 0.5),
      p95: pct(values, 0.95),
    })
  }

  const ranges: Range[] = ['1Y', '3Y', '5Y']

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-small font-medium text-dim">模擬路徑扇形圖</p>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setActiveRange(r)}
              className={`px-2 py-0.5 text-caption rounded font-medium transition-colors ${
                activeRange === r
                  ? 'border-b-[3px] border-blue-500 text-blue-600'
                  : 'text-dim hover:text-main'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="month"
            tick={AXIS_TICK_STYLE}
            tickFormatter={(v) => (v % 12 === 0 && v > 0 ? `${v / 12}年` : '')}
          />
          <YAxis tick={AXIS_TICK_STYLE} tickFormatter={fmtWan} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE.contentStyle}
            labelStyle={TOOLTIP_STYLE.labelStyle}
            itemStyle={TOOLTIP_STYLE.itemStyle}
            formatter={(value: unknown, name: unknown) => [
              typeof value === 'number' ? fmtWan(value) : String(value),
              String(name).toUpperCase(),
            ]}
            labelFormatter={(m) => `第 ${m} 個月`}
          />
          {displayMonths >= 12 && (
            <ReferenceLine x={12} stroke={CHART_COLORS.refLine} strokeDasharray="4 4" label={{ value: '1年', fontSize: 10 }} />
          )}
          {displayMonths >= 36 && (
            <ReferenceLine x={36} stroke={CHART_COLORS.refLine} strokeDasharray="4 4" label={{ value: '3年', fontSize: 10 }} />
          )}
          <Line type="monotone" dataKey="p95" stroke={CHART_COLORS.p95} strokeWidth={2} dot={false} name="P95" />
          <Line type="monotone" dataKey="p50" stroke={CHART_COLORS.p50} strokeWidth={2} dot={false} name="P50" />
          <Line type="monotone" dataKey="p5" stroke={CHART_COLORS.p5} strokeWidth={2} dot={false} name="P5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
