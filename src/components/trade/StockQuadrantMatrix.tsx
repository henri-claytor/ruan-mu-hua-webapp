import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import QuadrantBadge from '../QuadrantBadge'
import QuadrantLegend from './QuadrantLegend'
import { fmtMoney, fmtPct } from '../../utils/format'
import type { StockStats, PerformanceQuadrant } from '../../lib/trade'
import { buildStockDiagSummary, type Diagnosis } from '../../lib/diagnosis'

const ALL_QUADRANTS: (PerformanceQuadrant | 'ALL')[] = [
  'ALL',
  'Q1: 打法好・結果好',
  'Q2: 打法差・結果好（靠重倉或勝率撐場）',
  'Q3: 打法好・結果差（資金管理需改善）',
  'Q4: 打法差・結果差（全面檢討）',
  '單向紀錄（全勝或全敗）',
]

const QUADRANT_FILTER_LABELS: Record<string, string> = {
  ALL: '全部',
  'Q1: 打法好・結果好': 'Q1 雙優',
  'Q2: 打法差・結果好（靠重倉或勝率撐場）': 'Q2 隱藏風險',
  'Q3: 打法好・結果差（資金管理需改善）': 'Q3 管理問題',
  'Q4: 打法差・結果差（全面檢討）': 'Q4 待檢討',
  '單向紀錄（全勝或全敗）': '單向紀錄',
}

type SortKey = 'totalPnl' | 'stockId' | 'nTrades' | 'winRate' | 'payoffRatio' | 'profitFactor' | 'pnlContribution'
type SortDir = 'asc' | 'desc'

interface Props {
  stocks: StockStats[]
  /** 外部傳入的 stockId 篩選；若有值則僅顯示該股，並可手動清除 */
  filterStockId?: string
  /** 矩陣表 anchor id（給 smooth scroll 用） */
  anchorId?: string
  /** 診斷結果：用於顯示每列的診斷標記 */
  diagnoses?: Diagnosis[]
}

// Diagnosis 用於 tooltip 補充資訊（主欄改為文字摘要）

// ── Progress bar 子元件 ──────────────────────────────────────────────────────

function ProgressBar({
  value,
  max,
  quadrant,
}: {
  value: number
  max: number
  quadrant: PerformanceQuadrant
}) {
  const fill = isFinite(value) ? Math.min(value / max, 1) : 1
  const colorMap: Record<PerformanceQuadrant, string> = {
    'Q1: 打法好・結果好': 'bg-green-500',
    'Q2: 打法差・結果好（靠重倉或勝率撐場）': 'bg-blue-400',
    'Q3: 打法好・結果差（資金管理需改善）': 'bg-amber-400',
    'Q4: 打法差・結果差（全面檢討）': 'bg-red-400',
    '單向紀錄（全勝或全敗）': 'bg-slate-400',
  }
  return (
    <div className="w-16 h-1.5 bg-base/40 rounded-full overflow-hidden inline-block align-middle">
      <div
        className={`h-full ${colorMap[quadrant]} transition-all`}
        style={{ width: `${fill * 100}%` }}
      />
    </div>
  )
}

// ── 主元件 ────────────────────────────────────────────────────────────────────

function pnlClass(n: number): string {
  if (n > 0) return 'text-red-700 font-semibold'
  if (n < 0) return 'text-green-700 font-semibold'
  return 'text-main'
}

function fmtRatio(n: number, digits = 2): string {
  if (!isFinite(n)) return '∞'
  return n.toFixed(digits)
}

export default function StockQuadrantMatrix({ stocks, filterStockId, anchorId, diagnoses = [] }: Props) {
  const [filter, setFilter] = useState<PerformanceQuadrant | 'ALL'>('ALL')
  const [stockFilterCleared, setStockFilterCleared] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('totalPnl')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // 當 filterStockId 變化時，重設清除狀態
  // 使用者每次從外部 navigate 進來都應該再次套用 filter
  // 用 useMemo 簡單監測 prop 變化
  const effectiveStockFilter = useMemo(
    () => (stockFilterCleared ? undefined : filterStockId),
    [filterStockId, stockFilterCleared],
  )

  // 找到對應的 stockName（給 chip 顯示）
  const filteredStock = useMemo(
    () => (effectiveStockFilter ? stocks.find((s) => s.stockId === effectiveStockFilter) : null),
    [stocks, effectiveStockFilter],
  )

  const filtered = useMemo(() => {
    let arr = stocks
    if (effectiveStockFilter) {
      arr = arr.filter((s) => s.stockId === effectiveStockFilter)
    }
    if (filter !== 'ALL') {
      arr = arr.filter((s) => s.quadrant === filter)
    }
    return arr
  }, [stocks, filter, effectiveStockFilter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let av: number | string
      let bv: number | string
      if (sortKey === 'totalPnl') {
        av = Math.abs(a.totalPnl)
        bv = Math.abs(b.totalPnl)
      } else if (sortKey === 'stockId') {
        av = a.stockId
        bv = b.stockId
      } else {
        av = a[sortKey]
        bv = b[sortKey]
        // Infinity 排到最大
        if (!isFinite(av as number)) av = Number.MAX_SAFE_INTEGER
        if (!isFinite(bv as number)) bv = Number.MAX_SAFE_INTEGER
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filtered, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  if (stocks.length === 0) return null

  // 找不到該 stockId 時的空態
  const stockFilterMissing = effectiveStockFilter && !filteredStock

  return (
    <div className="bg-surface rounded-2xl border border-base overflow-hidden" id={anchorId}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-base">
        <h2 className="font-serif text-h2 font-bold text-main tracking-wide">個股分析</h2>
        <p className="text-caption text-faint mt-0.5">
          賠率 × 獲利因子矩陣 · 共 {stocks.length} 檔個股
          {filter !== 'ALL' && (
            <span className="text-blue-700 ml-1">
              · 已篩選：{QUADRANT_FILTER_LABELS[filter]}（{filtered.length} 檔）
            </span>
          )}
        </p>
      </div>

      {/* 外部 stockId 篩選 chip */}
      {effectiveStockFilter && (
        <div className="px-6 py-3 border-b border-base bg-blue-50/40">
          {filteredStock ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-small font-medium">
              篩選：{filteredStock.stockId} {filteredStock.stockName}
              <button
                onClick={() => setStockFilterCleared(true)}
                className="hover:text-blue-900"
                title="清除篩選"
              >
                ✕
              </button>
            </span>
          ) : (
            <span className="text-small text-amber-700">
              未找到 {effectiveStockFilter} 的交易紀錄
              <button
                onClick={() => setStockFilterCleared(true)}
                className="text-blue-600 hover:underline ml-2"
              >
                ← 顯示全部
              </button>
            </span>
          )}
        </div>
      )}

      {/* 5 象限說明圖例 */}
      <QuadrantLegend />

      {/* 5 象限篩選 chips */}
      <div className="px-6 py-3 border-b border-base flex flex-wrap gap-2">
        {ALL_QUADRANTS.map((q) => {
          const active = filter === q
          const count = q === 'ALL' ? stocks.length : stocks.filter((s) => s.quadrant === q).length
          return (
            <button
              key={q}
              onClick={() => setFilter(q)}
              className={`px-3 py-1 rounded-full text-caption font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-surface'
                  : 'bg-elevated text-dim hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              {QUADRANT_FILTER_LABELS[q]} <span className="opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      {stockFilterMissing ? null : (
      <div className="overflow-x-auto">
        <table className="w-full text-small">
          <thead className="bg-elevated text-dim">
            <tr>
              <th className="px-3 py-2 text-left cursor-pointer hover:text-main" onClick={() => toggleSort('stockId')}>
                股票{arrow('stockId')}
              </th>
              <th className="px-3 py-2 text-left">分類</th>
              <th className="px-3 py-2 text-right cursor-pointer hover:text-main" onClick={() => toggleSort('nTrades')}>
                筆數{arrow('nTrades')}
              </th>
              <th className="px-3 py-2 text-right cursor-pointer hover:text-main" onClick={() => toggleSort('winRate')}>
                勝率{arrow('winRate')}
              </th>
              <th className="px-3 py-2 text-right cursor-pointer hover:text-main" onClick={() => toggleSort('payoffRatio')}>
                賠率{arrow('payoffRatio')}
              </th>
              <th className="px-3 py-2 text-right cursor-pointer hover:text-main" onClick={() => toggleSort('profitFactor')}>
                獲利因子{arrow('profitFactor')}
              </th>
              <th className="px-3 py-2 text-right cursor-pointer hover:text-main" onClick={() => toggleSort('totalPnl')}>
                總損益{arrow('totalPnl')}
              </th>
              <th className="px-3 py-2 text-right cursor-pointer hover:text-main" onClick={() => toggleSort('pnlContribution')}>
                貢獻度{arrow('pnlContribution')}
              </th>
              <th className="px-3 py-2 text-left">診斷摘要</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const sampleSmall = s.nTrades < 5
              const isUnidirectional = s.quadrant === '單向紀錄（全勝或全敗）'
              const summary = buildStockDiagSummary(s)
              const stockDiag = diagnoses.filter((d) => d.scope === 'stock' && d.stockId === s.stockId)
              const tooltip = stockDiag.length > 0
                ? stockDiag.map((d) => `${d.title}：${d.advice}`).join('\n')
                : undefined
              return (
                <tr key={s.stockId} className="border-t border-base hover:bg-elevated">
                  <td className="px-3 py-2">
                    <Link
                      to={`/individual?code=${s.stockId}`}
                      className="text-blue-600 hover:underline"
                    >
                      <span className="font-semibold">{s.stockId}</span>
                      <br />
                      <span className="text-caption">{s.stockName}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <QuadrantBadge quadrant={s.quadrant} compact />
                  </td>
                  <td
                    className={`px-3 py-2 text-right num ${sampleSmall ? 'text-faint' : 'text-main'}`}
                    title={sampleSmall ? '樣本較小，統計可信度有限' : undefined}
                  >
                    {s.nTrades}
                  </td>
                  <td className="px-3 py-2 text-right num text-main">
                    {(s.winRate * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-2 text-right num text-main whitespace-nowrap">
                    {isUnidirectional ? (
                      <span className="text-faint">—</span>
                    ) : (
                      <>
                        <span className="mr-2">{fmtRatio(s.payoffRatio)}</span>
                        <ProgressBar value={s.payoffRatio} max={3.0} quadrant={s.quadrant} />
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right num text-main whitespace-nowrap">
                    {isUnidirectional ? (
                      <span className="text-faint">—</span>
                    ) : (
                      <>
                        <span className="mr-2">{fmtRatio(s.profitFactor)}</span>
                        <ProgressBar value={s.profitFactor} max={4.0} quadrant={s.quadrant} />
                      </>
                    )}
                  </td>
                  <td className={`px-3 py-2 text-right num ${pnlClass(s.totalPnl)}`}>
                    {fmtMoney(s.totalPnl)}
                  </td>
                  <td className={`px-3 py-2 text-right num ${pnlClass(s.pnlContribution)}`}>
                    {fmtPct(s.pnlContribution)}
                  </td>
                  <td
                    className="px-3 py-2 text-caption text-dim max-w-xs"
                    title={tooltip}
                  >
                    {summary}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}
