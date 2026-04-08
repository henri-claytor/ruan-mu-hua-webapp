import { useState } from 'react'
import { parseReturns } from '../lib/utils'

interface DataInputProps {
  label: string
  placeholder?: string
  onChange: (returns: number[]) => void
  minCount?: number
}

export default function DataInput({
  label,
  placeholder = '每行一筆，或以逗號分隔\n例如：0.05\n-0.02\n0.03',
  onChange,
  minCount = 10,
}: DataInputProps) {
  const [text, setText] = useState('')
  const [count, setCount] = useState(0)
  const [error, setError] = useState('')

  function handleChange(value: string) {
    setText(value)
    const parsed = parseReturns(value)
    setCount(parsed.length)

    if (value.trim() === '') {
      setError('')
      onChange([])
    } else if (parsed.length < minCount) {
      setError(`請輸入至少 ${minCount} 筆月報酬率（目前 ${parsed.length} 筆）`)
      onChange([])
    } else {
      setError('')
      onChange(parsed)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   resize-y"
        placeholder={placeholder}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
      />
      <div className="flex items-center gap-3 text-sm">
        <span className={`font-medium ${count >= minCount ? 'text-green-600' : 'text-gray-500'}`}>
          已讀取：{count} 筆
        </span>
        {error && <span className="text-red-500">{error}</span>}
      </div>
    </div>
  )
}
