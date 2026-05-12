type Emphasis = 'hero' | 'normal' | 'muted'

interface ResultCardProps {
  title: string
  value: string | number
  unit?: string
  color?: 'default' | 'green' | 'red' | 'blue' | 'yellow'
  subtitle?: string
  /** Hero = 主要結論值；normal = 一般指標；muted = 弱化次要資訊 */
  emphasis?: Emphasis
  /** @deprecated 使用 emphasis="hero" 取代；保留為 alias 以向後相容 */
  large?: boolean
}

const colorMap = {
  default: 'bg-surface border-base text-main',
  green: 'bg-green-50 border-green-200 text-green-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  yellow: 'bg-amber-50 border-amber-200 text-amber-700',
}

const heroColorMap = {
  default: 'bg-elevated border-2 border-base text-main',
  green: 'bg-green-50 border-2 border-green-300 text-green-700',
  red: 'bg-red-50 border-2 border-red-300 text-red-700',
  blue: 'bg-blue-50 border-2 border-blue-300 text-blue-700',
  yellow: 'bg-amber-50 border-2 border-amber-300 text-amber-700',
}

export default function ResultCard({
  title,
  value,
  unit,
  color = 'default',
  subtitle,
  emphasis = 'normal',
  large = false,
}: ResultCardProps) {
  // large prop 為 hero 的 alias（向後相容）
  const eff: Emphasis = large ? 'hero' : emphasis

  if (eff === 'muted') {
    return (
      <div className="px-2 py-1">
        <p className="text-label text-faint mb-0.5">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className="num text-body text-dim">
            {typeof value === 'number' ? value.toFixed(4) : value}
          </span>
          {unit && <span className="text-caption text-faint">{unit}</span>}
        </div>
        {subtitle && <p className="text-caption text-faint mt-0.5">{subtitle}</p>}
      </div>
    )
  }

  if (eff === 'hero') {
    return (
      <div className={`rounded-xl p-5 ${heroColorMap[color]}`}>
        <p className="text-label font-medium uppercase tracking-wider opacity-70 mb-1.5">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className="num text-display font-extrabold">
            {typeof value === 'number' ? value.toFixed(4) : value}
          </span>
          {unit && <span className="text-small font-medium opacity-70">{unit}</span>}
        </div>
        {subtitle && <p className="text-small mt-1.5 opacity-70">{subtitle}</p>}
      </div>
    )
  }

  // normal
  return (
    <div className={`border rounded-xl p-4 ${colorMap[color]}`}>
      <p className="text-label font-medium uppercase tracking-wider opacity-70 mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="num font-bold text-h1">
          {typeof value === 'number' ? value.toFixed(4) : value}
        </span>
        {unit && <span className="text-small font-medium opacity-70">{unit}</span>}
      </div>
      {subtitle && <p className="text-caption mt-1 opacity-60">{subtitle}</p>}
    </div>
  )
}
