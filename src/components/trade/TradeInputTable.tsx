import { useState } from 'react'
import type { Trade } from '../../lib/trade'

interface Props {
  onAdd: (trade: Trade) => void
}

interface Draft {
  stockId: string
  stockName: string
  buyDate: string
  sellDate: string
  buyPrice: string
  sellPrice: string
  shares: string
  buyAmount: string
  sellAmount: string
  pnl: string
  returnRate: string
  note: string
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyDraft = (): Draft => ({
  stockId: '',
  stockName: '',
  buyDate: today(),
  sellDate: today(),
  buyPrice: '',
  sellPrice: '',
  shares: '',
  buyAmount: '',
  sellAmount: '',
  pnl: '',
  returnRate: '',
  note: '',
})

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function num(s: string): number {
  return parseFloat(s.replace(/[,$]/g, ''))
}

export default function TradeInputTable({ onAdd }: Props) {
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft({ ...draft, [key]: value })

    // 自動推算：填入價格與股數時自動算 amount / pnl / return rate
    if (key === 'buyPrice' || key === 'shares') {
      const bp = key === 'buyPrice' ? num(value as string) : num(draft.buyPrice)
      const sh = key === 'shares' ? num(value as string) : num(draft.shares)
      if (!isNaN(bp) && !isNaN(sh) && bp > 0 && sh > 0) {
        setDraft((d) => ({ ...d, buyAmount: String(Math.round(bp * sh)) }))
      }
    }
    if (key === 'sellPrice' || key === 'shares') {
      const sp = key === 'sellPrice' ? num(value as string) : num(draft.sellPrice)
      const sh = key === 'shares' ? num(value as string) : num(draft.shares)
      if (!isNaN(sp) && !isNaN(sh) && sp > 0 && sh > 0) {
        setDraft((d) => ({ ...d, sellAmount: String(Math.round(sp * sh)) }))
      }
    }
  }

  function autoCalc() {
    const ba = num(draft.buyAmount)
    const sa = num(draft.sellAmount)
    if (!isNaN(ba) && !isNaN(sa) && ba > 0) {
      const pnl = sa - ba
      const rr = pnl / ba
      setDraft((d) => ({ ...d, pnl: String(pnl), returnRate: rr.toFixed(4) }))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!draft.stockId.trim()) {
      setError('股票代號為必填')
      return
    }
    if (draft.sellDate < draft.buyDate) {
      setError('賣出日期不可早於買入日期')
      return
    }
    const numFields = ['buyPrice', 'sellPrice', 'shares', 'buyAmount', 'sellAmount', 'pnl', 'returnRate'] as const
    for (const k of numFields) {
      if (draft[k].trim() === '' || isNaN(num(draft[k]))) {
        setError(`${k} 為必填且必須是數字`)
        return
      }
    }

    const trade: Trade = {
      id: makeId(),
      stockId: draft.stockId.trim(),
      stockName: draft.stockName.trim() || draft.stockId.trim(),
      buyDate: draft.buyDate,
      sellDate: draft.sellDate,
      buyPrice: num(draft.buyPrice),
      sellPrice: num(draft.sellPrice),
      shares: Math.round(num(draft.shares)),
      buyAmount: num(draft.buyAmount),
      sellAmount: num(draft.sellAmount),
      pnl: num(draft.pnl),
      returnRate: num(draft.returnRate),
      note: draft.note.trim() || undefined,
    }
    onAdd(trade)
    setDraft(emptyDraft())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="股票代號" required>
          <input
            className="input-style"
            value={draft.stockId}
            onChange={(e) => update('stockId', e.target.value)}
            placeholder="2330"
          />
        </Field>
        <Field label="股票名稱">
          <input
            className="input-style"
            value={draft.stockName}
            onChange={(e) => update('stockName', e.target.value)}
            placeholder="台積電"
          />
        </Field>
        <Field label="買入日" required>
          <input
            type="date"
            className="input-style"
            value={draft.buyDate}
            onChange={(e) => update('buyDate', e.target.value)}
          />
        </Field>
        <Field label="賣出日" required>
          <input
            type="date"
            className="input-style"
            value={draft.sellDate}
            onChange={(e) => update('sellDate', e.target.value)}
          />
        </Field>

        <Field label="買入價" required>
          <input
            type="number"
            step="0.01"
            className="input-style"
            value={draft.buyPrice}
            onChange={(e) => update('buyPrice', e.target.value)}
          />
        </Field>
        <Field label="賣出價" required>
          <input
            type="number"
            step="0.01"
            className="input-style"
            value={draft.sellPrice}
            onChange={(e) => update('sellPrice', e.target.value)}
          />
        </Field>
        <Field label="股數" required>
          <input
            type="number"
            className="input-style"
            value={draft.shares}
            onChange={(e) => update('shares', e.target.value)}
          />
        </Field>
        <Field label=" ">
          <button
            type="button"
            onClick={autoCalc}
            className="px-3 py-2 bg-elevated border border-base rounded-lg text-small text-dim hover:text-main"
          >
            自動算損益
          </button>
        </Field>

        <Field label="買入價金（含費用）" required>
          <input
            type="number"
            className="input-style"
            value={draft.buyAmount}
            onChange={(e) => update('buyAmount', e.target.value)}
          />
        </Field>
        <Field label="賣出價金（扣除費用）" required>
          <input
            type="number"
            className="input-style"
            value={draft.sellAmount}
            onChange={(e) => update('sellAmount', e.target.value)}
          />
        </Field>
        <Field label="損益（元）" required>
          <input
            type="number"
            className="input-style"
            value={draft.pnl}
            onChange={(e) => update('pnl', e.target.value)}
          />
        </Field>
        <Field label="報酬率（小數）" required>
          <input
            type="number"
            step="0.0001"
            className="input-style"
            value={draft.returnRate}
            onChange={(e) => update('returnRate', e.target.value)}
            placeholder="0.0587"
          />
        </Field>

        <div className="col-span-2 md:col-span-4">
          <Field label="備註">
            <input
              className="input-style"
              value={draft.note}
              onChange={(e) => update('note', e.target.value)}
              placeholder="獲利了結、停損出場..."
            />
          </Field>
        </div>
      </div>

      {error && (
        <p className="text-small text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setDraft(emptyDraft())}
          className="px-3 py-1.5 bg-elevated border border-base rounded-lg text-small text-dim hover:text-main"
        >
          清空
        </button>
        <button
          type="submit"
          className="px-4 py-1.5 bg-blue-600 text-surface rounded-lg text-small hover:bg-blue-700"
        >
          + 新增交易
        </button>
      </div>

      <style>{`.input-style { display: block; width: 100%; padding: 0.4rem 0.6rem; border: 1px solid var(--color-base); border-radius: 0.5rem; font-size: 0.8125rem; }`}</style>
    </form>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-caption text-dim mb-0.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}
