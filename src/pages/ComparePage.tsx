import { useState } from 'react'
import StockSelector from '../components/StockSelector'
import { calcEV, type EVResult } from '../lib/ev'
import { calcVaR, type VaRResult } from '../lib/var'
import { calcHurst, type HurstResult } from '../lib/hurst'
import { fetchMonthlyReturns, fetchDailyReturns } from '../lib/api'
import { useAppStore, type CompareStock } from '../store/useAppStore'
import ActionGuide, { buildCompareGuide } from '../components/ActionGuide'
import { fmtPct } from '../utils/format'

function fmt(n: number, digits = 2): string {
  return (n * 100).toFixed(digits) + '%'
}

// ── Derived results per stock ─────────────────────────────────────────────────

interface StockResult {
  ev: EVResult | null
  var: VaRResult | null
  hurst: HurstResult | null
  freqLabel: string
}

function calcResult(stock: CompareStock): StockResult {
  const { monthlyReturns, dailyReturns } = stock
  if (monthlyReturns.length < 10) return { ev: null, var: null, hurst: null, freqLabel: '' }

  const useDaily = dailyReturns.length >= 252
  const returnsForRisk = useDaily ? dailyReturns : monthlyReturns
  const freqLabel = useDaily
    ? `日頻 ${dailyReturns.length} 筆`
    : `月頻 ${monthlyReturns.length} 筆`

  return {
    ev: calcEV(monthlyReturns),
    var: calcVaR(returnsForRisk),
    hurst: calcHurst(returnsForRisk),
    freqLabel,
  }
}

// ── Compare table helpers ─────────────────────────────────────────────────────

type AdvantageMode = 'higher' | 'lower' | 'none'

function advantage(a: number | null, b: number | null, mode: AdvantageMode) {
  if (a === null || b === null || mode === 'none') return { a: false, b: false }
  if (a === b) return { a: false, b: false }
  if (mode === 'higher') return { a: a > b, b: b > a }
  return { a: a < b, b: b < a }
}

interface CompareRowProps {
  label: string
  valA: string | null
  valB: string | null
  aWins: boolean
  bWins: boolean
}

function CompareRow({ label, valA, valB, aWins, bWins }: CompareRowProps) {
  return (
    <tr className="border-t border-base">
      <td className="px-4 py-3 text-small text-dim font-medium whitespace-nowrap">{label}</td>
      <td
        className={`px-4 py-3 text-small text-center font-semibold ${
          aWins ? 'bg-green-50 text-green-700' : 'text-main'
        }`}
      >
        {valA != null ? <span className="num">{valA}</span> : '－ 尚未選取'}
      </td>
      <td
        className={`px-4 py-3 text-small text-center font-semibold ${
          bWins ? 'bg-green-50 text-green-700' : 'text-main'
        }`}
      >
        {valB != null ? <span className="num">{valB}</span> : '－ 尚未選取'}
      </td>
    </tr>
  )
}

// ── Stock input panel ─────────────────────────────────────────────────────────

interface StockPanelProps {
  label: string
  stock: CompareStock
  loading: boolean
  onSelect: (code: string, name: string) => void
}

function StockPanel({ label, stock, loading, onSelect }: StockPanelProps) {
  return (
    <div className="bg-surface rounded-xl border border-base p-4 space-y-3">
      <label className="block text-caption text-faint font-medium">{label}</label>
      <StockSelector value={stock.stockCode} onChange={onSelect} />
      {loading && (
        <p className="text-caption text-blue-600 animate-pulse">⟳ 正在載入報酬數據...</p>
      )}
      {!loading && stock.stockCode && (
        <div className="text-caption text-faint space-y-0.5">
          <p>月報酬：{stock.monthlyReturns.length} 筆 ／ 日報酬：{stock.dailyReturns.length} 筆</p>
          {stock.dailyReturns.length > 0 && stock.dailyReturns.length < 252 && (
            <p className="text-amber-600">日頻不足 252 筆，Hurst / VaR 將使用月頻</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ComparePage() {
  const compareA = useAppStore((s) => s.compareA)
  const compareB = useAppStore((s) => s.compareB)
  const setCompareA = useAppStore((s) => s.setCompareA)
  const setCompareB = useAppStore((s) => s.setCompareB)
  const clearCompare = useAppStore((s) => s.clearCompare)

  const [loadingA, setLoadingA] = useState(false)
  const [loadingB, setLoadingB] = useState(false)

  async function handleSelectA(code: string, name: string) {
    setCompareA({ stockCode: code, name, monthlyReturns: [], dailyReturns: [] })
    setLoadingA(true)
    try {
      const [monthly, daily] = await Promise.all([
        fetchMonthlyReturns(code),
        fetchDailyReturns(code).catch(() => [] as number[]),
      ])
      setCompareA({ stockCode: code, name, monthlyReturns: monthly, dailyReturns: daily })
    } catch (err) {
      console.error('Failed to fetch compare A:', err)
    } finally {
      setLoadingA(false)
    }
  }

  async function handleSelectB(code: string, name: string) {
    setCompareB({ stockCode: code, name, monthlyReturns: [], dailyReturns: [] })
    setLoadingB(true)
    try {
      const [monthly, daily] = await Promise.all([
        fetchMonthlyReturns(code),
        fetchDailyReturns(code).catch(() => [] as number[]),
      ])
      setCompareB({ stockCode: code, name, monthlyReturns: monthly, dailyReturns: daily })
    } catch (err) {
      console.error('Failed to fetch compare B:', err)
    } finally {
      setLoadingB(false)
    }
  }

  const resultA = calcResult(compareA)
  const resultB = calcResult(compareB)
  const hasAny = resultA.ev !== null || resultB.ev !== null

  const evAdv = advantage(resultA.ev?.ev ?? null, resultB.ev?.ev ?? null, 'higher')
  const winAdv = advantage(resultA.ev?.winRate ?? null, resultB.ev?.winRate ?? null, 'higher')
  const oddsAdv = advantage(resultA.ev?.actualOdds ?? null, resultB.ev?.actualOdds ?? null, 'higher')
  const var95Adv = advantage(
    resultA.var ? Math.abs(resultA.var.var95) : null,
    resultB.var ? Math.abs(resultB.var.var95) : null,
    'lower'
  )
  const var99Adv = advantage(
    resultA.var ? Math.abs(resultA.var.var99) : null,
    resultB.var ? Math.abs(resultB.var.var99) : null,
    'lower'
  )
  const hurstAdv = advantage(
    resultA.hurst?.h ?? null,
    resultB.hurst?.h ?? null,
    'higher'
  )

  const labelA = compareA.stockCode
    ? `${compareA.stockCode} ${compareA.name}`
    : '股票 A'
  const labelB = compareB.stockCode
    ? `${compareB.stockCode} ${compareB.name}`
    : '股票 B'

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 font-bold text-main">個股並排比較</h1>
          <p className="text-small text-dim mt-0.5">
            選取兩支股票，並排比較 EV、VaR 與 Hurst 指數
          </p>
        </div>
        <button onClick={clearCompare} className="text-small text-red-500 hover:text-red-700 underline">
          清除資料
        </button>
      </div>

      {/* Input panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StockPanel
          label="股票 A"
          stock={compareA}
          loading={loadingA}
          onSelect={handleSelectA}
        />
        <StockPanel
          label="股票 B"
          stock={compareB}
          loading={loadingB}
          onSelect={handleSelectB}
        />
      </div>

      {/* Comparison table */}
      {hasAny ? (
        <div className="bg-surface rounded-2xl border border-base overflow-hidden">
          <div className="px-4 py-3 border-b border-base bg-elevated">
            <p className="text-small text-faint">🟢 綠色背景 = 該項目較佳</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-elevated">
                <th className="px-4 py-3 text-left text-small text-dim font-semibold">指標</th>
                <th className="px-4 py-3 text-center text-small text-blue-700 font-semibold">{labelA}</th>
                <th className="px-4 py-3 text-center text-small text-blue-700 font-semibold">{labelB}</th>
              </tr>
            </thead>
            <tbody>
              <CompareRow
                label="期望值（EV）"
                valA={resultA.ev ? fmtPct(resultA.ev.ev) : null}
                valB={resultB.ev ? fmtPct(resultB.ev.ev) : null}
                aWins={evAdv.a}
                bWins={evAdv.b}
              />
              <CompareRow
                label="勝率"
                valA={resultA.ev ? fmt(resultA.ev.winRate) : null}
                valB={resultB.ev ? fmt(resultB.ev.winRate) : null}
                aWins={winAdv.a}
                bWins={winAdv.b}
              />
              <CompareRow
                label="實際賠率"
                valA={resultA.ev ? resultA.ev.actualOdds.toFixed(2) : null}
                valB={resultB.ev ? resultB.ev.actualOdds.toFixed(2) : null}
                aWins={oddsAdv.a}
                bWins={oddsAdv.b}
              />
              <CompareRow
                label={`VaR 95%（虧損少者優）${resultA.freqLabel || resultB.freqLabel ? ` — A:${resultA.freqLabel || '—'} / B:${resultB.freqLabel || '—'}` : ''}`}
                valA={resultA.var ? fmtPct(resultA.var.var95) : null}
                valB={resultB.var ? fmtPct(resultB.var.var95) : null}
                aWins={var95Adv.a}
                bWins={var95Adv.b}
              />
              <CompareRow
                label="VaR 99%（虧損少者優）"
                valA={resultA.var ? fmtPct(resultA.var.var99) : null}
                valB={resultB.var ? fmtPct(resultB.var.var99) : null}
                aWins={var99Adv.a}
                bWins={var99Adv.b}
              />
              <tr className="border-t border-base">
                <td className="px-4 py-3 text-small text-dim font-medium">
                  Hurst H 值
                  <br />
                  <span className="text-caption text-faint font-normal">
                    {resultA.freqLabel && `A:${resultA.freqLabel}`}
                    {resultA.freqLabel && resultB.freqLabel && ' / '}
                    {resultB.freqLabel && `B:${resultB.freqLabel}`}
                  </span>
                </td>
                <td className={`px-4 py-3 text-small text-center ${hurstAdv.a ? 'bg-green-50 text-green-700' : 'text-main'}`}>
                  {resultA.hurst ? (
                    <span>
                      {resultA.hurst.h.toFixed(3)}
                      <br />
                      <span className="text-caption text-dim">{resultA.hurst.interpretation}</span>
                    </span>
                  ) : '－ 尚未選取'}
                </td>
                <td className={`px-4 py-3 text-small text-center ${hurstAdv.b ? 'bg-green-50 text-green-700' : 'text-main'}`}>
                  {resultB.hurst ? (
                    <span>
                      {resultB.hurst.h.toFixed(3)}
                      <br />
                      <span className="text-caption text-dim">{resultB.hurst.interpretation}</span>
                    </span>
                  ) : '－ 尚未選取'}
                </td>
              </tr>
              <tr className="border-t border-base">
                <td className="px-4 py-3 text-small text-dim font-medium">象限判斷</td>
                <td className="px-4 py-3 text-center text-caption text-dim">
                  {resultA.ev?.quadrant ?? '－ 尚未選取'}
                </td>
                <td className="px-4 py-3 text-center text-caption text-dim">
                  {resultB.ev?.quadrant ?? '－ 尚未選取'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border-2 border-dashed border-base rounded-2xl p-8 text-center bg-elevated">
          <p className="text-dim text-body">請在上方選取至少一支股票</p>
          <p className="text-faint text-small mt-1">選取後比較表格將自動顯示</p>
        </div>
      )}

      {/* 建議行動：兩股都有完整資料時才顯示 */}
      {resultA.ev && resultB.ev && (
        <ActionGuide
          items={buildCompareGuide({
            evA: resultA.ev.ev,
            evB: resultB.ev.ev,
            varA: resultA.var?.var95 ?? null,
            varB: resultB.var?.var95 ?? null,
            hurstA: resultA.hurst?.h ?? null,
            hurstB: resultB.hurst?.h ?? null,
            nameA: labelA,
            nameB: labelB,
          })}
        />
      )}
    </div>
  )
}
