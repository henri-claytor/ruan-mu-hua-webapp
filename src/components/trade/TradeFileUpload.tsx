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
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors
          ${isDragOver ? 'bg-blue-50 border-blue-300' : 'bg-elevated border-base hover:border-blue-300'}`}
      >
        <p className="text-body text-dim">
          {isDragOver ? '放開以上傳' : '拖放 CSV 檔案到此處，或點擊選擇檔案'}
        </p>
        <p className="text-caption text-faint mt-1">通用格式 13 欄（stock_id, stock_name, buy_date, ...）</p>
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
            <button
              onClick={confirmImport}
              className="px-4 py-1.5 bg-blue-600 text-surface rounded-lg text-small hover:bg-blue-700"
            >
              確認匯入 {parsedTrades.length} 筆
            </button>
            <button
              onClick={cancel}
              className="px-3 py-1.5 bg-elevated border border-base rounded-lg text-small text-dim hover:text-main"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
