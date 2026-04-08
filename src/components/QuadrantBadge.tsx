import type { Quadrant } from '../lib/ev'

interface QuadrantBadgeProps {
  quadrant: Quadrant
}

const quadrantStyle: Record<Quadrant, { bg: string; text: string; icon: string }> = {
  '高賠率正期望值（最佳）': { bg: 'bg-green-100', text: 'text-green-800', icon: '🏆' },
  '低賠率正期望值（勝率驅動）': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '✅' },
  '高賠率負期望值（賠率驅動但勝率不足）': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⚠️' },
  '低賠率負期望值（避免）': { bg: 'bg-red-100', text: 'text-red-800', icon: '🚫' },
}

export default function QuadrantBadge({ quadrant }: QuadrantBadgeProps) {
  const style = quadrantStyle[quadrant]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${style.bg} ${style.text}`}
    >
      <span>{style.icon}</span>
      {quadrant}
    </span>
  )
}
