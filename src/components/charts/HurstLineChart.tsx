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

interface HurstLineChartProps {
  cumDeviations: number[]
}

export default function HurstLineChart({ cumDeviations }: HurstLineChartProps) {
  if (cumDeviations.length === 0) return null

  const maxX = Math.max(...cumDeviations)
  const minX = Math.min(...cumDeviations)

  const data = cumDeviations.map((x, i) => ({ month: i + 1, Xt: x }))

  return (
    <div>
      <p className="text-sm font-medium text-gray-600 mb-2">累積偏差序列（Xₜ）</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} label={{ value: '月份', position: 'insideBottom', offset: -2, fontSize: 11 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(v: unknown) => [
              typeof v === 'number' ? v.toFixed(6) : String(v),
              'Xₜ',
            ]}
            labelFormatter={(m) => `第 ${m} 月`}
          />
          {/* MAX 水平虛線 */}
          <ReferenceLine
            y={maxX}
            stroke="#16a34a"
            strokeDasharray="5 3"
            label={{ value: `MAX=${maxX.toFixed(4)}`, fontSize: 9, fill: '#16a34a', position: 'right' }}
          />
          {/* MIN 水平虛線 */}
          <ReferenceLine
            y={minX}
            stroke="#dc2626"
            strokeDasharray="5 3"
            label={{ value: `MIN=${minX.toFixed(4)}`, fontSize: 9, fill: '#dc2626', position: 'right' }}
          />
          <Line type="monotone" dataKey="Xt" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-center text-gray-400 mt-1">
        R = MAX − MIN = {(maxX - minX).toFixed(6)}（藍線區間即為 R）
      </p>
    </div>
  )
}
