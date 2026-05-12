import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import StockSelector from '../components/StockSelector'
import ResultCard from '../components/ResultCard'
import VarHistogram from '../components/charts/VarHistogram'
import FanChart from '../components/charts/FanChart'
import MultiScaleHurstBlock from '../components/charts/MultiScaleHurstBlock'
import MultiScaleEVBlock from '../components/charts/MultiScaleEVBlock'
import { calcMultiScaleEV, type MultiScaleEVResult } from '../lib/ev'
import { calcVaR, type VaRResult } from '../lib/var'
import { runMonteCarlo, type MonteCarloResult } from '../lib/montecarlo'
import { calcMultiScaleHurst, type MultiScaleHurstResult } from '../lib/hurst'
import { fetchMonthlyReturns, fetchDailyReturns } from '../lib/api'
import { useAppStore } from '../store/useAppStore'
import ActionGuide, { buildIndividualGuide, classifyVarLevel, type VarLevel } from '../components/ActionGuide'
import MyTradeHistoryBlock from '../components/trade/MyTradeHistoryBlock'
import { fmtPct, colorByReturn } from '../utils/format'
import {
  buildIndividualSummary,
  copyTextToClipboard,
  downloadPng,
  buildPngFilename,
} from '../utils/export'

function fmtWan(n: number): string {
  return `${(n / 10000).toFixed(1)} 萬`
}

const VAR_LEVEL_LABEL: Record<VarLevel, string> = {
  low: '低風險（VaR95 < 5%）',
  mid: '中等風險（VaR95 5%–10%）',
  high: '高風險（VaR95 > 10%）',
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return <div className="bg-elevated rounded-xl h-16 animate-pulse" />
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

// ── Section block container ───────────────────────────────────────────────────

function SectionBlock({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
      <div>
        <h2 className="text-h2 font-semibold text-main">{title}</h2>
        {subtitle && <p className="text-caption text-faint mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface Results {
  stockCode: string
  stockName: string
  freqLabel: string
  monthlyCount: number
  dailyCount: number
  evMulti: MultiScaleEVResult | null
  var: VaRResult
  mc: MonteCarloResult
  hurst: MultiScaleHurstResult | null
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
  const [searchParams] = useSearchParams()

  // 深度連結：URL ?code=XXXX 自動載入該股票
  useEffect(() => {
    const code = searchParams.get('code')
    if (code && code !== individualStockCode) {
      handleSelect(code, '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

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
        monthlyCount: monthly.length,
        dailyCount: daily.length,
        evMulti: calcMultiScaleEV(monthly, daily),
        var: calcVaR(returnsForRisk),
        mc: runMonteCarlo(monthly, 100),
        hurst: calcMultiScaleHurst(daily),
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
    if (!results || !results.evMulti) return
    const text = buildIndividualSummary({
      ev: results.evMulti.long.ev,
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
            選取股票後自動載入月報酬與日報酬，計算 EV、VaR、Hurst 與蒙地卡羅模擬
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
          <SkeletonSection title="正在載入 Hurst 數據..." />
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

          {/* 1. 期望報酬與賠率優勢（EV，多尺度年化） */}
          {results.evMulti ? (
            <MultiScaleEVBlock
              result={results.evMulti}
              monthlyCount={results.monthlyCount}
              dailyCount={results.dailyCount}
            />
          ) : (
            <div className="bg-elevated border border-base rounded-2xl px-6 py-4">
              <p className="text-small text-dim">
                <span className="font-semibold text-main">期望報酬與賠率優勢未顯示：</span>
                月報酬資料不足 60 筆（目前 {results.monthlyCount} 筆），需要約 5 年的月報酬資料才能使用多尺度 EV。
              </p>
            </div>
          )}

          {/* 2. 下行風險：最壞情境虧損（VaR） */}
          <VarBlock varResult={results.var} freqLabel={results.freqLabel} />

          {/* 3. 趨勢延續性偵測（Hurst） */}
          {results.hurst ? (
            <MultiScaleHurstBlock result={results.hurst} />
          ) : (
            <div className="bg-elevated border border-base rounded-2xl px-6 py-4">
              <p className="text-small text-dim">
                <span className="font-semibold text-main">趨勢延續性偵測未顯示：</span>
                日報酬資料不足 240 筆（目前 {results.dailyCount} 筆），需要約 1 年的交易紀錄才能計算多尺度 Hurst。
              </p>
            </div>
          )}

          {/* 4. 未來資產淨值模擬（蒙地卡羅） */}
          <McBlock mcResult={results.mc} monthlyCount={results.monthlyCount} />

          {/* 5. 建議行動參考 */}
          <ActionGuide
            items={buildIndividualGuide({
              ev: results.evMulti?.long.ev.ev ?? 0,
              evQuadrant: results.evMulti?.long.ev.quadrant ?? '低賠率負期望值（避免）',
              varLevel: classifyVarLevel(results.var.var95),
              hurstH: results.hurst?.short.h ?? null,
              hurstDivergence: results.hurst?.divergence,
              evDivergence: results.evMulti?.divergence,
            })}
          />

          {/* 6. 我在這檔的交易紀錄（雙向跨頁連結反向 + 市場 vs 我的賠率對照）*/}
          <MyTradeHistoryBlock
            stockCode={results.stockCode}
            stockName={results.stockName}
            marketPayoff={results.evMulti?.long.ev.actualOdds ?? null}
          />
        </div>
      )}
    </div>
  )
}

// ── VaR block ─────────────────────────────────────────────────────────────────
// VaR 為負報酬，採台股慣例：負值用綠色 + 顯示負號

function VarBlock({ varResult, freqLabel }: { varResult: VaRResult; freqLabel: string }) {
  const level = classifyVarLevel(varResult.var95)
  const levelLabel = VAR_LEVEL_LABEL[level]
  return (
    <SectionBlock
      title="下行風險：最壞情境虧損"
      subtitle={`VaR 95% / 99% · 使用${freqLabel}`}
    >
      {/* Hero 列：VaR95 報酬率 + 風險等級徽章（風險等級徽章保留警示語意：高=紅、低=綠） */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
        <ResultCard
          title="VaR 95%"
          value={fmtPct(varResult.var95)}
          color={colorByReturn(varResult.var95)}
          emphasis="hero"
          subtitle={`有 5% 機率虧損超過 ${(Math.abs(varResult.var95) * 100).toFixed(2)}%`}
        />
        <div className="space-y-2">
          <span
            className={`inline-block px-4 py-2 rounded-xl text-h2 font-bold border-2
              ${level === 'low'  ? 'bg-green-50  border-green-300  text-green-700'  : ''}
              ${level === 'mid'  ? 'bg-amber-50  border-amber-300  text-amber-700'  : ''}
              ${level === 'high' ? 'bg-red-50    border-red-300    text-red-700'    : ''}`}
          >
            {levelLabel}
          </span>
        </div>
      </div>

      {/* 中層 + 圖表 */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-shrink-0 md:w-64">
          <ResultCard
            title="VaR 99%"
            value={fmtPct(varResult.var99)}
            color={colorByReturn(varResult.var99)}
            subtitle={`有 1% 機率虧損超過 ${(Math.abs(varResult.var99) * 100).toFixed(2)}%`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <VarHistogram returns={varResult.sorted} var95={varResult.var95} var99={varResult.var99} />
        </div>
      </div>
    </SectionBlock>
  )
}

// ── Monte Carlo block ─────────────────────────────────────────────────────────

function McBlock({ mcResult, monthlyCount }: { mcResult: MonteCarloResult; monthlyCount: number }) {
  const fiveYr = mcResult.fiveYear
  const heroColor = fiveYr.p50 >= 1_000_000 ? 'green' : fiveYr.p50 >= 800_000 ? 'yellow' : 'red'
  return (
    <SectionBlock
      title="未來資產淨值模擬"
      subtitle={`蒙地卡羅，初始 100 萬，模擬 100 條路徑 · 使用月報酬 ${monthlyCount} 筆`}
    >
      {/* Hero 列：5 年 P50 */}
      <ResultCard
        title="5 年中位數情境（P50）"
        value={fmtWan(fiveYr.p50)}
        color={heroColor}
        emphasis="hero"
        subtitle={`期望範圍 P5: ${fmtWan(fiveYr.p5)} ~ P95: ${fmtWan(fiveYr.p95)}`}
      />

      {/* 中層：1/3/5 年三組區塊 */}
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

      {/* 弱化：模擬基本參數 */}
      <div className="border-t border-base pt-3">
        <p className="text-label text-faint mb-1.5">模擬基本參數</p>
        <p className="text-small text-dim num">
          μ（月均報酬）<span className={`font-semibold ${mcResult.mu > 0 ? 'text-red-700' : mcResult.mu < 0 ? 'text-green-700' : 'text-main'}`}>{fmtPct(mcResult.mu, 4)}</span>
          {' · '}
          σ（月報酬標準差）<span className="font-semibold">{(mcResult.sigma * 100).toFixed(4)}%</span>
          {' · '}
          模擬路徑數 <span className="font-semibold">100 條</span>
          {' · '}
          月報酬筆數 <span className="font-semibold">{monthlyCount} 筆</span>
        </p>
      </div>
    </SectionBlock>
  )
}
