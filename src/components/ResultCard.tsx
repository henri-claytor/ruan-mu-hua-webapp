interface ResultCardProps {
  title: string
  value: string | number
  unit?: string
  color?: 'default' | 'green' | 'red' | 'blue' | 'yellow'
  subtitle?: string
  large?: boolean
}

const colorMap = {
  default: 'bg-surface border-base text-main',
  green: 'bg-green-50 border-green-200 text-green-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  yellow: 'bg-amber-50 border-amber-200 text-amber-700',
}

export default function ResultCard({
  title,
  value,
  unit,
  color = 'default',
  subtitle,
  large = false,
}: ResultCardProps) {
  return (
    <div className={`border rounded-xl p-4 ${colorMap[color]}`}>
      <p className="text-label font-medium uppercase tracking-wider opacity-70 mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className={`font-bold ${large ? 'text-display' : 'text-h1'}`}>
          {typeof value === 'number' ? value.toFixed(4) : value}
        </span>
        {unit && <span className="text-small font-medium opacity-70">{unit}</span>}
      </div>
      {subtitle && <p className="text-caption mt-1 opacity-60">{subtitle}</p>}
    </div>
  )
}
