import { useState, useCallback } from 'react'
import ResultCard from '../components/ResultCard'
import { calcEV } from '../lib/ev'
import { calcVaR } from '../lib/var'
import { runMonteCarlo } from '../lib/montecarlo'
import { calcPortfolioReturns } from '../lib/portfolio'
import { parseReturns } from '../lib/utils'
import FanChart from '../components/charts/FanChart'
import VarHistogram from '../components/charts/VarHistogram'

interface Stock {
  id: number
  name: string
  rawText: string
  weight: number
}

let nextId = 3

function fmt(n: number, digits = 2): string {
  return (n * 100).toFixed(digits) + '%'
}

function fmtWan(n: number): string {
  return (n / 10000).toFixed(1) + ' 萬'
}

export default function PortfolioPage() {
  const [stocks, setStocks] = useState<Stock[]>([
    { id: 1, name: '股票 A', rawText: '', weight: 50 },
    { id: 2, name: '股票 B', rawText: '', weight: 50 },
  ])

  function addStock() {
    if (stocks.length >= 10) return
    setStocks((prev) => [
      ...prev,
      { id: nextId++, name: `股票 ${String.fromCharCode(64 + prev.length + 1)}`, rawText: '', weight: 0 },
    ])
  }

  function removeStock(id: number) {
    if (stocks.length <= 2) return
    setStocks((prev) => prev.filter((s) => s.id !== id))
  }

  function updateStock(id: number, field: keyof Stock, value: string | number) {
    setStocks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  const totalWeight = stocks.reduce((a, s) => a + Number(s.weight), 0)
  const weightValid = Math.abs(totalWeight - 100) < 0.01

  const stockReturns = stocks.map((s) => parseReturns(s.rawText))
  const weights = stocks.map((s) => Number(s.weight) / 100)
  const hasData = stockReturns.every((r) => r.length >= 10)

  const portfolioReturns = useCallback(() => {
    if (!hasData || !weightValid) return []
    return calcPortfolioReturns(stockReturns, weights)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks, weightValid, hasData])

  const portReturns = portfolioReturns()
  const evResult = portReturns.length > 0 ? calcEV(portReturns) : null
  const varResult = portReturns.length > 0 ? calcVaR(portReturns) : null
  const mcResult = portReturns.length > 0 ? runMonteCarlo(portReturns, 100) : null

  const ready = hasData && weightValid && portReturns.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">投資組合分析</h1>
        <p className="text-gray-500 text-sm mt-1">
          輸入多支股票月報酬率與比重，計算加權組合 EV、VaR 與蒙地卡羅模擬
        </p>
      </div>

      {/* ── 頂部結果 ── */}
      {ready && evResult && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">加權組合期望值</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ResultCard
              title="組合 EV"
              value={fmt(evResult.ev)}
              color={evResult.ev >= 0 ? 'green' : 'red'}
              large
            />
            <ResultCard title="勝率" value={fmt(evResult.winRate)} color="green" />
            <ResultCard title="敗率" value={fmt(evResult.lossRate)} color="red" />
            <ResultCard
              title="實際賠率"
              value={evResult.actualOdds.toFixed(2)}
              subtitle="Avg Gain ÷ Avg Loss"
              color="blue"
            />
          </div>
        </div>
      )}

      {/* ── VaR ── */}
      {ready && varResult && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">風險值（VaR）</h2>
          <div className="flex flex-col md:flex-row gap-6">
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
              <VarHistogram
                returns={portReturns}
                var95={varResult.var95}
                var99={varResult.var99}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── 蒙地卡羅 ── */}
      {ready && mcResult && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">蒙地卡羅模擬（初始 100 萬）</h2>
          {/* P5/P50/P95 結果 */}
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { label: '1 年', data: mcResult.oneYear },
                { label: '3 年', data: mcResult.threeYear },
                { label: '5 年', data: mcResult.fiveYear },
              ] as const
            ).map(({ label, data }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">{label}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">P95</span>
                    <span>{fmtWan(data.p95)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600 font-medium">P50</span>
                    <span>{fmtWan(data.p50)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600 font-medium">P5</span>
                    <span>{fmtWan(data.p5)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 扇形圖 */}
          <FanChart paths={mcResult.allPathsMonthly} />

          {/* μ / σ 參數 */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
              模擬參數
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ResultCard title="μ（月均報酬）" value={fmt(mcResult.mu, 4)} />
              <ResultCard title="σ（月報酬標準差）" value={fmt(mcResult.sigma, 4)} />
              <ResultCard title="模擬路徑數" value="100 條" />
              <ResultCard title="組合月報酬筆數" value={`${portReturns.length} 筆`} />
            </div>
          </div>
        </div>
      )}

      {/* ── 股票輸入區塊 ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">股票數據輸入</h2>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-medium ${
                weightValid ? 'text-green-600' : 'text-red-500'
              }`}
            >
              比重合計：{totalWeight.toFixed(1)}%{' '}
              {!weightValid && `（差 ${(100 - totalWeight).toFixed(1)}%）`}
            </span>
            <button
              onClick={addStock}
              disabled={stocks.length >= 10}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg
                         hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + 新增股票
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {stocks.map((stock) => (
            <div key={stock.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="股票名稱"
                  value={stock.name}
                  onChange={(e) => updateStock(stock.id, 'name', e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">比重</label>
                  <input
                    type="number"
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50"
                    value={stock.weight}
                    onChange={(e) => updateStock(stock.id, 'weight', Number(e.target.value))}
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                <button
                  onClick={() => removeStock(stock.id)}
                  disabled={stocks.length <= 2}
                  className="text-red-400 hover:text-red-600 disabled:opacity-30
                             disabled:cursor-not-allowed text-lg leading-none"
                  title="刪除"
                >
                  ×
                </button>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  月報酬率（換行或逗號分隔）
                </label>
                <textarea
                  className="w-full h-28 px-3 py-2 border border-gray-300 rounded-lg text-xs
                             font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder={'0.0412\n-0.0231\n0.0587\n...'}
                  value={stock.rawText}
                  onChange={(e) => updateStock(stock.id, 'rawText', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-0.5">
                  已讀取：{parseReturns(stock.rawText).length} 筆
                </p>
              </div>
            </div>
          ))}
        </div>

        {!ready && (
          <p className="text-sm text-gray-400">
            所有股票輸入至少 10 筆數據，且比重合計為 100% 後，計算結果將自動顯示。
          </p>
        )}
      </div>
    </div>
  )
}
