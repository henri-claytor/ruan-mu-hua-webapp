import { useRef, useState } from 'react'
import StockSelector from '../components/StockSelector'
import ResultCard from '../components/ResultCard'
import FanChart from '../components/charts/FanChart'
import VarHistogram from '../components/charts/VarHistogram'
import HurstLineChart from '../components/charts/HurstLineChart'
import { calcEV } from '../lib/ev'
import { calcVaR } from '../lib/var'
import { runMonteCarlo } from '../lib/montecarlo'
import { calcHurst } from '../lib/hurst'
import { calcPortfolioReturns } from '../lib/portfolio'
import { fetchMonthlyReturns, fetchDailyReturns } from '../lib/api'
import { useAppStore, type Stock } from '../store/useAppStore'
import {
  buildPortfolioSummary,
  copyTextToClipboard,
  downloadPng,
  buildPngFilename,
} from '../utils/export'

let nextId = 10

function fmt(n: number, digits = 2): string {
  return (n * 100).toFixed(digits) + '%'
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

export default function PortfolioPage() {
  const stocks = useAppStore((s) => s.stocks)
  const setStocks = useAppStore((s) => s.setStocks)
  const clearPortfolio = useAppStore((s) => s.clearPortfolio)
  const resultRef = useRef<HTMLDivElement>(null)

  // Track which stock IDs are currently loading
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
    // Update code/name immediately, clear old returns
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

  // Compute portfolio returns (monthly always available for EV+MC)
  const weights = stocks.map((s) => Number(s.weight) / 100)
  const stockMonthly = stocks.map((s) => s.monthlyReturns)
  const portMonthly = hasData && weightValid ? calcPortfolioReturns(stockMonthly, weights) : []

  // Dual-frequency for VaR + Hurst: all stocks need daily >= 252
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
  const hurstResult = portForRisk.length >= 10 ? calcHurst(portForRisk) : null

  const ready = hasData && weightValid && portMonthly.length > 0 && !isAnyLoading

  const selectedCodes = stocks.map((s) => s.code).filter(Boolean)

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 font-bold text-main">投資組合分析</h1>
          <p className="text-small text-dim mt-0.5">
            選取多支股票並設定比重，計算加權組合 EV、VaR、蒙地卡羅與 Hurst 指數
          </p>
        </div>
        <button
          onClick={clearPortfolio}
          className="text-small text-red-500 hover:text-red-700 underline"
        >
          清除資料
        </button>
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

          {/* EV */}
          <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
            <h2 className="text-h2 font-semibold text-main">加權組合期望值</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ResultCard title="組合 EV" value={fmt(evResult.ev)} color={evResult.ev >= 0 ? 'green' : 'red'} large />
              <ResultCard title="勝率" value={fmt(evResult.winRate)} color="green" />
              <ResultCard title="敗率" value={fmt(evResult.lossRate)} color="red" />
              <ResultCard title="實際賠率" value={evResult.actualOdds.toFixed(2)} subtitle="Avg Gain ÷ Avg Loss" color="blue" />
            </div>
          </div>

          {/* VaR */}
          <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
            <div>
              <h2 className="text-h2 font-semibold text-main">風險值（VaR）</h2>
              <p className="text-caption text-faint mt-0.5">使用{freqLabel}</p>
            </div>
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
                <VarHistogram returns={portForRisk} var95={varResult.var95} var99={varResult.var99} />
              </div>
            </div>
          </div>

          {/* Monte Carlo */}
          <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
            <h2 className="text-h2 font-semibold text-main">蒙地卡羅模擬（初始 100 萬）</h2>
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
                <ResultCard title="組合月報酬筆數" value={`${portMonthly.length} 筆`} />
              </div>
            </div>
          </div>

          {/* Hurst */}
          {hurstResult && (
            <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
              <div>
                <h2 className="text-h2 font-semibold text-main">Hurst 指數分析（組合）</h2>
                <p className="text-caption text-faint mt-0.5">使用{freqLabel}</p>
                {stocksLackingDaily.length > 0 && (
                  <p className="text-caption text-amber-700 mt-0.5">
                    降級月頻：{stocksLackingDaily.join('、')} 日報酬不足 252 筆
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ResultCard
                  title="Hurst H 值"
                  value={hurstResult.h.toFixed(4)}
                  color={hurstResult.h > 0.6 ? 'green' : hurstResult.h < 0.4 ? 'red' : 'blue'}
                  large
                />
                <ResultCard title="解讀" value={hurstResult.interpretation} />
                <ResultCard title="R（範圍）" value={hurstResult.r.toFixed(6)} />
                <ResultCard title="S（標準差）" value={hurstResult.s.toFixed(6)} />
              </div>
              <HurstLineChart
                cumDeviations={hurstResult.cumDeviations}
                subtitle={freqLabel}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Stock input section ── */}
      <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h2 font-semibold text-main">股票選取</h2>
          <div className="flex items-center gap-3">
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
    </div>
  )
}
