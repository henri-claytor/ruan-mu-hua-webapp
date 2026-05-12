import { Icon } from './icons'
import type { Quadrant } from '../lib/ev'
import type { PerformanceQuadrant } from '../lib/trade'

interface QuadrantStyle {
  bg: string
  text: string
  border: string
  Icon: typeof Icon.Trophy
}

const evQuadrantStyle: Record<Quadrant, QuadrantStyle> = {
  '高賠率正期望值（最佳）':           { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300', Icon: Icon.Trophy },
  '低賠率正期望值（勝率驅動）':       { bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-300',  Icon: Icon.Check  },
  '高賠率負期望值（賠率驅動但勝率不足）': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', Icon: Icon.Alert },
  '低賠率負期望值（避免）':           { bg: 'bg-red-50',   text: 'text-red-700',   border: 'border-red-300',   Icon: Icon.Ban    },
}

const performanceQuadrantStyle: Record<PerformanceQuadrant, QuadrantStyle> = {
  'Q1: 打法好・結果好':                          { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300', Icon: Icon.Trophy },
  'Q2: 打法差・結果好（靠重倉或勝率撐場）':       { bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-300',  Icon: Icon.Alert },
  'Q3: 打法好・結果差（資金管理需改善）':         { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', Icon: Icon.TrendDown },
  'Q4: 打法差・結果差（全面檢討）':               { bg: 'bg-red-50',   text: 'text-red-700',   border: 'border-red-300',   Icon: Icon.Ban },
  '單向紀錄（全勝或全敗）':                       { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300', Icon: Icon.Wave },
}

const performanceQuadrantCompact: Record<PerformanceQuadrant, string> = {
  'Q1: 打法好・結果好':                          'Q1 雙優',
  'Q2: 打法差・結果好（靠重倉或勝率撐場）':       'Q2 隱藏風險',
  'Q3: 打法好・結果差（資金管理需改善）':         'Q3 管理問題',
  'Q4: 打法差・結果差（全面檢討）':               'Q4 待檢討',
  '單向紀錄（全勝或全敗）':                       '單向紀錄',
}

interface QuadrantBadgeProps {
  quadrant: Quadrant | PerformanceQuadrant
  size?: 'normal' | 'large'
  compact?: boolean
}

function isPerformanceQuadrant(q: string): q is PerformanceQuadrant {
  return (
    q.startsWith('Q1:') ||
    q.startsWith('Q2:') ||
    q.startsWith('Q3:') ||
    q.startsWith('Q4:') ||
    q.startsWith('單向紀錄')
  )
}

export default function QuadrantBadge({ quadrant, size = 'normal', compact = false }: QuadrantBadgeProps) {
  const isPerf = isPerformanceQuadrant(quadrant)
  const style = isPerf
    ? performanceQuadrantStyle[quadrant]
    : evQuadrantStyle[quadrant as Quadrant]
  const { Icon: SvgIcon } = style

  // compact 模式只對 PerformanceQuadrant 有意義
  const displayLabel = compact && isPerf ? performanceQuadrantCompact[quadrant] : quadrant
  const tooltip = compact && isPerf ? quadrant : undefined

  if (size === 'large') {
    return (
      <span
        title={tooltip}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-h2 font-bold border-2 ${style.bg} ${style.text} ${style.border}`}
      >
        <SvgIcon size={24} />
        {displayLabel}
      </span>
    )
  }

  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-semibold ${style.bg} ${style.text}`}
    >
      <SvgIcon size={12} />
      {displayLabel}
    </span>
  )
}
