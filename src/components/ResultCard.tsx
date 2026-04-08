interface ResultCardProps {
  title: string
  value: string | number
  unit?: string
  color?: 'default' | 'green' | 'red' | 'blue' | 'yellow'
  subtitle?: string
  large?: boolean
}

const colorMap = {
  default: 'bg-white border-gray-200 text-gray-900',
  green: 'bg-green-50 border-green-200 text-green-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
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
      <p className="text-xs font-medium uppercase tracking-wider opacity-70 mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className={`font-bold ${large ? 'text-4xl' : 'text-2xl'}`}>
          {typeof value === 'number' ? value.toFixed(4) : value}
        </span>
        {unit && <span className="text-sm font-medium opacity-70">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs mt-1 opacity-60">{subtitle}</p>}
    </div>
  )
}
