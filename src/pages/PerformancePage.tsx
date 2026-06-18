import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTradeStore } from '../store/useTradeStore'
import { calcPortfolioPerformance, calcAllStockStats } from '../lib/trade'
import { diagnose } from '../lib/diagnosis'
import { buildRecommendations } from '../lib/recommendations'
import PortfolioPerformanceBlock from '../components/trade/PortfolioPerformanceBlock'
import DiagnosisPanel from '../components/trade/DiagnosisPanel'
import RecommendationPanel from '../components/trade/RecommendationPanel'
import StockQuadrantMatrix from '../components/trade/StockQuadrantMatrix'
import PerformanceCharts from '../components/trade/PerformanceCharts'
import RawTradeTable from '../components/trade/RawTradeTable'
import TradeInputTable from '../components/trade/TradeInputTable'
import TradeFileUpload from '../components/trade/TradeFileUpload'
import ExportMenu from '../components/trade/ExportMenu'
import ComplianceFooter from '../components/ComplianceFooter'
import ReportHeaderBlock from '../components/trade/ReportHeaderBlock'
import QuadrantLegendBlock from '../components/trade/QuadrantLegendBlock'

type InputMode = 'manual' | 'csv'

export default function PerformancePage() {
  const trades = useTradeStore((s) => s.trades)
  const addTrade = useTradeStore((s) => s.addTrade)
  const updateTrade = useTradeStore((s) => s.updateTrade)
  const removeTrade = useTradeStore((s) => s.removeTrade)
  const importTrades = useTradeStore((s) => s.importTrades)
  const clearAll = useTradeStore((s) => s.clearAll)

  const hasTrades = trades.length > 0
  const [inputOpen, setInputOpen] = useState(!hasTrades)
  const [mode, setMode] = useState<InputMode>('manual')

  const performance = useMemo(() => calcPortfolioPerformance(trades), [trades])
  const stockStats = useMemo(() => calcAllStockStats(trades), [trades])
  const diagnoses = useMemo(() => diagnose(trades, performance, stockStats), [trades, performance, stockStats])
  const recommendations = useMemo(
    () => buildRecommendations(diagnoses, stockStats, performance),
    [diagnoses, stockStats, performance],
  )

  // ?stock= 篩選矩陣表 + 自動捲動
  const [searchParams] = useSearchParams()
  const stockFilterFromUrl = searchParams.get('stock') ?? undefined

  useEffect(() => {
    if (stockFilterFromUrl && trades.length > 0) {
      const el = document.getElementById('stock-matrix-anchor')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [stockFilterFromUrl, trades.length])

  function handleClearAll() {
    if (
      confirm(
        `確定要清除全部 ${trades.length} 筆交易資料嗎？此動作無法復原。\n建議先用「匯出 CSV」備份。`,
      )
    ) {
      clearAll()
    }
  }

  const PDF_SECTION_IDS = [
    'performance-banner',
    'performance-recommendations',
    'performance-diagnosis',
    'performance-dashboard',
    'performance-matrix',
    'performance-charts',
    'performance-trades',
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-serif text-h1 font-bold text-main tracking-wide">績效分析</h1>
        <p className="text-small text-dim mt-0.5">
          分析你過去交易的勝率、賠率、獲利因子，找出打法品質與資金管理問題
        </p>
      </div>

      {/* 隱私 banner */}
      <div id="performance-banner" className="bg-elevated border border-base rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <p className="text-small text-dim">
          💾 交易資料僅儲存於本機瀏覽器，不會上傳雲端
          {hasTrades && <span className="text-faint ml-2">· 共 {trades.length} 筆</span>}
        </p>
        <div className="flex gap-2 items-center">
          {hasTrades && (
            <ExportMenu
              trades={trades}
              performance={performance}
              stocks={stockStats}
              diagnoses={diagnoses}
              pdfSectionIds={PDF_SECTION_IDS}
            />
          )}
          {hasTrades && (
            <button
              onClick={handleClearAll}
              className="text-small text-red-500 hover:text-red-700 underline"
            >
              清除全部
            </button>
          )}
        </div>
      </div>

      {/* 資料輸入區（可摺疊） */}
      <div className="bg-surface rounded-2xl border border-base overflow-hidden">
        <button
          type="button"
          onClick={() => setInputOpen((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-elevated transition-colors"
        >
          <div className="text-left">
            <h2 className="font-serif text-h2 font-bold text-main tracking-wide">資料輸入</h2>
            <p className="text-caption text-faint mt-0.5">
              {hasTrades ? `已輸入 ${trades.length} 筆，點擊以新增更多` : '手動輸入或上傳 CSV'}
            </p>
          </div>
          <span className="text-faint text-small">{inputOpen ? '▼ 收折資料輸入' : '▶ 展開資料輸入'}</span>
        </button>

        {inputOpen && (
          <div className="px-6 pb-6 space-y-4">
            {/* Tab 切換 */}
            <div className="flex border-b border-base">
              <button
                onClick={() => setMode('manual')}
                className={`px-4 py-2 text-small font-medium transition-colors ${
                  mode === 'manual'
                    ? 'border-b-2 border-blue-500 text-blue-700'
                    : 'text-dim hover:text-main'
                }`}
              >
                手動輸入
              </button>
              <button
                onClick={() => setMode('csv')}
                className={`px-4 py-2 text-small font-medium transition-colors ${
                  mode === 'csv'
                    ? 'border-b-2 border-blue-500 text-blue-700'
                    : 'text-dim hover:text-main'
                }`}
              >
                CSV 上傳
              </button>
            </div>

            {mode === 'manual' && <TradeInputTable onAdd={addTrade} />}
            {mode === 'csv' && <TradeFileUpload onImport={importTrades} />}
          </div>
        )}
      </div>

      {/* 空態 */}
      {!hasTrades && (
        <div className="border-2 border-dashed border-base rounded-2xl p-8 text-center bg-elevated">
          <p className="text-dim text-body">尚無交易資料</p>
          <p className="text-faint text-small mt-1">
            使用上方資料輸入區新增第一筆交易，或下載
            <a href="/example-trades.csv" download className="text-blue-600 hover:underline mx-1">
              範例 CSV
            </a>
            參考格式
          </p>
        </div>
      )}

      {/* 報告標頭：期間 + 分析日期 */}
      {hasTrades && <ReportHeaderBlock trades={trades} />}

      {/* 一、整體投資組合概覽：8 KPI grid + 整體績效評估 narrative */}
      {performance && (
        <div id="performance-dashboard" className="space-y-4">
          <PortfolioPerformanceBlock performance={performance} />
          <DiagnosisPanel diagnoses={diagnoses} />
        </div>
      )}

      {/* 二、個股賠率 vs 獲利因子分析：四象限定義 + 個股表 */}
      {stockStats.length > 0 && (
        <div id="performance-matrix" className="space-y-4">
          <QuadrantLegendBlock />
          <StockQuadrantMatrix
            stocks={stockStats}
            filterStockId={stockFilterFromUrl}
            anchorId="stock-matrix-anchor"
            diagnoses={diagnoses}
          />
        </div>
      )}

      {/* 三、重點觀察 */}
      {hasTrades && recommendations.length > 0 && (
        <RecommendationPanel recommendations={recommendations} />
      )}

      {/* 績效視覺化 */}
      {hasTrades && (
        <div id="performance-charts">
          <PerformanceCharts trades={trades} stocks={stockStats} />
        </div>
      )}

      {/* 原始交易表格 */}
      {hasTrades && (
        <div id="performance-trades">
          <RawTradeTable trades={trades} onUpdate={updateTrade} onRemove={removeTrade} />
        </div>
      )}

      {hasTrades && <ComplianceFooter />}
    </div>
  )
}
