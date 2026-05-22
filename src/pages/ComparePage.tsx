import { useEffect, useState } from 'react'
import StockSelector from '../components/StockSelector'
import { calcMultiScaleEV, type EVResult } from '../lib/ev'
import { calcVaR, type VaRResult } from '../lib/var'
import { calcHurst, type HurstResult } from '../lib/hurst'
import { fetchMonthlyReturns, fetchDailyReturns } from '../lib/api'
import { useAppStore, type CompareStock } from '../store/useAppStore'
import ActionGuide, { buildCompareGuide } from '../components/ActionGuide'
import { fmtPct, fmtWinRate, fmtRatio } from '../utils/format'

// ── Derived results per stock ─────────────────────────────────────────────────

interface StockResult {
  ev: EVResult | null
  /** EV 計算的時間尺度標籤（如「最近 1 年」/「最近 3 個月」/「最近 5 年」）*/
  evScaleLabel: string | null
  var: VaRResult | null
  hurst: HurstResult | null
  freqLabel: string
}

function calcResult(stock: CompareStock): StockResult {
  const { monthlyReturns, dailyReturns } = stock
  if (monthlyReturns.length < 10) {
    return { ev: null, evScaleLabel: null, var: null, hurst: null, freqLabel: '' }
  }

  // 多尺度 EV — 取 medium > short > long fallback（與個股頁主判斷一致）
  const multi = calcMultiScaleEV(monthlyReturns, dailyReturns)
  const primary = multi?.medium ?? multi?.short ?? multi?.long ?? null

  const useDaily = dailyReturns.length >= 252
  const returnsForRisk = useDaily ? dailyReturns : monthlyReturns
  const freqLabel = useDaily
    ? `日頻 ${dailyReturns.length} 筆`
    : `月頻 ${monthlyReturns.length} 筆`

  return {
    ev: primary?.ev ?? null,
    evScaleLabel: primary?.label ?? null,
    var: calcVaR(returnsForRisk),
    hurst: calcHurst(returnsForRisk),
    freqLabel,
  }
}

// ── Compare advantage helpers ─────────────────────────────────────────────────

type AdvantageMode = 'higher' | 'lower' | 'none'

function advantage(a: number | null, b: number | null, mode: AdvantageMode) {
  if (a === null || b === null || mode === 'none') return { a: false, b: false }
  if (a === b) return { a: false, b: false }
  if (mode === 'higher') return { a: a > b, b: b > a }
  return { a: a < b, b: b < a }
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
            <p className="text-amber-600">日頻不足 252 筆，趨勢強度 / 下行虧損將使用月頻</p>
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

  // 手動「開始比較」狀態：兩股 stocks/returns 變動會 reset
  const [computed, setComputed] = useState(false)
  useEffect(() => {
    setComputed(false)
  }, [compareA.stockCode, compareA.monthlyReturns, compareB.stockCode, compareB.monthlyReturns])

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
  const bothReady = resultA.ev !== null && resultB.ev !== null
  const isLoading = loadingA || loadingB

  function handleCompare() {
    if (!bothReady) return
    setComputed(true)
  }

  const compareButtonLabel = isLoading
    ? '載入中...'
    : computed
    ? '重新比較'
    : '開始比較'

  // 各指標勝出
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

  // 綜合勝出方統計
  const winsA = [evAdv.a, winAdv.a, oddsAdv.a, var95Adv.a, var99Adv.a, hurstAdv.a].filter(Boolean).length
  const winsB = [evAdv.b, winAdv.b, oddsAdv.b, var95Adv.b, var99Adv.b, hurstAdv.b].filter(Boolean).length
  const ties = 6 - winsA - winsB
  const verdictName = winsA > winsB ? labelA : winsB > winsA ? labelB : '平手'
  const hasVerdict = winsA !== winsB

  // 期望報酬率資料尺度 — A / B 不同時雙標
  const evScaleDisplay =
    resultA.evScaleLabel && resultB.evScaleLabel && resultA.evScaleLabel !== resultB.evScaleLabel
      ? `${resultA.evScaleLabel}（A）/ ${resultB.evScaleLabel}（B）`
      : resultA.evScaleLabel ?? resultB.evScaleLabel ?? '—'
  const verdictScaleLabel = resultA.evScaleLabel ?? resultB.evScaleLabel ?? '—'

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-h1 font-bold text-main tracking-wide">個股並排比較</h1>
          <p className="text-small text-dim mt-0.5">
            選取兩支股票，並排比較期望報酬率、下行虧損與趨勢強度
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

      {/* 開始比較按鈕 */}
      <div className="flex justify-end">
        <button
          onClick={handleCompare}
          disabled={!bothReady || isLoading}
          className="btn btn-solid"
        >
          {compareButtonLabel}
        </button>
      </div>

      {/* 空態 / 提示 */}
      {!computed && !bothReady && !isLoading && (
        <div className="border-2 border-dashed border-base rounded-2xl p-8 text-center bg-elevated">
          <p className="text-dim text-body">請在上方選取兩支股票</p>
          <p className="text-faint text-small mt-1">兩支股票選好後，按「開始比較」</p>
        </div>
      )}
      {!computed && bothReady && !isLoading && (
        <div className="border-2 border-dashed border-base rounded-2xl p-8 text-center bg-elevated">
          <p className="text-dim text-body">已選好兩支股票，按「開始比較」查看結果</p>
        </div>
      )}

      {/* ─ 計算結果 ─ */}
      {computed && bothReady && resultA.ev && resultB.ev && (
        <>
          {/* 1. 操作建議（金邊強化） */}
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

          {/* 2. 綜合勝出方主判斷卡 */}
          <div className="relative bg-[#f4ead8] border-2 border-[#c9a84c] rounded-lg px-6 py-5">
            <div className="absolute top-2.5 right-3.5">
              <span className="text-[10.5px] bg-gold-dark text-white px-2 py-0.5 rounded-full font-semibold">綜合勝出方</span>
            </div>
            <p className="text-[18px] font-bold text-main">整體推薦</p>
            <p className="text-[11px] text-dim mb-3">
              6 項指標統計 · 基於 <span className="font-semibold text-main">{verdictScaleLabel}</span> 表現
            </p>
            <p className={`font-serif text-[36px] font-bold leading-none ${hasVerdict ? 'text-red-700' : 'text-dim'}`}>
              {verdictName}
            </p>
            <p className="text-[11.5px] text-dim mt-3">
              {labelA} 勝 <span className="num font-semibold">{winsA}</span> 項 ·
              {' '}{labelB} 勝 <span className="num font-semibold">{winsB}</span> 項 ·
              {' '}平手 <span className="num font-semibold">{ties}</span> 項
            </p>
          </div>

          {/* 3. 比較表（cmp-table 樣式） */}
          <div className="bg-surface rounded-2xl border border-base overflow-hidden">
            <div className="px-4 py-3 border-b border-base bg-elevated space-y-1">
              <p className="text-small text-faint">🟢 綠色背景 = 該項目較佳</p>
              <p className="text-[11px] text-dim">
                <span className="font-semibold text-main">資料尺度</span> ·
                {' '}期望報酬率 / 勝率 / 損益比：<span className="font-semibold">{evScaleDisplay}</span>
                {' '}· 下行虧損 / 趨勢強度：<span className="font-semibold">A {resultA.freqLabel || '—'} / B {resultB.freqLabel || '—'}</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="cmp-table">
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>指標</th>
                    <th style={{ width: '35%' }}>{labelA}</th>
                    <th style={{ width: '35%' }}>{labelB}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="metric">期望報酬率</td>
                    <td className={`num red ${evAdv.a ? 'win' : ''}`}>{resultA.ev ? fmtPct(resultA.ev.ev) : '—'}</td>
                    <td className={`num red ${evAdv.b ? 'win' : ''}`}>{resultB.ev ? fmtPct(resultB.ev.ev) : '—'}</td>
                  </tr>
                  <tr>
                    <td className="metric">勝率</td>
                    <td className={`num ${winAdv.a ? 'win' : ''}`}>{resultA.ev ? fmtWinRate(resultA.ev.winRate) : '—'}</td>
                    <td className={`num ${winAdv.b ? 'win' : ''}`}>{resultB.ev ? fmtWinRate(resultB.ev.winRate) : '—'}</td>
                  </tr>
                  <tr>
                    <td className="metric">實際損益比</td>
                    <td className={`num ${oddsAdv.a ? 'win' : ''}`}>{resultA.ev ? fmtRatio(resultA.ev.actualOdds) : '—'}</td>
                    <td className={`num ${oddsAdv.b ? 'win' : ''}`}>{resultB.ev ? fmtRatio(resultB.ev.actualOdds) : '—'}</td>
                  </tr>
                  <tr>
                    <td className="metric">
                      95% 下行虧損（虧損少者優）
                      {(resultA.freqLabel || resultB.freqLabel) && (
                        <><br /><span className="text-caption text-faint font-normal">A:{resultA.freqLabel || '—'} / B:{resultB.freqLabel || '—'}</span></>
                      )}
                    </td>
                    <td className={`num grn ${var95Adv.a ? 'win' : ''}`}>{resultA.var ? fmtPct(resultA.var.var95) : '—'}</td>
                    <td className={`num grn ${var95Adv.b ? 'win' : ''}`}>{resultB.var ? fmtPct(resultB.var.var95) : '—'}</td>
                  </tr>
                  <tr>
                    <td className="metric">99% 下行虧損（虧損少者優）</td>
                    <td className={`num grn ${var99Adv.a ? 'win' : ''}`}>{resultA.var ? fmtPct(resultA.var.var99) : '—'}</td>
                    <td className={`num grn ${var99Adv.b ? 'win' : ''}`}>{resultB.var ? fmtPct(resultB.var.var99) : '—'}</td>
                  </tr>
                  <tr>
                    <td className="metric">趨勢強度 H</td>
                    <td className={`num ${hurstAdv.a ? 'win' : ''}`}>
                      {resultA.hurst ? fmtRatio(resultA.hurst.h) : '—'}
                      {resultA.hurst && <><br /><span className="text-caption text-dim font-normal">{resultA.hurst.interpretation}</span></>}
                    </td>
                    <td className={`num ${hurstAdv.b ? 'win' : ''}`}>
                      {resultB.hurst ? fmtRatio(resultB.hurst.h) : '—'}
                      {resultB.hurst && <><br /><span className="text-caption text-dim font-normal">{resultB.hurst.interpretation}</span></>}
                    </td>
                  </tr>
                  <tr>
                    <td className="metric">象限評級</td>
                    <td className="text-caption" style={{ color: 'var(--color-dim)' }}>{resultA.ev?.quadrant ?? '—'}</td>
                    <td className="text-caption" style={{ color: 'var(--color-dim)' }}>{resultB.ev?.quadrant ?? '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
