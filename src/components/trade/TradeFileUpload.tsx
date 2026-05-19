import { useState, useRef } from 'react'
import { parseTradesCSV } from '../../lib/csv'
import type { Trade } from '../../lib/trade'

interface Props {
  onImport: (trades: Trade[]) => void
}

export default function TradeFileUpload({ onImport }: Props) {
  const [parsedTrades, setParsedTrades] = useState<Trade[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setErrors([])
    setParsedTrades([])
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrors(['請上傳 .csv 檔案'])
      return
    }
    try {
      const text = await file.text()
      const { trades, errors } = parseTradesCSV(text)
      setParsedTrades(trades)
      setErrors(errors)
    } catch (err) {
      setErrors([`讀取檔案失敗：${String(err)}`])
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function confirmImport() {
    if (parsedTrades.length === 0) return
    onImport(parsedTrades)
    setParsedTrades([])
    setErrors([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function cancel() {
    setParsedTrades([])
    setErrors([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`upload-area ${isDragOver ? 'border-[#9a7a2e] bg-[rgba(154,122,46,0.06)]' : ''}`}
      >
        <svg className="upload-icon mx-auto" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <div className="upload-txt">
          {isDragOver ? '放開以上傳' : '拖放 CSV 檔案到此處，或點擊選擇檔案'}
        </div>
        <div className="upload-sub">通用格式 13 欄（stock_id, stock_name, buy_date, ...）</div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>

      <p className="text-caption text-faint">
        <a
          href="/example-trades.csv"
          download
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          下載範例 CSV
        </a>
        　查看正確格式
      </p>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
          <p className="text-small font-semibold text-red-700">解析錯誤（{errors.length} 條）：</p>
          <ul className="text-caption text-red-600 list-disc pl-5 space-y-0.5">
            {errors.slice(0, 10).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
            {errors.length > 10 && <li>...還有 {errors.length - 10} 條錯誤</li>}
          </ul>
        </div>
      )}

      {parsedTrades.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <p className="text-small font-semibold text-blue-700">
            解析成功，共 {parsedTrades.length} 筆。預覽前 5 筆：
          </p>
          <div className="text-caption text-blue-700 space-y-0.5">
            {parsedTrades.slice(0, 5).map((t) => (
              <div key={t.id}>
                {t.stockId} {t.stockName} · {t.buyDate} → {t.sellDate} · 損益 {t.pnl.toLocaleString()} 元
              </div>
            ))}
            {parsedTrades.length > 5 && <div>...及其餘 {parsedTrades.length - 5} 筆</div>}
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={confirmImport} className="btn btn-solid">
              確認匯入 {parsedTrades.length} 筆
            </button>
            <button onClick={cancel} className="btn btn-ghost">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
