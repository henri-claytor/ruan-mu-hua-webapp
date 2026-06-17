import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import StockSelector from '../components/StockSelector'
import VarHistogram from '../components/charts/VarHistogram'
import FanChart from '../components/charts/FanChart'
import MultiScaleHurstBlock from '../components/charts/MultiScaleHurstBlock'
import FractalDimensionBlock from '../components/charts/FractalDimensionBlock'
import MultiScaleEVBlock from '../components/charts/MultiScaleEVBlock'
import { calcMultiScaleEV, type MultiScaleEVResult } from '../lib/ev'
import { calcVaR, type VaRResult } from '../lib/var'
import { runMonteCarlo, type MonteCarloResult } from '../lib/montecarlo'
import { calcMultiScaleHurst, type MultiScaleHurstResult } from '../lib/hurst'
import { fetchMonthlyReturns, fetchDailyReturns } from '../lib/api'
import { useAppStore } from '../store/useAppStore'
import ActionGuide, { buildIndividualGuide, classifyVarLevel, type VarLevel } from '../components/ActionGuide'
import ComplianceFooter from '../components/ComplianceFooter'
import MyTradeHistoryBlock from '../components/trade/MyTradeHistoryBlock'
import { fmtPct } from '../utils/format'
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
    <button onClick={handle} disabled={disabled} className="btn btn-ghost">
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
        <h2 className="font-serif text-h2 font-bold text-main tracking-wide">{title}</h2>
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

  const [pendingCode, setPendingCode] = useState<string>(individualStockCode)
  const [queriedCode, setQueriedCode] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Results | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const [searchParams] = useSearchParams()

  // 深度連結：URL ?code=XXXX 自動觸發查詢
  useEffect(() => {
    const code = searchParams.get('code')
    if (code && code !== queriedCode) {
      setPendingCode(code)
      runQuery(code, '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function handleSelect(code: string, _name: string) {
    // 只更新 pending；不立即發 API
    setPendingCode(code)
    setIndividualStockCode(code)
  }

  async function runQuery(code: string, name: string) {
    if (!code) return
    setError(null)
    setLoading(true)
    setResults(null)

    try {
      const [monthly, daily] = await Promise.all([
        fetchMonthlyReturns(code),
        fetchDailyReturns(code).catch(() => [] as number[]),
      ])

      const stockName = name || stockList.find((s) => s.code === code)?.name || code

      if (monthly.length < 60) {
        setError(`${stockName} 月報酬數據不足（${monthly.length} 筆），無法計算`)
        return
      }

      const useDaily = daily.length >= 252
      const returnsForRisk = useDaily ? daily : monthly
      const freqLabel = useDaily
        ? `日報酬 ${daily.length} 筆`
        : `月報酬 ${monthly.length} 筆（日頻數據不足）`

      setResults({
        stockCode: code,
        stockName,
        freqLabel,
        monthlyCount: monthly.length,
        dailyCount: daily.length,
        evMulti: calcMultiScaleEV(monthly, daily),
        var: calcVaR(returnsForRisk),
        mc: runMonteCarlo(monthly, 100),
        hurst: daily.length >= 240 ? calcMultiScaleHurst(daily) : null,
      })
      setQueriedCode(code)
    } catch (err) {
      setError(`載入失敗：${String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  function handleQueryClick() {
    runQuery(pendingCode, '')
  }

  function handleClear() {
    clearIndividual()
    setPendingCode('')
    setQueriedCode('')
    setResults(null)
    setError(null)
  }

  const queryButtonState: 'disabled' | 'query' | 'requery' | 'loading' =
    loading ? 'loading' :
    !pendingCode ? 'disabled' :
    pendingCode === queriedCode ? 'requery' :
    'query'
  const queryButtonLabel =
    queryButtonState === 'loading' ? '查詢中...' :
    queryButtonState === 'requery' ? '重新查詢' :
    '查詢'

  async function handleCopy() {
    if (!results || !results.evMulti) return
    // 摘要用 primary 尺度（medium 最近 1 年），降級到 short 或 long
    const primary = results.evMulti.medium ?? results.evMulti.short ?? results.evMulti.long
    if (!primary) return
    const text = buildIndividualSummary({
      ev: primary.ev,
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
          <h1 className="font-serif text-h1 font-bold text-main tracking-wide">
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

      {/* ── Stock Selector + Query ── */}
      <div className="bg-surface rounded-2xl border border-base p-4 space-y-3">
        <label className="block text-small font-medium text-dim">選取股票</label>
        <div className="flex gap-2 items-stretch">
          <div className="flex-1">
            <StockSelector value={pendingCode} onChange={handleSelect} />
          </div>
          <button
            onClick={handleQueryClick}
            disabled={queryButtonState === 'disabled' || queryButtonState === 'loading'}
            className="btn btn-solid whitespace-nowrap"
          >
            {queryButtonLabel}
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!loading && !hasResult && !error && (
        <div className="border-2 border-dashed border-base rounded-2xl p-8 text-center bg-elevated">
          <p className="text-dim text-body">
            {pendingCode ? '請按「查詢」開始分析' : '請選取股票以開始分析'}
          </p>
          <p className="text-faint text-small mt-1">系統將取得月報酬與日報酬數據</p>
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
            <button onClick={handleDownload} disabled={!hasResult} className="btn btn-solid">
              下載 PNG
            </button>
          </div>

          {/* 1. 分析觀察（移到最上，使用者先看結論） */}
          {(() => {
            const primary = results.evMulti?.medium ?? results.evMulti?.short ?? results.evMulti?.long ?? null
            return (
              <ActionGuide
                items={buildIndividualGuide({
                  ev: primary?.ev.ev ?? 0,
                  evQuadrant: primary?.ev.quadrant ?? '低賠率負期望值（較弱）',
                  varLevel: classifyVarLevel(results.var.var95),
                  hurstH: results.hurst?.short.h ?? null,
                  hurstDivergence: results.hurst?.divergence,
                  evDivergence: results.evMulti?.divergence,
                })}
              />
            )
          })()}

          {/* 2. 期望報酬與損益比優勢（EV，多尺度年化） */}
          {results.evMulti ? (
            <MultiScaleEVBlock
              result={results.evMulti}
              monthlyCount={results.monthlyCount}
              dailyCount={results.dailyCount}
            />
          ) : (
            <div className="bg-elevated border border-base rounded-2xl px-6 py-4">
              <p className="text-small text-dim">
                <span className="font-semibold text-main">期望報酬與損益比優勢未顯示：</span>
                月報酬資料不足 60 筆（目前 {results.monthlyCount} 筆），需要約 5 年的月報酬資料才能使用多尺度 EV。
              </p>
            </div>
          )}

          {/* 3. 下行風險：最壞情境虧損（VaR） */}
          <VarBlock varResult={results.var} freqLabel={results.freqLabel} />

          {/* 4. 趨勢延續性偵測（Hurst） */}
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

          {/* 5. 走勢規律性偵測（分形維度 D，依 Hurst 推算） */}
          {results.hurst && <FractalDimensionBlock hurst={results.hurst} />}

          {/* 6. 未來資產淨值模擬（蒙地卡羅） */}
          <McBlock mcResult={results.mc} monthlyCount={results.monthlyCount} />

          {/* 7. 我在這檔的交易紀錄 */}
          <MyTradeHistoryBlock
            stockCode={results.stockCode}
            stockName={results.stockName}
            marketPayoff={(results.evMulti?.medium ?? results.evMulti?.short ?? results.evMulti?.long)?.ev.actualOdds ?? null}
          />
          <ComplianceFooter />
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
  const levelClass =
    level === 'low'  ? 'bg-green-50 text-green-700 border-green-300' :
    level === 'mid'  ? 'bg-amber-50 text-amber-700 border-amber-300' :
                       'bg-red-50 text-red-700 border-red-300'
  const var95Pct = (Math.abs(varResult.var95) * 100).toFixed(1)
  const var99Pct = (Math.abs(varResult.var99) * 100).toFixed(1)
  const nSamples = varResult.sorted.length

  return (
    <SectionBlock
      title="下行風險：最壞情境虧損"
      subtitle={`使用 ${freqLabel}`}
    >
      {/* 主卡：95% 下行虧損（金邊 + 主判斷 chip + 右上風險等級） */}
      <div className="relative bg-[#f4ead8] border-2 border-[#c9a84c] rounded-lg px-[18px] py-4">
        <div className="absolute top-2.5 right-3.5 flex items-center gap-1.5">
          <span className="text-[10.5px] bg-gold-dark text-white px-2 py-0.5 rounded-full font-semibold">主判斷</span>
          <span className={`text-[10.5px] px-2 py-0.5 rounded-full border ${levelClass} font-semibold`}>
            {levelLabel}
          </span>
        </div>
        <p className="text-[18px] font-bold text-main">95% 下行虧損</p>
        <p className="text-[11px] text-dim mb-3">{nSamples} 筆{freqLabel.startsWith('日') ? '日' : '月'}報酬樣本</p>

        <p className="text-[13px] text-dim mb-1">第 5 百分位</p>
        <p className="font-serif text-[40px] font-bold leading-none num text-green-700">
          {fmtPct(varResult.var95)}
        </p>
        <p className="text-[11px] text-dim mt-2">有 5% 機率虧損超過 <span className="num font-semibold">{var95Pct}%</span></p>
      </div>

      {/* 99% 參考橫列 */}
      <div className="bg-elevated border border-[rgba(154,122,46,0.12)] rounded-lg px-[18px] py-3 flex items-center flex-wrap gap-x-3.5 gap-y-1">
        <span className="text-[16px] font-bold text-dim">99% 下行虧損</span>
        <span className="w-px h-3.5 bg-[rgba(154,122,46,0.18)]" />
        <span className="text-[11.5px] text-dim">第 1 百分位</span>
        <span className="w-px h-3.5 bg-[rgba(154,122,46,0.18)]" />
        <span className="font-serif text-[20px] font-bold num text-green-700">{fmtPct(varResult.var99)}</span>
        <span className="w-px h-3.5 bg-[rgba(154,122,46,0.18)]" />
        <span className="text-[11.5px] text-dim">有 1% 機率虧損超過 <span className="num font-semibold">{var99Pct}%</span></span>
      </div>

      {/* Histogram supporting visual */}
      <div>
        <VarHistogram returns={varResult.sorted} var95={varResult.var95} var99={varResult.var99} />
      </div>
    </SectionBlock>
  )
}

// ── Monte Carlo block ─────────────────────────────────────────────────────────

function McBlock({ mcResult, monthlyCount }: { mcResult: MonteCarloResult; monthlyCount: number }) {
  const horizons = [
    { label: '1 年', data: mcResult.oneYear, isPrimaryMain: false },
    { label: '3 年', data: mcResult.threeYear, isPrimaryMain: false },
    { label: '5 年', data: mcResult.fiveYear, isPrimaryMain: true },
  ] as const

  return (
    <SectionBlock
      title="未來資產淨值模擬"
      subtitle={`蒙地卡羅 · 初始 100 萬 / 模擬 100 條路徑 · 月報酬 ${monthlyCount} 筆`}
    >
      {/* 3 卡並排：1 年 / 3 年 / 5 年（5 年為主判斷） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {horizons.map(({ label, data, isPrimaryMain }) => {
          const cardCls = isPrimaryMain
            ? 'relative bg-[#f4ead8] border-2 border-[#c9a84c] rounded-lg px-[18px] py-4'
            : 'bg-card2 border border-base rounded-lg px-[18px] py-4'
          const numSize = isPrimaryMain ? 'text-[40px]' : 'text-[36px]'
          const numClass = data.p50 >= 1_000_000 ? 'text-red-700' : data.p50 >= 800_000 ? 'text-amber-700' : 'text-green-700'
          return (
            <div key={label} className={cardCls}>
              {isPrimaryMain && (
                <div className="absolute top-2.5 right-3.5 flex items-center gap-1.5">
                  <span className="text-[10.5px] bg-gold-dark text-white px-2 py-0.5 rounded-full font-semibold">主判斷</span>
                </div>
              )}
              <p className="text-[18px] font-bold text-main">{label}</p>
              <p className="text-[11px] text-dim mb-3">投影終值</p>
              <p className="text-[13px] text-dim mb-1">中位情境</p>
              <p className={`font-serif ${numSize} font-bold leading-none num ${numClass}`}>
                {fmtWan(data.p50)}
              </p>
              <p className="text-[11px] text-dim mt-2">
                悲觀 <span className="num font-semibold">{fmtWan(data.p5)}</span> ~ 樂觀 <span className="num font-semibold">{fmtWan(data.p95)}</span>
              </p>
              {isPrimaryMain && (
                <p className="text-[11px] text-dim mt-1">
                  μ=<span className="num font-semibold">{fmtPct(mcResult.mu, 2)}</span> / σ=<span className="num font-semibold">{fmtPct(mcResult.sigma, 2)}</span>
                </p>
              )}
            </div>
          )
        })}
      </div>

      <FanChart paths={mcResult.allPathsMonthly} />
    </SectionBlock>
  )
}
