import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

interface StockSelectorProps {
  /** Currently selected stock code */
  value: string
  /** Called when user selects a stock from the dropdown */
  onChange: (code: string, name: string) => void
  /** Optional list of codes that are already selected (for duplicate prevention) */
  disabledCodes?: string[]
  /** Extra class names for the wrapper */
  className?: string
}

export default function StockSelector({
  value,
  onChange,
  disabledCodes = [],
  className = '',
}: StockSelectorProps) {
  const stockList = useAppStore((s) => s.stockList)
  const loading = stockList.length === 0

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Display the selected stock label when not searching
  const selectedStock = stockList.find((s) => s.code === value)
  const displayLabel = selectedStock ? `${selectedStock.code} ${selectedStock.name}` : ''

  // Filter: match code or name containing query string；下拉清單支援滾動，最多顯示 200 筆以保護效能
  const trimmedQuery = query.trim()
  const filtered =
    trimmedQuery === ''
      ? stockList.slice(0, 200)
      : stockList
          .filter(
            (s) =>
              s.code.includes(trimmedQuery) ||
              s.name.includes(trimmedQuery)
          )
          .slice(0, 200)

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setOpen(true)
  }

  function handleFocus() {
    setOpen(true)
    setQuery('')
  }

  function handleSelect(code: string, name: string) {
    const dupLabel = disabledCodes.includes(code) ? `${name} 已在組合中` : ''
    if (dupLabel) return
    onChange(code, name)
    setQuery('')
    setOpen(false)
  }

  const inputValue = open ? query : displayLabel

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        disabled={loading}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={loading ? '載入中...' : '輸入代號或名稱搜尋'}
        className="w-full px-3 py-2 border border-base rounded-lg text-small text-main bg-surface
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   disabled:bg-elevated disabled:text-faint disabled:cursor-not-allowed"
      />

      {open && !loading && (
        <div
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-base
                     rounded-xl shadow-lg max-h-[300px] overflow-y-auto"
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-small text-faint">找不到符合的股票</p>
          ) : (
            <ul>
              {filtered.map((s) => {
                const isDuplicate = disabledCodes.includes(s.code)
                return (
                  <li key={s.code}>
                    <button
                      type="button"
                      disabled={isDuplicate}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelect(s.code, s.name)
                      }}
                      className={`w-full text-left px-4 py-2.5 text-small transition-colors
                        ${
                          isDuplicate
                            ? 'text-faint cursor-not-allowed bg-elevated'
                            : 'text-main hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
                        }
                        ${s.code === value ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                      `}
                    >
                      <span className="font-mono mr-2">{s.code}</span>
                      <span>{s.name}</span>
                      {isDuplicate && (
                        <span className="ml-2 text-caption text-faint">（已在組合中）</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
