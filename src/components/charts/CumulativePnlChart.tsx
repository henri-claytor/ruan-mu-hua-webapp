import {
  Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, ComposedChart,
} from 'recharts'
import type { Trade } from '../../lib/trade'
import { TOOLTIP_STYLE, AXIS_TICK_STYLE, CHART_COLORS } from '../../utils/chartStyle'
import { fmtMoney, fmtPct } from '../../utils/format'

interface Props {
  trades: Trade[]
}

interface Point {
  date: string
  cumPnl: number
  runningMax: number
}

function buildSeries(trades: Trade[]): {
  points: Point[]
  maxDrawdown: number
  maxDrawdownPct: number
  ddStart: string | null
  ddEnd: string | null
} {
  const sorted = [...trades].sort((a, b) =>
    a.sellDate < b.sellDate ? -1 : a.sellDate > b.sellDate ? 1 : 0,
  )
  let cum = 0
  let runningMax = 0
  const points: Point[] = []
  let maxDrawdown = 0
  let maxDrawdownPct = 0
  let runningMaxAtTrough = 0
  let troughIdx = -1

  sorted.forEach((t) => {
    cum += t.pnl
    if (cum > runningMax) runningMax = cum
    points.push({ date: t.sellDate, cumPnl: cum, runningMax })
    const dd = cum - runningMax
    if (dd < maxDrawdown) {
      maxDrawdown = dd
      runningMaxAtTrough = runningMax
      troughIdx = points.length - 1
    }
  })

  if (runningMaxAtTrough > 0) maxDrawdownPct = maxDrawdown / runningMaxAtTrough

  // 找回撤起點：troughIdx 之前最近一次 cumPnl === runningMax 的點
  let ddStart: string | null = null
  let ddEnd: string | null = null
  if (troughIdx >= 0 && maxDrawdown < 0) {
    ddEnd = points[troughIdx].date
    for (let i = troughIdx; i >= 0; i--) {
      if (points[i].cumPnl >= runningMaxAtTrough) {
        ddStart = points[i].date
        break
      }
    }
  }

  return { points, maxDrawdown, maxDrawdownPct, ddStart, ddEnd }
}

export default function CumulativePnlChart({ trades }: Props) {
  if (trades.length === 0) return null
  const { points, maxDrawdown, maxDrawdownPct, ddStart, ddEnd } = buildSeries(trades)

  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-3">
      <div>
        <h3 className="font-serif text-h2 font-bold text-main tracking-wide">累積實現損益曲線</h3>
        {maxDrawdown < 0 ? (
          <p className="text-caption text-faint mt-0.5">
            最大回撤
            <span className="text-green-700 font-semibold mx-1 num">
              {fmtMoney(maxDrawdown)}
            </span>
            （從高點 <span className="text-green-700 font-semibold num">{fmtPct(maxDrawdownPct)}</span>）
            {ddStart && ddEnd && (
              <span className="ml-1">· 區間 {ddStart} → {ddEnd}</span>
            )}
          </p>
        ) : (
          <p className="text-caption text-faint mt-0.5">從未創淨值高點，無有效回撤</p>
        )}
      </div>

      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <ComposedChart data={points} margin={{ top: 10, right: 12, bottom: 0, left: 12 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={AXIS_TICK_STYLE}
              tickFormatter={(d: string) => d.slice(2, 7)}
              minTickGap={30}
            />
            <YAxis
              tick={AXIS_TICK_STYLE}
              tickFormatter={(v: number) => `${(v / 10000).toFixed(0)} 萬`}
            />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(v, name) => [fmtMoney(Number(v)), String(name)]}
            />
            {ddStart && ddEnd && (
              <ReferenceArea
                x1={ddStart}
                x2={ddEnd}
                fill={CHART_COLORS.positive}
                fillOpacity={0.12}
                strokeOpacity={0}
              />
            )}
            <Area
              type="monotone"
              dataKey="cumPnl"
              name="累積損益"
              stroke={CHART_COLORS.p50}
              strokeWidth={2}
              fill={CHART_COLORS.p50}
              fillOpacity={0.18}
            />
            <Line
              type="monotone"
              dataKey="runningMax"
              name="滾動高點"
              stroke={CHART_COLORS.refLine}
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
