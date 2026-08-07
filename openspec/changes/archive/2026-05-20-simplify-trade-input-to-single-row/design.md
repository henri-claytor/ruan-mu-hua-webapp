# Design: 手動輸入表單簡化

## Context

12 欄位的輸入表單視覺重，多數欄位可自動推算。簡化為 6 欄單列，提升輸入效率。

## Goals / Non-Goals

**Goals:**
- 6 欄輸入單列排開
- 自動推算 amount / pnl / returnRate
- Trade 物件仍含所有 12 個欄位（向後相容）

**Non-Goals:**
- 不改 Trade type
- 不改 CSV 匯入邏輯（CSV 仍可帶 12 欄）
- 不改 RawTradeTable（已可編輯）

## Decisions

### D1 — 簡化 Draft 結構

```typescript
interface Draft {
  stockId: string
  buyDate: string
  sellDate: string
  buyPrice: string
  sellPrice: string
  shares: string
}
```

從 12 欄位 → 6 欄位。

### D2 — Submit 時自動算其他

```typescript
function handleSubmit(e: React.FormEvent) {
  const bp = num(draft.buyPrice)
  const sp = num(draft.sellPrice)
  const sh = num(draft.shares)
  const buyAmount = Math.round(bp * sh)
  const sellAmount = Math.round(sp * sh)
  const pnl = sellAmount - buyAmount
  const returnRate = buyAmount > 0 ? pnl / buyAmount : 0

  const trade: Trade = {
    id: makeId(),
    stockId: draft.stockId.trim(),
    stockName: draft.stockId.trim(), // 用代號作為名稱
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
```

### D3 — 版面

桌機（md+）：`grid-cols-7`（6 欄 + 1 按鈕）
手機（< md）：`grid-cols-2`（自然 wrap）

每個欄位寬度由 grid 平均分配，輸入框 width 100%。

```tsx
<form onSubmit={handleSubmit} className="space-y-3">
  <div className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end">
    <Field label="代號" required>
      <input className="input-style" value={draft.stockId} onChange={...} placeholder="2330" />
    </Field>
    <Field label="買入日" required>
      <input type="date" className="input-style" ... />
    </Field>
    <Field label="賣出日" required>
      <input type="date" className="input-style" ... />
    </Field>
    <Field label="買入價" required>
      <input type="number" className="input-style" ... />
    </Field>
    <Field label="賣出價" required>
      <input type="number" className="input-style" ... />
    </Field>
    <Field label="股數" required>
      <input type="number" className="input-style" ... />
    </Field>
    <div>
      <button type="submit" className="btn btn-solid w-full">+ 新增</button>
    </div>
  </div>
</form>
```

### D4 — 驗證

保留現有驗證：
- 代號必填
- 賣出日不可早於買入日
- 數字欄位都必須是有效數字 + > 0

不再需要驗證 buyAmount / sellAmount / pnl / returnRate（自動算）。

### D5 — Migration

1. 改寫 TradeInputTable.tsx 整個 form
2. 確認 onAdd callback 介面不變
3. 驗證 tsc / vitest / build

## Risks / Trade-offs

- **失去進階輸入彈性**：使用者無法在新增時直接輸入 含費用的金額。但可後續在 RawTradeTable 編輯
- **無備註欄位**：較簡潔，但失去當下記錄「停損出場」等。可後續編輯
- **股票名稱 = 代號**：顯示時稍簡，後續可由 CSV 補充帶名稱資料
