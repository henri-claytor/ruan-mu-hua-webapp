import { useEffect, useRef, useState, useMemo } from 'react'
import StockSelector from '../components/StockSelector'
import FanChart from '../components/charts/FanChart'
import VarHistogram from '../components/charts/VarHistogram'
import MultiScaleEVBlock from '../components/charts/MultiScaleEVBlock'
import MultiScaleHurstBlock from '../components/charts/MultiScaleHurstBlock'
import FractalDimensionBlock from '../components/charts/FractalDimensionBlock'
import StockVsPortfolioComparison, { type StockComparisonInput } from '../components/trade/StockVsPortfolioComparison'
import { calcEV, calcMultiScaleEV, calcPortfolioMultiScaleEV, type MultiScaleEVResult } from '../lib/ev'
import { calcVaR, type VaRResult } from '../lib/var'
import { runMonteCarlo, type MonteCarloResult } from '../lib/montecarlo'
import { calcMultiScaleHurst, type MultiScaleHurstResult } from '../lib/hurst'
import { calcPortfolioReturns } from '../lib/portfolio'
import { fetchMonthlyReturns, fetchDailyReturns } from '../lib/api'
import { useAppStore, type Stock } from '../store/useAppStore'
import ActionGuide, { buildPortfolioGuide, classifyVarLevel, type VarLevel } from '../components/ActionGuide'
import { fmtPct } from '../utils/format'
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
    <button onClick={handle} disabled={disabled} className="btn btn-ghost">
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

  // 手動「計算組合」狀態：stocks / weights / 任何 fetch 完成都會 reset
  const [computed, setComputed] = useState(false)
  useEffect(() => {
    setComputed(false)
  }, [stocks, hasData, weightValid, portMonthly.length])

  function handleCompute() {
    if (!ready) return
    setComputed(true)
  }

  const computeButtonLabel = isAnyLoading
    ? '載入中...'
    : !ready
    ? '計算組合'
    : computed
    ? '重新計算'
    : '計算組合'

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
                選取所有股票並設定比重合計 100%，再按「計算組合」。
              </p>
            )}
            {isAnyLoading && (
              <p className="text-small text-blue-600 animate-pulse">正在載入股票數據，請稍候...</p>
            )}

            {/* 「計算組合」按鈕 — 與個股頁「查詢」一致 */}
            <div className="flex justify-end">
              <button
                onClick={handleCompute}
                disabled={!ready || isAnyLoading}
                className="btn btn-solid"
              >
                {computeButtonLabel}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {computed && ready && evResult && varResult && mcResult && (
        <div ref={resultRef} className="space-y-4">
          <div className="flex gap-2 justify-end">
            <CopyButton onCopy={handleCopy} disabled={!ready} />
            <button onClick={handleDownload} disabled={!ready} className="btn btn-solid">
              下載 PNG
            </button>
          </div>

          {/* 1. 操作建議（移到頂部 — 結論優先） */}
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

          {/* 2. 組合期望報酬與損益比優勢（多尺度年化期望報酬率） */}
          {evMulti ? (
            <MultiScaleEVBlock
              result={evMulti}
              monthlyCount={portMonthly.length}
              dailyCount={minDailyCount}
              titleOverride="組合期望報酬與損益比優勢"
              dailyCountLabelOverride={
                allHave240Daily || minDailyCount >= 60
                  ? `日報酬最少 ${minDailyCount} 筆`
                  : '日報酬不足，短期未計算'
              }
            />
          ) : (
            <div className="bg-elevated border border-base rounded-2xl px-6 py-4">
              <p className="text-small text-dim">
                <span className="font-semibold text-main">組合期望報酬與損益比優勢未顯示：</span>
                組合月報酬資料不足 5 年（{portMonthly.length} 筆 &lt; 60），無法使用多尺度 EV。
              </p>
            </div>
          )}

          {/* 3. 個股 vs 組合對比（EV / VaR / Hurst 三維度） */}
          {evMulti && varResult && (
            <StockVsPortfolioComparison
              portfolioEV={evMulti}
              portfolioVar={varResult}
              portfolioHurst={hurstMulti}
              stocks={stockComparisons}
            />
          )}

          {/* 4. 組合下行風險 */}
          <PortfolioVarBlock varResult={varResult} returnsForRisk={portForRisk} freqLabel={freqLabel} />

          {/* 5. 組合趨勢延續性偵測 */}
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

          {/* 6. 組合走勢規律性偵測（分形維度 D） */}
          {hurstMulti && <FractalDimensionBlock hurst={hurstMulti} />}

          {/* 7. 組合未來淨值模擬 */}
          <PortfolioMcBlock mcResult={mcResult} monthlyCount={portMonthly.length} />
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
  const levelClass =
    level === 'low'  ? 'bg-green-50 text-green-700 border-green-300' :
    level === 'mid'  ? 'bg-amber-50 text-amber-700 border-amber-300' :
                       'bg-red-50 text-red-700 border-red-300'
  const var95Pct = (Math.abs(varResult.var95) * 100).toFixed(1)
  const var99Pct = (Math.abs(varResult.var99) * 100).toFixed(1)
  const nSamples = returnsForRisk.length

  return (
    <SectionBlock
      title="組合下行風險：最壞情境虧損"
      subtitle={`使用 ${freqLabel}`}
    >
      {/* 主卡：95% 下行虧損 */}
      <div className="relative bg-[#f4ead8] border-2 border-[#c9a84c] rounded-lg px-[18px] py-4">
        <div className="absolute top-2.5 right-3.5 flex items-center gap-1.5">
          <span className="text-[10.5px] bg-gold-dark text-white px-2 py-0.5 rounded-full font-semibold">主判斷</span>
          <span className={`text-[10.5px] px-2 py-0.5 rounded-full border ${levelClass} font-semibold`}>
            {levelLabel}
          </span>
        </div>
        <p className="text-[18px] font-bold text-main">組合 95% 下行虧損</p>
        <p className="text-[11px] text-dim mb-3">{nSamples} 筆樣本</p>

        <p className="text-[13px] text-dim mb-1">第 5 百分位</p>
        <p className="font-serif text-[40px] font-bold leading-none num text-green-700">
          {fmtPct(varResult.var95)}
        </p>
        <p className="text-[11px] text-dim mt-2">有 5% 機率虧損超過 <span className="num font-semibold">{var95Pct}%</span></p>
      </div>

      {/* 99% 橫向參考列 */}
      <div className="bg-elevated border border-[rgba(154,122,46,0.12)] rounded-lg px-[18px] py-3 flex items-center flex-wrap gap-x-3.5 gap-y-1">
        <span className="text-[16px] font-bold text-dim">99% 下行虧損</span>
        <span className="w-px h-3.5 bg-[rgba(154,122,46,0.18)]" />
        <span className="text-[11.5px] text-dim">第 1 百分位</span>
        <span className="w-px h-3.5 bg-[rgba(154,122,46,0.18)]" />
        <span className="font-serif text-[20px] font-bold num text-green-700">{fmtPct(varResult.var99)}</span>
        <span className="w-px h-3.5 bg-[rgba(154,122,46,0.18)]" />
        <span className="text-[11.5px] text-dim">有 1% 機率虧損超過 <span className="num font-semibold">{var99Pct}%</span></span>
      </div>

      {/* Histogram */}
      <div>
        <VarHistogram returns={returnsForRisk} var95={varResult.var95} var99={varResult.var99} />
      </div>
    </SectionBlock>
  )
}


function PortfolioMcBlock({ mcResult, monthlyCount }: { mcResult: MonteCarloResult; monthlyCount: number }) {
  const horizons = [
    { label: '1 年', data: mcResult.oneYear, isPrimaryMain: false },
    { label: '3 年', data: mcResult.threeYear, isPrimaryMain: false },
    { label: '5 年', data: mcResult.fiveYear, isPrimaryMain: true },
  ] as const

  return (
    <SectionBlock
      title="組合未來淨值模擬"
      subtitle={`蒙地卡羅 · 初始 100 萬 / 模擬 100 條路徑 · 組合月報酬 ${monthlyCount} 筆`}
    >
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
