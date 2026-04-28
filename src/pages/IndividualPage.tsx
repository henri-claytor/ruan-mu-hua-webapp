import { useRef, useState } from 'react'
import StockSelector from '../components/StockSelector'
import ResultCard from '../components/ResultCard'
import QuadrantBadge from '../components/QuadrantBadge'
import VarHistogram from '../components/charts/VarHistogram'
import FanChart from '../components/charts/FanChart'
import HurstLineChart from '../components/charts/HurstLineChart'
import { calcEV, type EVResult } from '../lib/ev'
import { calcVaR, type VaRResult } from '../lib/var'
import { runMonteCarlo, type MonteCarloResult } from '../lib/montecarlo'
import { calcHurst, type HurstResult } from '../lib/hurst'
import { fetchMonthlyReturns, fetchDailyReturns } from '../lib/api'
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

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-elevated rounded-xl h-16 animate-pulse" />
  )
}

function SkeletonSection({ title }: { title: string }) {
  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-3">
      <div className="h-5 w-32 bg-elevated rounded animate-pulse" />
      <p className="text-caption text-faint">{title}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}

// ── Action buttons ─────────────────────────────────────────────────────────────

function CopyButton({ onCopy, disabled }: { onCopy: () => Promise<void>; disabled: boolean }) {
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

// ── Hurst block ───────────────────────────────────────────────────────────────

function HurstBlock({
  result,
  freqLabel,
}: {
  result: HurstResult
  freqLabel: string
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-surface rounded-2xl border border-base overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-elevated transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <h2 className="text-h2 font-semibold text-main text-left">Hurst 指數分析</h2>
          {freqLabel && (
            <p className="text-caption text-faint text-left mt-0.5">使用{freqLabel}</p>
          )}
        </div>
        <span className="text-faint text-small">{open ? '▼ 收折' : '▶ 展開'}</span>
      </button>
      {open && (
        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ResultCard
              title="Hurst H 值"
              value={result.h.toFixed(4)}
              color={result.h > 0.6 ? 'green' : result.h < 0.4 ? 'red' : 'blue'}
              large
            />
            <ResultCard title="解讀" value={result.interpretation} />
            <ResultCard title="R（範圍）" value={result.r.toFixed(6)} />
            <ResultCard title="S（標準差）" value={result.s.toFixed(6)} />
          </div>

          <HurstLineChart cumDeviations={result.cumDeviations} subtitle={freqLabel} />

          <div className="border-t border-base pt-4">
            <h3 className="text-label font-semibold text-dim uppercase tracking-wider mb-3">
              計算步驟
            </h3>
            <div className="bg-elevated rounded-lg p-4 text-small num space-y-1 text-main">
              <p>μ = {result.mu.toFixed(6)}</p>
              <p>Xₜ = Σ(rᵢ − μ)，共 {result.n} 筆</p>
              <p>R = MAX(Xₜ) − MIN(Xₜ) = {result.r.toFixed(6)}</p>
              <p>S = 標準差 = {result.s.toFixed(6)}</p>
              <p>H = log(R/S) / log(n) = log({(result.r / result.s).toFixed(4)}) / log({result.n})</p>
              <p className="font-bold text-blue-700">H = {result.h.toFixed(4)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface Results {
  stockCode: string
  stockName: string
  freqLabel: string
  ev: EVResult
  var: VaRResult
  mc: MonteCarloResult
  hurst: HurstResult | null
}

export default function IndividualPage() {
  const individualStockCode = useAppStore((s) => s.individualStockCode)
  const setIndividualStockCode = useAppStore((s) => s.setIndividualStockCode)
  const clearIndividual = useAppStore((s) => s.clearIndividual)
  const stockList = useAppStore((s) => s.stockList)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Results | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  async function handleSelect(code: string, name: string) {
    setIndividualStockCode(code)
    setError(null)
    setLoading(true)
    setResults(null)

    try {
      const [monthly, daily] = await Promise.all([
        fetchMonthlyReturns(code),
        fetchDailyReturns(code).catch(() => [] as number[]),
      ])

      if (monthly.length < 60) {
        const stockName = name || stockList.find((s) => s.code === code)?.name || code
        setError(`${stockName} 月報酬數據不足（${monthly.length} 筆），無法計算`)
        return
      }

      // Dual-frequency: use daily for VaR + Hurst if >= 252 records
      const useDaily = daily.length >= 252
      const returnsForRisk = useDaily ? daily : monthly
      const freqLabel = useDaily
        ? `日報酬 ${daily.length} 筆`
        : `月報酬 ${monthly.length} 筆（日頻數據不足）`

      const stockName = name || stockList.find((s) => s.code === code)?.name || code

      setResults({
        stockCode: code,
        stockName,
        freqLabel,
        ev: calcEV(monthly),
        var: calcVaR(returnsForRisk),
        mc: runMonteCarlo(monthly, 100),
        hurst: calcHurst(returnsForRisk),
      })
    } catch (err) {
      setError(`載入失敗：${String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    clearIndividual()
    setResults(null)
    setError(null)
  }

  async function handleCopy() {
    if (!results) return
    const text = buildIndividualSummary({
      ev: results.ev,
      var: results.var,
      mc: results.mc,
    })
    await copyTextToClipboard(text)
  }

  async function handleDownload() {
    if (!resultRef.current) return
    await downloadPng(resultRef.current, buildPngFilename('individual'))
  }

  const hasResult = !!results

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 font-bold text-main">
            個股期望值計算
            {results && (
              <span className="ml-2 text-h2 font-normal text-dim">
                {results.stockCode} {results.stockName}
              </span>
            )}
          </h1>
          <p className="text-small text-dim mt-0.5">
            選取股票後自動載入月報酬與日報酬，計算 EV、VaR、蒙地卡羅與 Hurst
          </p>
        </div>
        <button
          onClick={handleClear}
          className="text-small text-red-500 hover:text-red-700 underline shrink-0"
        >
          清除資料
        </button>
      </div>

      {/* ── Stock Selector ── */}
      <div className="bg-surface rounded-2xl border border-base p-4">
        <label className="block text-small font-medium text-dim mb-2">選取股票</label>
        <StockSelector value={individualStockCode} onChange={handleSelect} />
      </div>

      {/* ── Empty state ── */}
      {!loading && !hasResult && !error && (
        <div className="border-2 border-dashed border-base rounded-2xl p-8 text-center bg-elevated">
          <p className="text-dim text-body">請選取股票以開始分析</p>
          <p className="text-faint text-small mt-1">系統將自動取得月報酬與日報酬數據</p>
        </div>
      )}

      {/* ── Error state ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 text-body">{error}</p>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loading && (
        <div className="space-y-4">
          <SkeletonSection title="正在載入 EV 數據..." />
          <SkeletonSection title="正在載入 VaR 數據..." />
          <SkeletonSection title="正在載入蒙地卡羅數據..." />
        </div>
      )}

      {/* ── Results ── */}
      {hasResult && results && (
        <div ref={resultRef} className="space-y-4">
          {/* Action buttons */}
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

          {/* EV block */}
          <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-h2 font-semibold text-main">計算結果</h2>
              <QuadrantBadge quadrant={results.ev.quadrant} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ResultCard title="期望值 EV" value={fmt(results.ev.ev)} color={results.ev.ev >= 0 ? 'green' : 'red'} large />
              <ResultCard title="實際賠率" value={results.ev.actualOdds.toFixed(2)} subtitle="Avg Gain ÷ Avg Loss" color="blue" />
              <ResultCard title="損益平衡賠率" value={results.ev.breakEvenOdds.toFixed(2)} subtitle="敗率 ÷ 勝率" />
              <ResultCard
                title="賠率優勢"
                value={results.ev.actualOdds > results.ev.breakEvenOdds ? '有優勢' : '無優勢'}
                color={results.ev.actualOdds > results.ev.breakEvenOdds ? 'green' : 'red'}
              />
            </div>
            <div className="border-t border-base pt-4">
              <h3 className="text-label font-semibold text-dim uppercase tracking-wider mb-3">基礎統計</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ResultCard title="勝率" value={fmt(results.ev.winRate)} color="green" />
                <ResultCard title="敗率" value={fmt(results.ev.lossRate)} color="red" />
                <ResultCard title="Avg Gain" value={fmt(results.ev.avgGain)} color="green" />
                <ResultCard title="Avg Loss" value={fmt(results.ev.avgLoss)} color="red" />
              </div>
            </div>
            <div className="border-t border-base pt-4">
              <h3 className="text-label font-semibold text-dim uppercase tracking-wider mb-3">計算步驟</h3>
              <div className="bg-elevated rounded-lg p-4 text-small num space-y-1 text-main">
                <p>EV = 勝率 × Avg Gain − 敗率 × Avg Loss</p>
                <p>
                  EV = {fmt(results.ev.winRate)} × {fmt(results.ev.avgGain)} − {fmt(results.ev.lossRate)} × {fmt(results.ev.avgLoss)}
                </p>
                <p className={`font-bold ${results.ev.ev >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  EV = {fmt(results.ev.ev)}
                </p>
              </div>
            </div>
          </div>

          {/* VaR block */}
          <VarBlock varResult={results.var} freqLabel={results.freqLabel} />

          {/* Monte Carlo block */}
          <McBlock mcResult={results.mc} varResult={results.var} />

          {/* Hurst block */}
          {results.hurst && (
            <HurstBlock result={results.hurst} freqLabel={results.freqLabel} />
          )}
        </div>
      )}
    </div>
  )
}

// ── Sub-blocks ────────────────────────────────────────────────────────────────

function VarBlock({ varResult, freqLabel }: { varResult: VaRResult; freqLabel: string }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-surface rounded-2xl border border-base overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-elevated transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <h2 className="text-h2 font-semibold text-main text-left">風險值（VaR）</h2>
          {freqLabel && (
            <p className="text-caption text-faint text-left mt-0.5">使用{freqLabel}</p>
          )}
        </div>
        <span className="text-faint text-small">{open ? '▼ 收折' : '▶ 展開'}</span>
      </button>
      {open && (
        <div className="px-6 pb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="grid grid-cols-2 gap-3 flex-shrink-0">
              <ResultCard
                title="VaR 95%"
                value={fmt(varResult.var95)}
                subtitle={`有 5% 機率虧損超過 ${fmt(Math.abs(varResult.var95))}`}
                color="yellow"
              />
              <ResultCard
                title="VaR 99%"
                value={fmt(varResult.var99)}
                subtitle={`有 1% 機率虧損超過 ${fmt(Math.abs(varResult.var99))}`}
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
  )
}

function McBlock({ mcResult, varResult }: { mcResult: MonteCarloResult; varResult: VaRResult }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-surface rounded-2xl border border-base overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-elevated transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <h2 className="text-h2 font-semibold text-main">蒙地卡羅模擬（初始 100 萬）</h2>
        <span className="text-faint text-small">{open ? '▼ 收折' : '▶ 展開'}</span>
      </button>
      {open && (
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
                    <span className="num text-main">{(data.p95 / 10000).toFixed(1)} 萬</span>
                  </div>
                  <div className="flex justify-between text-small">
                    <span className="text-blue-600 font-medium">P50</span>
                    <span className="num text-main">{(data.p50 / 10000).toFixed(1)} 萬</span>
                  </div>
                  <div className="flex justify-between text-small">
                    <span className="text-red-600 font-medium">P5</span>
                    <span className="num text-main">{(data.p5 / 10000).toFixed(1)} 萬</span>
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
              <ResultCard title="月報酬筆數" value={`${varResult.sorted.length} 筆`} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
