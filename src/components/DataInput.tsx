import { parseReturns } from '../lib/utils'

interface DataInputProps {
  label: string
  placeholder?: string
  value: string
  onChange: (text: string, returns: number[]) => void
  minCount?: number
}

export default function DataInput({
  label,
  placeholder = '每行一筆，或以逗號 / Tab 分隔\n支援小數（0.05）或百分比（5%）格式\n例如：0.0412\n-0.0231\n3.12%',
  value,
  onChange,
  minCount = 10,
}: DataInputProps) {
  const parsed = parseReturns(value)
  const count = parsed.length
  const hasError = value.trim() !== '' && count < minCount

  function handleChange(newText: string) {
    const returns = parseReturns(newText)
    const valid = returns.length >= minCount ? returns : []
    onChange(newText, valid)
  }

  return (
    <div className="space-y-2">
      <label className="block text-small font-medium text-dim">{label}</label>
      <textarea
        className="w-full h-40 px-3 py-2 border border-base rounded-lg text-small font-mono
                   text-main bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500
                   focus:border-transparent resize-y"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <span className={`text-small font-medium ${count >= minCount ? 'text-green-700' : 'text-faint'}`}>
          已讀取：{count} 筆
        </span>
        {hasError && (
          <span className="text-small text-red-600">
            請輸入至少 {minCount} 筆月報酬率（目前 {count} 筆）
          </span>
        )}
      </div>
    </div>
  )
}
