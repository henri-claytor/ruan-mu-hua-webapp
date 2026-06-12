import { useState } from 'react'
import type { Trade } from '../../lib/trade'

interface Props {
  onAdd: (trade: Trade) => void
}

interface Draft {
  stockId: string
  buyDate: string
  sellDate: string
  buyAmount: string
  sellAmount: string
  shares: string
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyDraft = (): Draft => ({
  stockId: '',
  buyDate: today(),
  sellDate: today(),
  buyAmount: '',
  sellAmount: '',
  shares: '',
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
    setDraft((d) => ({ ...d, [key]: value }))
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
    const ba = num(draft.buyAmount)
    const sa = num(draft.sellAmount)
    const sh = num(draft.shares)
    if (isNaN(ba) || ba <= 0) {
      setError('買入金額必須是大於 0 的數字')
      return
    }
    if (isNaN(sa) || sa <= 0) {
      setError('賣出金額必須是大於 0 的數字')
      return
    }
    if (isNaN(sh) || sh <= 0) {
      setError('股數必須是大於 0 的數字')
      return
    }

    const shares = Math.round(sh)
    const buyPrice = ba / shares
    const sellPrice = sa / shares
    const pnl = sa - ba
    const returnRate = ba > 0 ? pnl / ba : 0

    const trade: Trade = {
      id: makeId(),
      stockId: draft.stockId.trim(),
      stockName: draft.stockId.trim(),
      buyDate: draft.buyDate,
      sellDate: draft.sellDate,
      buyPrice,
      sellPrice,
      shares,
      buyAmount: ba,
      sellAmount: sa,
      pnl,
      returnRate,
      note: undefined,
    }
    onAdd(trade)
    setDraft(emptyDraft())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end">
        <Field label="代號" required>
          <input
            className="input-style"
            value={draft.stockId}
            onChange={(e) => update('stockId', e.target.value)}
            placeholder="2330"
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
        <Field label="買入金額" required>
          <input
            type="number"
            step="1"
            className="input-style"
            value={draft.buyAmount}
            onChange={(e) => update('buyAmount', e.target.value)}
            placeholder="85000"
          />
        </Field>
        <Field label="賣出金額" required>
          <input
            type="number"
            step="1"
            className="input-style"
            value={draft.sellAmount}
            onChange={(e) => update('sellAmount', e.target.value)}
            placeholder="88000"
          />
        </Field>
        <Field label="股數" required>
          <input
            type="number"
            className="input-style"
            value={draft.shares}
            onChange={(e) => update('shares', e.target.value)}
            placeholder="1000"
          />
        </Field>
        <div className="col-span-2 md:col-span-1">
          <button type="submit" className="btn btn-solid w-full" style={{ height: '36px' }}>
            + 新增
          </button>
        </div>
      </div>

      {error && (
        <p className="text-small text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <p className="text-caption text-faint">
        請填入<span className="font-semibold text-dim">含手續費、證交稅後</span>的實際金額（對應券商對帳單）。
        損益 = 賣出金額 − 買入金額；平均成交價由金額/股數自動推算。
      </p>

      <style>{`.input-style { display: block; width: 100%; padding: 0.4rem 0.6rem; border: 1px solid var(--color-base); border-radius: 0.5rem; font-size: 0.8125rem; background: var(--color-surface); }`}</style>
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
