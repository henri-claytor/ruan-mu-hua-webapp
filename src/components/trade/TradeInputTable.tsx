import { useState } from 'react'
import type { Trade } from '../../lib/trade'

interface Props {
  onAdd: (trade: Trade) => void
}

interface Draft {
  stockId: string
  buyDate: string
  sellDate: string
  buyPrice: string
  sellPrice: string
  shares: string
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyDraft = (): Draft => ({
  stockId: '',
  buyDate: today(),
  sellDate: today(),
  buyPrice: '',
  sellPrice: '',
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
    const bp = num(draft.buyPrice)
    const sp = num(draft.sellPrice)
    const sh = num(draft.shares)
    if (isNaN(bp) || bp <= 0) {
      setError('買入價必須是大於 0 的數字')
      return
    }
    if (isNaN(sp) || sp <= 0) {
      setError('賣出價必須是大於 0 的數字')
      return
    }
    if (isNaN(sh) || sh <= 0) {
      setError('股數必須是大於 0 的數字')
      return
    }

    const buyAmount = Math.round(bp * sh)
    const sellAmount = Math.round(sp * sh)
    const pnl = sellAmount - buyAmount
    const returnRate = buyAmount > 0 ? pnl / buyAmount : 0

    const trade: Trade = {
      id: makeId(),
      stockId: draft.stockId.trim(),
      stockName: draft.stockId.trim(),
      buyDate: draft.buyDate,
      sellDate: draft.sellDate,
      buyPrice: bp,
      sellPrice: sp,
      shares: Math.round(sh),
      buyAmount,
      sellAmount,
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
        <Field label="買入價" required>
          <input
            type="number"
            step="0.01"
            className="input-style"
            value={draft.buyPrice}
            onChange={(e) => update('buyPrice', e.target.value)}
            placeholder="100"
          />
        </Field>
        <Field label="賣出價" required>
          <input
            type="number"
            step="0.01"
            className="input-style"
            value={draft.sellPrice}
            onChange={(e) => update('sellPrice', e.target.value)}
            placeholder="110"
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
        金額、損益、報酬率將自動計算（買入價×股數）。如需含手續費等精確數據，可在下方「原始交易表格」編輯。
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
