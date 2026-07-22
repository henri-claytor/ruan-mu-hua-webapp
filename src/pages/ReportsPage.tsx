import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import GoogleLoginButton from '../components/GoogleLoginButton'
import { Icon } from '../components/icons'

interface ReportSummary {
  id: string
  title: string
  date: string
  kind: 'image' | 'pdf'
}

export default function ReportsPage() {
  const { loggedIn, checked } = useAuthStore()
  const [reports, setReports] = useState<ReportSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<ReportSummary | null>(null)

  async function loadReports() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/reports', { credentials: 'include' })
      if (!res.ok) throw new Error(`載入失敗（${res.status}）`)
      const data = await res.json()
      setReports(data.reports ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (loggedIn) void loadReports()
  }, [loggedIn])

  // Esc 關閉檢視器
  useEffect(() => {
    if (!viewing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewing(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewing])

  return (
    <div>
      <div className="mb-8 u1">
        <h1 className="font-serif text-[28px] font-black text-main tracking-[3px]">報告分享</h1>
        <p className="mt-2 text-[13px] text-dim leading-relaxed">
          市場資訊交流 非投資建議
        </p>
      </div>

      {!checked ? null : !loggedIn ? (
        <div className="bg-surface border border-base rounded-lg px-7 py-10 text-center">
          <Icon.FileText size={32} className="text-[#9a7a2e] mx-auto mb-4" />
          <p className="text-small text-main2 mb-5">登入後才能查看報告分享</p>
          <div className="flex justify-center">
            <GoogleLoginButton />
          </div>
        </div>
      ) : loading ? (
        <p className="text-small text-dim">載入中…</p>
      ) : error ? (
        <p className="text-small text-[#b0402f]">{error}</p>
      ) : reports.length === 0 ? (
        <p className="text-small text-dim">目前尚無報告</p>
      ) : (
        <div className="bg-surface border border-base rounded-lg overflow-hidden">
          <div className="flex items-center gap-5 px-5 py-2.5 border-b border-base bg-card2 text-caption font-semibold text-dim tracking-wide">
            <span className="w-[88px] shrink-0">日期</span>
            <span>標題</span>
          </div>
          <div className="divide-y divide-[rgba(154,122,46,0.1)]">
            {reports.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => setViewing(report)}
                className="group w-full text-left flex items-center gap-5 px-5 py-3.5 hover:bg-[rgba(201,168,76,0.06)] transition-colors"
              >
                <time className="text-small text-dim tabular-nums whitespace-nowrap w-[88px] shrink-0">
                  {report.date}
                </time>
                <span className="text-small text-[#9a7a2e] group-hover:text-[#c9a84c] group-hover:underline transition-colors">
                  {report.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {viewing && <ReportViewer report={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

function ReportViewer({ report, onClose }: { report: ReportSummary; onClose: () => void }) {
  // #toolbar=0&navpanes=0：隱藏瀏覽器 PDF 檢視器的工具列（下載/列印/存檔按鈕），
  // 連帶隱藏 PDF 內建文件標題（避免顯示範本佔位字）。非資安措施，僅移除明顯的下載入口。
  const src = `/api/reports/${encodeURIComponent(report.id)}/view#toolbar=0&navpanes=0`

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between px-5 py-3 text-white shrink-0">
        <span className="text-small font-medium truncate">{report.title}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-4 text-[13px] px-3 py-1 rounded border border-white/40 hover:bg-white/10 transition-colors shrink-0"
        >
          關閉
        </button>
      </div>
      <div className="flex-1 min-h-0 px-3 pb-3" onClick={(e) => e.stopPropagation()}>
        {report.kind === 'image' ? (
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            <img
              src={src}
              alt={report.title}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
          </div>
        ) : (
          <iframe src={src} title={report.title} className="w-full h-full rounded bg-white" />
        )}
      </div>
    </div>
  )
}
