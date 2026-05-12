import { useState, useRef, useEffect } from 'react'
import type { Trade, PortfolioPerformance, StockStats } from '../../lib/trade'
import type { Diagnosis } from '../../lib/diagnosis'
import { formatTradesCSV } from '../../lib/csv'

interface Props {
  trades: Trade[]
  performance: PortfolioPerformance | null
  stocks: StockStats[]
  diagnoses: Diagnosis[]
  /** PDF 截圖區塊的 element id 列表 */
  pdfSectionIds: string[]
}

const PDF_SECTION_LABEL: Record<string, string> = {}  // 不需要顯示，傳 id 即可

const today = () => new Date().toISOString().slice(0, 10)

export default function ExportMenu({ trades, performance, stocks, diagnoses, pdfSectionIds }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // 點擊外部關閉
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function clearError() {
    setError(null)
  }

  async function exportCsv() {
    clearError()
    setOpen(false)
    try {
      const csv = formatTradesCSV(trades)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trades-${today()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(`CSV 匯出失敗：${String(err)}`)
    }
  }

  async function exportPdf() {
    clearError()
    setOpen(false)
    setBusy(true)
    try {
      const { exportPerformancePdf } = await import('../../lib/exportPdf')
      await exportPerformancePdf(
        pdfSectionIds.map((id) => ({ elementId: id, title: PDF_SECTION_LABEL[id] })),
        `performance-report-${today()}.pdf`,
      )
    } catch (err) {
      setError(`PDF 匯出失敗：${String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  async function exportXlsx() {
    clearError()
    setOpen(false)
    if (!performance) {
      setError('Excel 匯出失敗：尚無績效資料')
      return
    }
    setBusy(true)
    try {
      const { exportPerformanceXlsx } = await import('../../lib/exportXlsx')
      await exportPerformanceXlsx(
        performance,
        stocks,
        trades,
        diagnoses,
        `performance-report-${today()}.xlsx`,
      )
    } catch (err) {
      setError(`Excel 匯出失敗：${String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  const disabled = trades.length === 0 || busy

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="px-3 py-1.5 text-small bg-surface border border-base rounded-lg text-dim hover:text-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {busy ? '處理中…' : '⬇ 匯出 ▾'}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-surface border border-base rounded-lg shadow-lg z-50 overflow-hidden">
          <button
            onClick={exportPdf}
            className="w-full text-left px-4 py-2.5 text-small text-main hover:bg-elevated"
          >
            📄 PDF 報告（含圖表）
          </button>
          <button
            onClick={exportXlsx}
            className="w-full text-left px-4 py-2.5 text-small text-main hover:bg-elevated border-t border-base"
          >
            📊 Excel 工作簿（4 分頁）
          </button>
          <button
            onClick={exportCsv}
            className="w-full text-left px-4 py-2.5 text-small text-main hover:bg-elevated border-t border-base"
          >
            📑 CSV 交易明細
          </button>
        </div>
      )}

      {error && (
        <div className="absolute right-0 mt-12 w-64 bg-red-50 border border-red-200 rounded-lg p-3 text-caption text-red-700 z-40">
          {error}
          <button onClick={clearError} className="ml-2 underline">關閉</button>
        </div>
      )}
    </div>
  )
}
