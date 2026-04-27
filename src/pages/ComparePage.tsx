import { parseReturns } from '../lib/utils'
import { calcEV, type EVResult } from '../lib/ev'
import { calcVaR, type VaRResult } from '../lib/var'
import { calcHurst, type HurstResult } from '../lib/hurst'
import { useAppStore } from '../store/useAppStore'

function fmt(n: number, digits = 2): string {
  return (n * 100).toFixed(digits) + '%'
}

interface StockResult {
  ev: EVResult | null
  var: VaRResult | null
  hurst: HurstResult | null
}

function calcStock(rawText: string): StockResult {
  const returns = parseReturns(rawText)
  if (returns.length < 10) return { ev: null, var: null, hurst: null }
  return {
    ev: calcEV(returns),
    var: calcVaR(returns),
    hurst: calcHurst(returns),
  }
}

type AdvantageMode = 'higher' | 'lower' | 'none'

function advantage(a: number | null, b: number | null, mode: AdvantageMode): { a: boolean; b: boolean } {
  if (a === null || b === null || mode === 'none') return { a: false, b: false }
  if (a === b) return { a: false, b: false }
  if (mode === 'higher') return { a: a > b, b: b > a }
  return { a: a < b, b: b < a } // 'lower' = smaller absolute = better (VaR)
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
      <td className={`px-4 py-3 text-small text-center font-semibold ${aWins ? 'bg-green-50 text-green-700' : 'text-main'}`}>
        {valA ?? '－ 待輸入'}
      </td>
      <td className={`px-4 py-3 text-small text-center font-semibold ${bWins ? 'bg-green-50 text-green-700' : 'text-main'}`}>
        {valB ?? '－ 待輸入'}
      </td>
    </tr>
  )
}

interface StockInputProps {
  label: string
  name: string
  rawText: string
  onNameChange: (v: string) => void
  onTextChange: (v: string) => void
}

function StockInput({ label, name, rawText, onNameChange, onTextChange }: StockInputProps) {
  const count = parseReturns(rawText).length
  return (
    <div className="bg-surface rounded-xl border border-base p-4 space-y-3">
      <div>
        <label className="block text-caption text-faint mb-1">{label}</label>
        <input
          className="w-full px-3 py-1.5 border border-base rounded-lg text-small text-main bg-surface
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="股票名稱"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-caption text-faint mb-1">月報酬率（換行/逗號/Tab/百分比）</label>
        <textarea
          className="w-full h-36 px-3 py-2 border border-base rounded-lg text-caption font-mono
                     text-main bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          placeholder="0.0412&#10;-0.0231&#10;3.12%&#10;..."
          value={rawText}
          onChange={(e) => onTextChange(e.target.value)}
        />
        <p className="text-caption text-faint mt-0.5">已讀取：{count} 筆{count < 10 && count > 0 ? '（需至少 10 筆）' : ''}</p>
      </div>
    </div>
  )
}

export default function ComparePage() {
  const compareA = useAppStore((s) => s.compareA)
  const compareB = useAppStore((s) => s.compareB)
  const setCompareA = useAppStore((s) => s.setCompareA)
  const setCompareB = useAppStore((s) => s.setCompareB)
  const clearCompare = useAppStore((s) => s.clearCompare)

  const resultA = calcStock(compareA.rawText)
  const resultB = calcStock(compareB.rawText)

  const hasAny = resultA.ev !== null || resultB.ev !== null

  // Advantage calculations
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

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 font-bold text-main">個股並排比較</h1>
          <p className="text-small text-dim mt-0.5">輸入兩支股票的月報酬率，並排比較 EV、VaR 與 Hurst 指數</p>
        </div>
        <button onClick={clearCompare} className="text-small text-red-500 hover:text-red-700 underline">
          清除資料
        </button>
      </div>

      {/* 輸入區：兩欄並排 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StockInput
          label="股票 A"
          name={compareA.name}
          rawText={compareA.rawText}
          onNameChange={(v) => setCompareA({ ...compareA, name: v })}
          onTextChange={(v) => setCompareA({ ...compareA, rawText: v })}
        />
        <StockInput
          label="股票 B"
          name={compareB.name}
          rawText={compareB.rawText}
          onNameChange={(v) => setCompareB({ ...compareB, name: v })}
          onTextChange={(v) => setCompareB({ ...compareB, rawText: v })}
        />
      </div>

      {/* 比較結果表格 */}
      {hasAny ? (
        <div className="bg-surface rounded-2xl border border-base overflow-hidden">
          <div className="px-4 py-3 border-b border-base bg-elevated">
            <p className="text-small text-faint">🟢 綠色背景 = 該項目較佳</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-elevated">
                <th className="px-4 py-3 text-left text-small text-dim font-semibold">指標</th>
                <th className="px-4 py-3 text-center text-small text-blue-700 font-semibold">{compareA.name}</th>
                <th className="px-4 py-3 text-center text-small text-blue-700 font-semibold">{compareB.name}</th>
              </tr>
            </thead>
            <tbody>
              <CompareRow
                label="期望值（EV）"
                valA={resultA.ev ? fmt(resultA.ev.ev) : null}
                valB={resultB.ev ? fmt(resultB.ev.ev) : null}
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
                label="VaR 95%（虧損少者優）"
                valA={resultA.var ? fmt(resultA.var.var95) : null}
                valB={resultB.var ? fmt(resultB.var.var95) : null}
                aWins={var95Adv.a}
                bWins={var95Adv.b}
              />
              <CompareRow
                label="VaR 99%（虧損少者優）"
                valA={resultA.var ? fmt(resultA.var.var99) : null}
                valB={resultB.var ? fmt(resultB.var.var99) : null}
                aWins={var99Adv.a}
                bWins={var99Adv.b}
              />
              {/* Hurst: 只顯示解讀，不做高亮 */}
              <tr className="border-t border-base">
                <td className="px-4 py-3 text-small text-dim font-medium">Hurst H 值</td>
                <td className="px-4 py-3 text-center text-small text-main">
                  {resultA.hurst
                    ? <span>{resultA.hurst.h.toFixed(3)}<br /><span className="text-caption text-dim">{resultA.hurst.interpretation}</span></span>
                    : '－ 待輸入'
                  }
                </td>
                <td className="px-4 py-3 text-center text-small text-main">
                  {resultB.hurst
                    ? <span>{resultB.hurst.h.toFixed(3)}<br /><span className="text-caption text-dim">{resultB.hurst.interpretation}</span></span>
                    : '－ 待輸入'
                  }
                </td>
              </tr>
              {/* 象限 */}
              <tr className="border-t border-base">
                <td className="px-4 py-3 text-small text-dim font-medium">象限判斷</td>
                <td className="px-4 py-3 text-center text-caption text-dim">
                  {resultA.ev?.quadrant ?? '－ 待輸入'}
                </td>
                <td className="px-4 py-3 text-center text-caption text-dim">
                  {resultB.ev?.quadrant ?? '－ 待輸入'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border-2 border-dashed border-base rounded-2xl p-8 text-center bg-elevated">
          <p className="text-dim text-body">請在上方輸入至少一支股票的月報酬率</p>
          <p className="text-faint text-small mt-1">輸入後比較表格將自動顯示</p>
        </div>
      )}
    </div>
  )
}
