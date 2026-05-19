import { useEffect, useRef, useState, useMemo } from 'react'
import StockSelector from '../components/StockSelector'
import ResultCard from '../components/ResultCard'
import FanChart from '../components/charts/FanChart'
import VarHistogram from '../components/charts/VarHistogram'
import MultiScaleEVBlock from '../components/charts/MultiScaleEVBlock'
import MultiScaleHurstBlock from '../components/charts/MultiScaleHurstBlock'
import StockVsPortfolioComparison, { type StockComparisonInput } from '../components/trade/StockVsPortfolioComparison'
import { calcEV, calcMultiScaleEV, calcPortfolioMultiScaleEV, type MultiScaleEVResult } from '../lib/ev'
import { calcVaR, type VaRResult } from '../lib/var'
import { runMonteCarlo, type MonteCarloResult } from '../lib/montecarlo'
import { calcMultiScaleHurst, type MultiScaleHurstResult } from '../lib/hurst'
import { calcPortfolioReturns } from '../lib/portfolio'
import { fetchMonthlyReturns, fetchDailyReturns } from '../lib/api'
import { useAppStore, type Stock } from '../store/useAppStore'
import ActionGuide, { buildPortfolioGuide, classifyVarLevel, type VarLevel } from '../components/ActionGuide'
import { fmtPct, colorByReturn } from '../utils/format'
import {
  buildPortfolioSummary,
  copyTextToClipboard,
  downloadPng,
  buildPngFilename,
} from '../utils/export'

let nextId = 10

function fmtWan(n: number): string {
  return `${(n / 10000).toFixed(1)} 萬`
}

const VAR_LEVEL_LABEL: Record<VarLevel, string> = {
  low: '低風險（VaR95 < 5%）',
  mid: '中等風險（VaR95 5%–10%）',
  high: '高風險（VaR95 > 10%）',
}

// ── Disclosure / SectionBlock 共用元件 ────────────────────────────────────────

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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const stocks = useAppStore((s) => s.stocks)
  const setStocks = useAppStore((s) => s.setStocks)
  const clearPortfolio = useAppStore((s) => s.clearPortfolio)
  const resultRef = useRef<HTMLDivElement>(null)

  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set())

  function addStock() {
    if (stocks.length >= 10) return
    const newStock: Stock = {
      id: nextId++,
      code: '',
      name: `股票 ${String.fromCharCode(64 + stocks.length + 1)}`,
      monthlyReturns: [],
      dailyReturns: [],
      weight: 0,
    }
    setStocks([...stocks, newStock])
  }

  function removeStock(id: number) {
    if (stocks.length <= 2) return
    setStocks(stocks.filter((s) => s.id !== id))
  }

  function updateWeight(id: number, weight: number) {
    setStocks(stocks.map((s) => (s.id === id ? { ...s, weight } : s)))
  }

  async function handleStockSelect(id: number, code: string, name: string) {
    setStocks(
      stocks.map((s) =>
        s.id === id ? { ...s, code, name, monthlyReturns: [], dailyReturns: [] } : s
      )
    )
    setLoadingIds((prev) => new Set(prev).add(id))

    try {
      const [monthly, daily] = await Promise.all([
        fetchMonthlyReturns(code),
        fetchDailyReturns(code).catch(() => [] as number[]),
      ])
      setStocks(
        stocks.map((s) =>
          s.id === id ? { ...s, code, name, monthlyReturns: monthly, dailyReturns: daily } : s
        )
      )
    } catch (err) {
      console.error(`Failed to fetch returns for ${code}:`, err)
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const totalWeight = stocks.reduce((a, s) => a + Number(s.weight), 0)
  const weightValid = Math.abs(totalWeight - 100) < 0.01

  const hasData = stocks.every((s) => s.monthlyReturns.length >= 10)
  const isAnyLoading = loadingIds.size > 0

  const weights = stocks.map((s) => Number(s.weight) / 100)
  const stockMonthly = stocks.map((s) => s.monthlyReturns)
  const portMonthly = hasData && weightValid ? calcPortfolioReturns(stockMonthly, weights) : []

  const useDailyFreq = stocks.every((s) => s.dailyReturns.length >= 252)
  const stocksLackingDaily = useDailyFreq
    ? []
    : stocks.filter((s) => s.code && s.dailyReturns.length < 252).map((s) => s.name || s.code)

  const stockDailyAligned = (() => {
    if (!useDailyFreq || !hasData) return []
    const minLen = Math.min(...stocks.map((s) => s.dailyReturns.length))
    return stocks.map((s) => s.dailyReturns.slice(-minLen))
  })()

  const portForRisk = useDailyFreq && stockDailyAligned.length > 0
    ? calcPortfolioReturns(stockDailyAligned, weights)
    : portMonthly

  const freqLabel = useDailyFreq
    ? `日報酬 ${stockDailyAligned[0]?.length ?? 0} 筆`
    : `月報酬 ${portMonthly.length} 筆${stocksLackingDaily.length > 0 ? '（部分股票日頻不足）' : ''}`

  const evResult = portMonthly.length > 0 ? calcEV(portMonthly) : null
  const varResult = portForRisk.length > 0 ? calcVaR(portForRisk) : null
  const mcResult = portMonthly.length > 0 ? runMonteCarlo(portMonthly, 100) : null

  // 多尺度 EV（組合）
  const evMulti = useMemo<MultiScaleEVResult | null>(() => {
    if (!hasData || !weightValid) return null
    return calcPortfolioMultiScaleEV(stockMonthly, stocks.map((s) => s.dailyReturns), weights)
  }, [hasData, weightValid, stockMonthly, stocks, weights])

  // 多尺度 Hurst（組合）：所有股票日報酬 ≥ 240 才用多尺度，否則 fallback 單尺度
  const allHave240Daily = stocks.every((s) => s.dailyReturns.length >= 240)
  const weightedDaily240 = useMemo(() => {
    if (!allHave240Daily || !hasData || !weightValid) return null
    return calcPortfolioReturns(stocks.map((s) => s.dailyReturns.slice(-240)), weights)
  }, [allHave240Daily, hasData, weightValid, stocks, weights])
  const hurstMulti = useMemo<MultiScaleHurstResult | null>(() => {
    if (!weightedDaily240) return null
    return calcMultiScaleHurst(weightedDaily240)
  }, [weightedDaily240])

  // 組合最少日報酬筆數（用於 MultiScaleEVBlock 副標）
  const minDailyCount = stocks.every((s) => s.code)
    ? Math.min(...stocks.map((s) => s.dailyReturns.length))
    : 0

  // Hurst 多尺度資料不足時，列出哪些股票日報酬 < 240
  const stocksLackingHurstDaily = stocks
    .filter((s) => s.code && s.dailyReturns.length < 240)
    .map((s) => s.name || s.code)

  // 個股 vs 組合對比：對每股獨立計算多尺度 EV / VaR / Hurst
  const stockComparisons = useMemo<StockComparisonInput[]>(() => {
    if (!evMulti || !varResult) return []
    return stocks.map((s) => {
      const stockEV =
        s.monthlyReturns.length >= 60
          ? calcMultiScaleEV(s.monthlyReturns, s.dailyReturns)
          : null
      const stockVar = s.monthlyReturns.length >= 10
        ? calcVaR(s.dailyReturns.length >= 252 ? s.dailyReturns : s.monthlyReturns)
        : null
      const stockHurst =
        s.dailyReturns.length >= 240 ? calcMultiScaleHurst(s.dailyReturns) : null
      return {
        stockId: s.code,
        stockName: s.name,
        weight: s.weight,
        ev: stockEV,
        var: stockVar,
        hurst: stockHurst,
      }
    })
  }, [stocks, evMulti, varResult])

  const ready = hasData && weightValid && portMonthly.length > 0 && !isAnyLoading

  const selectedCodes = stocks.map((s) => s.code).filter(Boolean)

  // ── 股票選取區塊摺疊狀態：未完成輸入 → 展開；完成 → 收合 ──────────────────────
  // 使用 ref 記錄使用者是否手動切換過，已切換則不再被自動覆寫
  const [inputOpen, setInputOpen] = useState(!ready)
  const userToggledRef = useRef(false)

  useEffect(() => {
    // 僅在使用者尚未手動切換時，依 ready 自動同步一次
    if (!userToggledRef.current) {
      setInputOpen(!ready)
    }
  }, [ready])

  function toggleInput() {
    userToggledRef.current = true
    setInputOpen((v) => !v)
  }

  async function handleCopy() {
    if (!evResult || !varResult || !mcResult) return
    await copyTextToClipboard(buildPortfolioSummary({ ev: evResult, var: varResult, mc: mcResult }))
  }

  async function handleDownload() {
    if (!resultRef.current) return
    await downloadPng(resultRef.current, buildPngFilename('portfolio'))
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-h1 font-bold text-main tracking-wide">投資組合分析</h1>
          <p className="text-small text-dim mt-0.5">
            選取多支股票並設定比重，計算加權組合 EV、VaR、Hurst 指數與蒙地卡羅模擬
          </p>
        </div>
        <button
          onClick={clearPortfolio}
          className="text-small text-red-500 hover:text-red-700 underline"
        >
          清除資料
        </button>
      </div>

      {/* ── 股票選取與比重設定（移到頂部，可摺疊）── */}
      <div className="bg-surface rounded-2xl border border-base overflow-hidden">
        <button
          type="button"
          onClick={toggleInput}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-elevated transition-colors"
        >
          <div className="text-left">
            <h2 className="font-serif text-h2 font-bold text-main tracking-wide">股票選取與比重設定</h2>
            <p className="text-caption text-faint mt-0.5">
              {stocks.length} 支股票 · 比重合計
              <span className={`num font-semibold ml-1 ${weightValid ? 'text-green-700' : 'text-red-600'}`}>
                {totalWeight.toFixed(1)}%
              </span>
            </p>
          </div>
          <span className="text-faint text-small">{inputOpen ? '▼ 收折股票選取' : '▶ 展開股票選取'}</span>
        </button>

        {inputOpen && (
          <div className="px-6 pb-6 space-y-4">
            <div className="flex items-center justify-end gap-3">
              <span className={`text-small font-medium ${weightValid ? 'text-green-700' : 'text-red-600'}`}>
                比重合計：<span className="num">{totalWeight.toFixed(1)}%</span>
                {!weightValid && ` （差 ${(100 - totalWeight).toFixed(1)}%）`}
              </span>
              <button
                onClick={addStock}
                disabled={stocks.length >= 10}
                className="px-3 py-1.5 bg-blue-600 text-surface text-small rounded-lg
                           hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                + 新增股票
              </button>
            </div>

            <div className="space-y-3">
              {stocks.map((stock) => {
                const isLoading = loadingIds.has(stock.id)
                return (
                  <div key={stock.id} className="border border-base rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <StockSelector
                          value={stock.code}
                          onChange={(code, name) => handleStockSelect(stock.id, code, name)}
                          disabledCodes={selectedCodes.filter((c) => c !== stock.code)}
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="text-small text-dim whitespace-nowrap">比重</label>
                        <input
                          type="number"
                          className="w-20 px-2 py-1.5 border border-base rounded-lg text-small text-main bg-surface
                                     focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="50"
                          value={stock.weight}
                          onChange={(e) => updateWeight(stock.id, Number(e.target.value))}
                          disabled={!stock.code || isLoading}
                        />
                        <span className="text-small text-dim">%</span>
                      </div>
                      <button
                        onClick={() => removeStock(stock.id)}
                        disabled={stocks.length <= 2}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none"
                        title="刪除"
                      >
                        ×
                      </button>
                    </div>

                    {isLoading && (
                      <p className="text-caption text-blue-600 animate-pulse">⟳ 正在載入報酬數據...</p>
                    )}
                    {!isLoading && stock.code && (
                      <p className="text-caption text-faint">
                        月報酬：{stock.monthlyReturns.length} 筆 ／
                        日報酬：{stock.dailyReturns.length} 筆
                        {stock.dailyReturns.length > 0 && stock.dailyReturns.length < 252 && (
                          <span className="text-amber-600">（日頻不足 252 筆，將降級月頻）</span>
                        )}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {!ready && !isAnyLoading && (
              <p className="text-small text-faint">
                選取所有股票並設定比重合計 100% 後，分析結果將自動顯示。
              </p>
            )}
            {isAnyLoading && (
              <p className="text-small text-blue-600 animate-pulse">正在載入股票數據，請稍候...</p>
            )}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {ready && evResult && varResult && mcResult && (
        <div ref={resultRef} className="space-y-4">
          <div className="flex gap-2 justify-end">
            <CopyButton onCopy={handleCopy} disabled={!ready} />
            <button
              onClick={handleDownload}
              disabled={!ready}
              className="px-3 py-1.5 text-small bg-elevated border border-base rounded-lg text-dim
                         hover:text-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              下載 PNG
            </button>
          </div>

          {/* 1. 組合期望報酬與賠率優勢（多尺度年化 EV） */}
          {evMulti ? (
            <MultiScaleEVBlock
              result={evMulti}
              monthlyCount={portMonthly.length}
              dailyCount={minDailyCount}
              titleOverride="組合期望報酬與賠率優勢"
              dailyCountLabelOverride={
                allHave240Daily || minDailyCount >= 60
                  ? `日報酬最少 ${minDailyCount} 筆`
                  : '日報酬不足，短期未計算'
              }
            />
          ) : (
            <div className="bg-elevated border border-base rounded-2xl px-6 py-4">
              <p className="text-small text-dim">
                <span className="font-semibold text-main">組合期望報酬與賠率優勢未顯示：</span>
                組合月報酬資料不足 5 年（{portMonthly.length} 筆 &lt; 60），無法使用多尺度 EV。
              </p>
            </div>
          )}

          {/* 1.5 個股 vs 組合對比（EV / VaR / Hurst 三維度） */}
          {evMulti && varResult && (
            <StockVsPortfolioComparison
              portfolioEV={evMulti}
              portfolioVar={varResult}
              portfolioHurst={hurstMulti}
              stocks={stockComparisons}
            />
          )}

          {/* 2. 組合下行風險 */}
          <PortfolioVarBlock varResult={varResult} returnsForRisk={portForRisk} freqLabel={freqLabel} />

          {/* 3. 組合趨勢延續性偵測（嚴格多尺度 — 與個股頁一致） */}
          {hurstMulti ? (
            <MultiScaleHurstBlock result={hurstMulti} titleOverride="組合趨勢延續性偵測" />
          ) : (
            <div className="bg-elevated border border-base rounded-2xl px-6 py-4">
              <p className="text-small text-dim">
                <span className="font-semibold text-main">組合趨勢延續性偵測未顯示：</span>
                所有股票日報酬必須 ≥ 240 筆才能計算多尺度 Hurst。
                {stocksLackingHurstDaily.length > 0 && (
                  <>目前 {stocksLackingHurstDaily.join('、')} 不足。</>
                )}
              </p>
            </div>
          )}

          {/* 4. 組合未來淨值模擬 */}
          <PortfolioMcBlock mcResult={mcResult} monthlyCount={portMonthly.length} />

          {/* 5. 建議行動參考（含 divergence 訊號） */}
          <ActionGuide
            items={buildPortfolioGuide({
              ev: evResult.ev,
              varLevel: classifyVarLevel(varResult.var95),
              hurstH: hurstMulti?.short.h ?? null,
              stockCount: stocks.length,
              evDivergence: evMulti?.divergence,
              hurstDivergence: hurstMulti?.divergence,
            })}
          />
        </div>
      )}
    </div>
  )
}

// ── Sub-blocks ────────────────────────────────────────────────────────────────

function PortfolioVarBlock({
  varResult,
  returnsForRisk,
  freqLabel,
}: {
  varResult: VaRResult
  returnsForRisk: number[]
  freqLabel: string
}) {
  const level = classifyVarLevel(varResult.var95)
  const levelLabel = VAR_LEVEL_LABEL[level]
  return (
    <SectionBlock
      title="組合下行風險：最壞情境虧損"
      subtitle={`VaR 95% / 99% · 使用${freqLabel}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
        <ResultCard
          title="組合 VaR 95%"
          value={fmtPct(varResult.var95)}
          color={colorByReturn(varResult.var95)}
          emphasis="hero"
          subtitle={`有 5% 機率虧損超過 ${(Math.abs(varResult.var95) * 100).toFixed(2)}%`}
        />
        <span
          className={`inline-block px-4 py-2 rounded-xl text-h2 font-bold border-2
            ${level === 'low'  ? 'bg-green-50  border-green-300  text-green-700'  : ''}
            ${level === 'mid'  ? 'bg-amber-50  border-amber-300  text-amber-700'  : ''}
            ${level === 'high' ? 'bg-red-50    border-red-300    text-red-700'    : ''}`}
        >
          {levelLabel}
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-shrink-0 md:w-64">
          <ResultCard
            title="VaR 99%"
            value={fmtPct(varResult.var99)}
            subtitle={`有 1% 機率虧損超過 ${(Math.abs(varResult.var99) * 100).toFixed(2)}%`}
            color={colorByReturn(varResult.var99)}
          />
        </div>
        <div className="flex-1 min-w-0">
          <VarHistogram returns={returnsForRisk} var95={varResult.var95} var99={varResult.var99} />
        </div>
      </div>
    </SectionBlock>
  )
}


function PortfolioMcBlock({ mcResult, monthlyCount }: { mcResult: MonteCarloResult; monthlyCount: number }) {
  const fiveYr = mcResult.fiveYear
  const heroColor = fiveYr.p50 >= 1_000_000 ? 'green' : fiveYr.p50 >= 800_000 ? 'yellow' : 'red'
  return (
    <SectionBlock
      title="組合未來淨值模擬"
      subtitle={`蒙地卡羅，初始 100 萬，模擬 100 條路徑 · 使用組合月報酬 ${monthlyCount} 筆`}
    >
      <ResultCard
        title="5 年中位數情境（P50）"
        value={fmtWan(fiveYr.p50)}
        color={heroColor}
        emphasis="hero"
        subtitle={`期望範圍 P5: ${fmtWan(fiveYr.p5)} ~ P95: ${fmtWan(fiveYr.p95)}`}
      />

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

      <div className="border-t border-base pt-3">
        <p className="text-label text-faint mb-1.5">模擬基本參數</p>
        <p className="text-small text-dim num">
          μ（月均報酬）<span className={`font-semibold ${mcResult.mu > 0 ? 'text-red-700' : mcResult.mu < 0 ? 'text-green-700' : 'text-main'}`}>{fmtPct(mcResult.mu, 4)}</span>
          {' · '}
          σ（月報酬標準差）<span className="font-semibold">{(mcResult.sigma * 100).toFixed(4)}%</span>
          {' · '}
          模擬路徑數 <span className="font-semibold">100 條</span>
          {' · '}
          組合月報酬筆數 <span className="font-semibold">{monthlyCount} 筆</span>
        </p>
      </div>
    </SectionBlock>
  )
}
