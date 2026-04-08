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

interface FanChartProps {
  paths: number[][] // paths[path][month], month 0 = initial value
}

function pct(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.floor(sorted.length * p)
  return sorted[Math.min(idx, sorted.length - 1)]
}

function fmtWan(v: number): string {
  return (v / 10000).toFixed(0) + '萬'
}

export default function FanChart({ paths }: FanChartProps) {
  if (paths.length === 0) return null

  const months = paths[0].length - 1
  const data: { month: number; p5: number; p50: number; p95: number }[] = []

  for (let m = 0; m <= months; m++) {
    const values = paths.map((p) => p[m])
    data.push({
      month: m,
      p5: pct(values, 0.05),
      p50: pct(values, 0.5),
      p95: pct(values, 0.95),
    })
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-600 mb-2">模擬路徑扇形圖</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => (v % 12 === 0 && v > 0 ? `${v / 12}年` : '')}
          />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtWan} />
          <Tooltip
            formatter={(value: unknown, name: unknown) => [
              typeof value === 'number' ? fmtWan(value) : String(value),
              String(name).toUpperCase(),
            ]}
            labelFormatter={(m) => `第 ${m} 個月`}
          />
          <ReferenceLine x={12} stroke="#d1d5db" strokeDasharray="4 4" label={{ value: '1年', fontSize: 10 }} />
          <ReferenceLine x={36} stroke="#d1d5db" strokeDasharray="4 4" label={{ value: '3年', fontSize: 10 }} />
          <Line type="monotone" dataKey="p95" stroke="#16a34a" strokeWidth={2} dot={false} name="P95" />
          <Line type="monotone" dataKey="p50" stroke="#2563eb" strokeWidth={2} dot={false} name="P50" />
          <Line type="monotone" dataKey="p5" stroke="#dc2626" strokeWidth={2} dot={false} name="P5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
