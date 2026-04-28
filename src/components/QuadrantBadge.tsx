import { Icon } from './icons'
import type { Quadrant } from '../lib/ev'

interface QuadrantBadgeProps {
  quadrant: Quadrant
}

const quadrantStyle: Record<Quadrant, { bg: string; text: string; Icon: typeof Icon.Trophy }> = {
  '高賠率正期望值（最佳）':           { bg: 'bg-green-50', text: 'text-green-700', Icon: Icon.Trophy },
  '低賠率正期望值（勝率驅動）':       { bg: 'bg-blue-50',  text: 'text-blue-700',  Icon: Icon.Check  },
  '高賠率負期望值（賠率驅動但勝率不足）': { bg: 'bg-amber-50', text: 'text-amber-700', Icon: Icon.Alert },
  '低賠率負期望值（避免）':           { bg: 'bg-red-50',   text: 'text-red-700',   Icon: Icon.Ban    },
}

export default function QuadrantBadge({ quadrant }: QuadrantBadgeProps) {
  const style = quadrantStyle[quadrant]
  const { Icon: SvgIcon } = style
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-small font-semibold ${style.bg} ${style.text}`}
    >
      <SvgIcon size={14} />
      {quadrant}
    </span>
  )
}
