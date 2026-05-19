import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Trade } from '../../lib/trade'
import { holdingDaysHistogram } from '../../lib/trade'
import { TOOLTIP_STYLE, AXIS_TICK_STYLE, CHART_COLORS } from '../../utils/chartStyle'

interface Props {
  trades: Trade[]
}

export default function HoldingDaysDistribution({ trades }: Props) {
  const data = holdingDaysHistogram(trades).map((b) => ({
    bucket: b.bucket,
    勝場: b.wins,
    敗場: b.losses,
  }))

  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-3">
      <div>
        <h3 className="font-serif text-h2 font-bold text-main tracking-wide">持有天數分佈</h3>
        <p className="text-caption text-faint mt-0.5">分桶統計勝場與敗場筆數</p>
      </div>

      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 12, bottom: 5, left: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
            <XAxis dataKey="bucket" tick={AXIS_TICK_STYLE} />
            <YAxis tick={AXIS_TICK_STYLE} allowDecimals={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="勝場" stackId="a" fill={CHART_COLORS.negative} />
            <Bar dataKey="敗場" stackId="a" fill={CHART_COLORS.positive} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
