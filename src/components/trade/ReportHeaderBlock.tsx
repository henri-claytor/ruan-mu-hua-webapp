import type { Trade } from '../../lib/trade'

interface Props {
  trades: Trade[]
}

function fmtPeriod(dateStr: string): string {
  const [y, m] = dateStr.split('-')
  return `${y}.${m}`
}

function fmtAnalysisDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

export default function ReportHeaderBlock({ trades }: Props) {
  if (trades.length === 0) return null

  const buyDates = trades.map((t) => t.buyDate).sort()
  const sellDates = trades.map((t) => t.sellDate).sort()
  const periodStart = fmtPeriod(buyDates[0])
  const periodEnd = fmtPeriod(sellDates[sellDates.length - 1])
  const analysisDate = fmtAnalysisDate(new Date())

  return (
    <div id="performance-report-header" className="border-b border-base pb-4">
      <h1 className="font-serif text-h1 font-bold text-main tracking-wide">
        投資績效分析報告
      </h1>
      <p className="text-small text-dim mt-1">
        期間：{periodStart} – {periodEnd} · 分析日期：{analysisDate}
      </p>
    </div>
  )
}
