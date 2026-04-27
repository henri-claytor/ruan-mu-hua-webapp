import { useRef, useState } from 'react'
import DataInput from '../components/DataInput'
import ResultCard from '../components/ResultCard'
import QuadrantBadge from '../components/QuadrantBadge'
import VarHistogram from '../components/charts/VarHistogram'
import FanChart from '../components/charts/FanChart'
import { calcEV, type EVResult } from '../lib/ev'
import { calcVaR, type VaRResult } from '../lib/var'
import { runMonteCarlo, type MonteCarloResult } from '../lib/montecarlo'
import { useAppStore } from '../store/useAppStore'
import {
  buildIndividualSummary,
  copyTextToClipboard,
  downloadPng,
  buildPngFilename,
} from '../utils/export'

function fmt(n: number, digits = 2): string {
  return (n * 100).toFixed(digits) + '%'
}
function fmtWan(n: number): string {
  return (n / 10000).toFixed(1) + ' 萬'
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-small text-red-500 hover:text-red-700 underline"
    >
      清除資料
    </button>
  )
}

function CopyButton({
  onCopy,
  disabled,
}: {
  onCopy: () => Promise<void>
  disabled: boolean
}) {
  const [copied, setCopied] = useState(false)
  async function handle() {
    await onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handle}
      disabled={disabled}
      className="px-3 py-1.5 text-small bg-elevated border border-base rounded-lg text-dim
                 hover:text-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {copied ? '已複製 ✓' : '複製摘要'}
    </button>
  )
}

export default function IndividualPage() {
  const rawText = useAppStore((s) => s.individualRawText)
  const setRawText = useAppStore((s) => s.setIndividualRawText)
  const clearIndividual = useAppStore((s) => s.clearIndividual)

  const [evResult, setEvResult] = useState<EVResult | null>(null)
  const [varResult, setVarResult] = useState<VaRResult | null>(null)
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null)
  const [varOpen, setVarOpen] = useState(true)
  const [mcOpen, setMcOpen] = useState(true)
  const resultRef = useRef<HTMLDivElement>(null)

  function handleData(text: string, returns: number[]) {
    setRawText(text)
    if (returns.length >= 10) {
      setEvResult(calcEV(returns))
      setVarResult(calcVaR(returns))
      setMcResult(runMonteCarlo(returns, 100))
    } else {
      setEvResult(null)
      setVarResult(null)
      setMcResult(null)
    }
  }

  function handleClear() {
    clearIndividual()
    setEvResult(null)
    setVarResult(null)
    setMcResult(null)
  }

  async function handleCopy() {
    if (!evResult) return
    const text = buildIndividualSummary({
      ev: evResult,
      var: varResult ?? undefined,
      mc: mcResult ?? undefined,
    })
    await copyTextToClipboard(text)
  }

  async function handleDownload() {
    if (!resultRef.current) return
    await downloadPng(resultRef.current, buildPngFilename('individual'))
  }

  const hasResult = !!evResult

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 font-bold text-main">個股期望值計算</h1>
          <p className="text-small text-dim mt-0.5">輸入月報酬率，計算 EV、賠率、VaR 與蒙地卡羅模擬</p>
        </div>
        <ClearButton onClick={handleClear} />
      </div>

      {/* ── 空態 ── */}
      {!hasResult && rawText.trim() === '' && (
        <div className="border-2 border-dashed border-base rounded-2xl p-8 text-center bg-elevated">
          <p className="text-dim text-body">請在下方輸入月報酬率以開始計算</p>
          <p className="text-faint text-small mt-1">支援小數、百分比、CSV 或 Excel 貼上</p>
        </div>
      )}

      {/* ── 結果區（帶 ref 供 PNG 匯出）── */}
      {hasResult && evResult && (
        <div ref={resultRef} className="space-y-4">
          {/* 操作按鈕列 */}
          <div className="flex gap-2 justify-end">
            <CopyButton onCopy={handleCopy} disabled={!hasResult} />
            <button
              onClick={handleDownload}
              disabled={!hasResult}
              className="px-3 py-1.5 text-small bg-elevated border border-base rounded-lg text-dim
                         hover:text-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              下載 PNG
            </button>
          </div>

          {/* EV 結果 */}
          <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-h2 font-semibold text-main">計算結果</h2>
              <QuadrantBadge quadrant={evResult.quadrant} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ResultCard title="期望值 EV" value={fmt(evResult.ev)} color={evResult.ev >= 0 ? 'green' : 'red'} large />
              <ResultCard title="實際賠率" value={evResult.actualOdds.toFixed(2)} subtitle="Avg Gain ÷ Avg Loss" color="blue" />
              <ResultCard title="損益平衡賠率" value={evResult.breakEvenOdds.toFixed(2)} subtitle="敗率 ÷ 勝率" />
              <ResultCard
                title="賠率優勢"
                value={evResult.actualOdds > evResult.breakEvenOdds ? '有優勢' : '無優勢'}
                color={evResult.actualOdds > evResult.breakEvenOdds ? 'green' : 'red'}
              />
            </div>
            <div className="border-t border-base pt-4">
              <h3 className="text-label font-semibold text-dim uppercase tracking-wider mb-3">基礎統計</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ResultCard title="勝率" value={fmt(evResult.winRate)} color="green" />
                <ResultCard title="敗率" value={fmt(evResult.lossRate)} color="red" />
                <ResultCard title="Avg Gain" value={fmt(evResult.avgGain)} color="green" />
                <ResultCard title="Avg Loss" value={fmt(evResult.avgLoss)} color="red" />
              </div>
            </div>
            <div className="border-t border-base pt-4">
              <h3 className="text-label font-semibold text-dim uppercase tracking-wider mb-3">計算步驟</h3>
              <div className="bg-elevated rounded-lg p-4 text-small font-mono space-y-1 text-main">
                <p>EV = 勝率 × Avg Gain − 敗率 × Avg Loss</p>
                <p>EV = {fmt(evResult.winRate)} × {fmt(evResult.avgGain)} − {fmt(evResult.lossRate)} × {fmt(evResult.avgLoss)}</p>
                <p className={`font-bold ${evResult.ev >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  EV = {fmt(evResult.ev)}
                </p>
              </div>
            </div>
          </div>

          {/* VaR 區塊（可折疊）*/}
          {varResult && (
            <div className="bg-surface rounded-2xl border border-base overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-elevated transition-colors"
                onClick={() => setVarOpen((v) => !v)}
              >
                <h2 className="text-h2 font-semibold text-main">風險值（VaR）</h2>
                <span className="text-faint text-small">{varOpen ? '▼ 收折' : '▶ 展開'}</span>
              </button>
              {varOpen && (
                <div className="px-6 pb-6 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                      <ResultCard
                        title="VaR 95%"
                        value={fmt(varResult.var95)}
                        subtitle={`有 5% 機率單月虧損超過 ${fmt(Math.abs(varResult.var95))}`}
                        color="yellow"
                      />
                      <ResultCard
                        title="VaR 99%"
                        value={fmt(varResult.var99)}
                        subtitle={`有 1% 機率單月虧損超過 ${fmt(Math.abs(varResult.var99))}`}
                        color="red"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <VarHistogram returns={varResult.sorted} var95={varResult.var95} var99={varResult.var99} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 蒙地卡羅區塊（可折疊）*/}
          {mcResult && (
            <div className="bg-surface rounded-2xl border border-base overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-elevated transition-colors"
                onClick={() => setMcOpen((v) => !v)}
              >
                <h2 className="text-h2 font-semibold text-main">蒙地卡羅模擬（初始 100 萬）</h2>
                <span className="text-faint text-small">{mcOpen ? '▼ 收折' : '▶ 展開'}</span>
              </button>
              {mcOpen && (
                <div className="px-6 pb-6 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { label: '1 年', data: mcResult.oneYear },
                      { label: '3 年', data: mcResult.threeYear },
                      { label: '5 年', data: mcResult.fiveYear },
                    ] as const).map(({ label, data }) => (
                      <div key={label} className="bg-elevated rounded-xl p-4">
                        <p className="text-small font-semibold text-dim mb-2">{label}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-small">
                            <span className="text-green-700 font-medium">P95</span>
                            <span className="text-main">{fmtWan(data.p95)}</span>
                          </div>
                          <div className="flex justify-between text-small">
                            <span className="text-blue-600 font-medium">P50</span>
                            <span className="text-main">{fmtWan(data.p50)}</span>
                          </div>
                          <div className="flex justify-between text-small">
                            <span className="text-red-600 font-medium">P5</span>
                            <span className="text-main">{fmtWan(data.p5)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <FanChart paths={mcResult.allPathsMonthly} />
                  <div className="border-t border-base pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <ResultCard title="μ（月均報酬）" value={fmt(mcResult.mu, 4)} />
                      <ResultCard title="σ（月報酬標準差）" value={fmt(mcResult.sigma, 4)} />
                      <ResultCard title="模擬路徑數" value="100 條" />
                      <ResultCard title="月報酬筆數" value={`${varResult?.sorted.length ?? 0} 筆`} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 輸入區塊 ── */}
      <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
        <h2 className="text-h2 font-semibold text-main">輸入月報酬率</h2>
        <DataInput
          label="月報酬率序列"
          value={rawText}
          onChange={handleData}
          minCount={10}
        />
      </div>
    </div>
  )
}
