import { useState, useMemo } from 'react'
import type { Trade } from '../../lib/trade'
import { daysBetween } from '../../lib/trade'
import { fmtMoney, fmtPct } from '../../utils/format'

interface Props {
  trades: Trade[]
  onUpdate: (id: string, patch: Partial<Trade>) => void
  onRemove: (id: string) => void
}

type SortKey = 'sellDate' | 'buyDate' | 'pnl' | 'returnRate' | 'stockId' | 'holdingDays'
type SortDir = 'asc' | 'desc'

function pnlColorClass(n: number): string {
  if (n > 0) return 'text-red-700 font-semibold'
  if (n < 0) return 'text-green-700 font-semibold'
  return 'text-main'
}

export default function RawTradeTable({ trades, onUpdate, onRemove }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('sellDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<Trade>>({})

  const sorted = useMemo(() => {
    const arr = [...trades]
    arr.sort((a, b) => {
      let av: string | number, bv: string | number
      if (sortKey === 'holdingDays') {
        av = daysBetween(a.buyDate, a.sellDate)
        bv = daysBetween(b.buyDate, b.sellDate)
      } else {
        av = a[sortKey] as string | number
        bv = b[sortKey] as string | number
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [trades, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function startEdit(t: Trade) {
    setEditingId(t.id)
    setEditDraft({ ...t })
  }

  function saveEdit() {
    if (!editingId) return
    onUpdate(editingId, editDraft)
    setEditingId(null)
    setEditDraft({})
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft({})
  }

  function handleRemove(t: Trade) {
    if (confirm(`確定刪除「${t.stockId} ${t.stockName}」這筆交易嗎？`)) {
      onRemove(t.id)
    }
  }

  if (trades.length === 0) return null

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div className="bg-surface rounded-2xl border border-base overflow-hidden">
      <div className="px-6 py-4 border-b border-base">
        <h2 className="font-serif text-h2 font-bold text-main tracking-wide">交易明細</h2>
        <p className="text-caption text-faint mt-0.5">共 {trades.length} 筆，可點擊欄位標題排序</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-small">
          <thead className="bg-elevated text-dim">
            <tr>
              <th className="px-3 py-2 text-left cursor-pointer hover:text-main" onClick={() => toggleSort('stockId')}>
                股票{arrow('stockId')}
              </th>
              <th className="px-3 py-2 text-left cursor-pointer hover:text-main" onClick={() => toggleSort('buyDate')}>
                買 → 賣{arrow('buyDate')}
              </th>
              <th className="px-3 py-2 text-right cursor-pointer hover:text-main" onClick={() => toggleSort('holdingDays')}>
                持有{arrow('holdingDays')}
              </th>
              <th className="px-3 py-2 text-right">買入價</th>
              <th className="px-3 py-2 text-right">賣出價</th>
              <th className="px-3 py-2 text-right">股數</th>
              <th className="px-3 py-2 text-right cursor-pointer hover:text-main" onClick={() => toggleSort('pnl')}>
                損益{arrow('pnl')}
              </th>
              <th className="px-3 py-2 text-right cursor-pointer hover:text-main" onClick={() => toggleSort('returnRate')}>
                報酬率{arrow('returnRate')}
              </th>
              <th className="px-3 py-2 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const isEditing = editingId === t.id
              const days = daysBetween(t.buyDate, t.sellDate)
              if (isEditing) {
                return (
                  <tr key={t.id} className="border-t border-base bg-blue-50/40">
                    <td className="px-3 py-2">
                      <input
                        className="w-16 px-1 border border-base rounded text-small"
                        value={editDraft.stockId ?? ''}
                        onChange={(e) => setEditDraft({ ...editDraft, stockId: e.target.value })}
                      />
                      <input
                        className="w-20 mt-1 px-1 border border-base rounded text-small"
                        value={editDraft.stockName ?? ''}
                        onChange={(e) => setEditDraft({ ...editDraft, stockName: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        className="px-1 border border-base rounded text-small"
                        value={editDraft.buyDate ?? ''}
                        onChange={(e) => setEditDraft({ ...editDraft, buyDate: e.target.value })}
                      />
                      <input
                        type="date"
                        className="mt-1 px-1 border border-base rounded text-small"
                        value={editDraft.sellDate ?? ''}
                        onChange={(e) => setEditDraft({ ...editDraft, sellDate: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-faint">—</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        className="w-20 px-1 border border-base rounded text-small text-right"
                        value={editDraft.buyPrice ?? 0}
                        onChange={(e) => setEditDraft({ ...editDraft, buyPrice: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        className="w-20 px-1 border border-base rounded text-small text-right"
                        value={editDraft.sellPrice ?? 0}
                        onChange={(e) => setEditDraft({ ...editDraft, sellPrice: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="w-20 px-1 border border-base rounded text-small text-right"
                        value={editDraft.shares ?? 0}
                        onChange={(e) => setEditDraft({ ...editDraft, shares: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="w-24 px-1 border border-base rounded text-small text-right"
                        value={editDraft.pnl ?? 0}
                        onChange={(e) => setEditDraft({ ...editDraft, pnl: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        step="0.0001"
                        className="w-20 px-1 border border-base rounded text-small text-right"
                        value={editDraft.returnRate ?? 0}
                        onChange={(e) => setEditDraft({ ...editDraft, returnRate: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <button onClick={saveEdit} className="text-blue-600 hover:underline mr-2">儲存</button>
                      <button onClick={cancelEdit} className="text-dim hover:underline">取消</button>
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={t.id} className="border-t border-base hover:bg-elevated">
                  <td className="px-3 py-2 text-main">
                    <span className="font-semibold">{t.stockId}</span>
                    <br />
                    <span className="text-caption text-dim">{t.stockName}</span>
                  </td>
                  <td className="px-3 py-2 text-dim num">
                    {t.buyDate}
                    <br />
                    {t.sellDate}
                  </td>
                  <td className="px-3 py-2 text-right num text-dim">{days} 天</td>
                  <td className="px-3 py-2 text-right num text-main">{t.buyPrice.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right num text-main">{t.sellPrice.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right num text-main">{t.shares.toLocaleString()}</td>
                  <td className={`px-3 py-2 text-right num ${pnlColorClass(t.pnl)}`}>{fmtMoney(t.pnl)}</td>
                  <td className={`px-3 py-2 text-right num ${pnlColorClass(t.returnRate)}`}>{fmtPct(t.returnRate)}</td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <button onClick={() => startEdit(t)} className="text-blue-600 hover:underline mr-2" title="編輯">
                      ✏️
                    </button>
                    <button onClick={() => handleRemove(t)} className="text-red-500 hover:underline" title="刪除">
                      🗑
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
