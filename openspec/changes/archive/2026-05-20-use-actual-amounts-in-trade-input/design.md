# Design: 手動輸入由「價」改為「金額」

## Context

券商對帳單顯示的是含費用後的成交金額。讓使用者直接輸入此金額，可避免手續費與證交稅的計算誤差。

## Goals / Non-Goals

**Goals:**
- 6 欄結構不變（代號 / 買入日 / 賣出日 / 買入金額 / 賣出金額 / 股數）
- 損益直接由金額相減，無誤差
- 平均價自動推算

**Non-Goals:**
- 不改 Trade 型別
- 不改 CSV 匯入
- 不引入手續費獨立欄位

## Decisions

### D1 — Draft 欄位語義改變

```typescript
interface Draft {
  stockId: string
  buyDate: string
  sellDate: string
  buyAmount: string     // 新：實際買入金額（含手續費）
  sellAmount: string    // 新：實際賣出金額（扣費用後）
  shares: string
}
```

舊版的 `buyPrice / sellPrice` 改為 `buyAmount / sellAmount`。

### D2 — Submit 時計算

```typescript
const ba = num(draft.buyAmount)
const sa = num(draft.sellAmount)
const sh = num(draft.shares)
const buyPrice = ba / sh
const sellPrice = sa / sh
const pnl = sa - ba
const returnRate = ba > 0 ? pnl / ba : 0

const trade: Trade = {
  ...
  buyPrice,
  sellPrice,
  shares: Math.round(sh),
  buyAmount: ba,
  sellAmount: sa,
  pnl,
  returnRate,
  ...
}
```

### D3 — UI 提示

- Label：「買入金額」「賣出金額」
- Placeholder：`85,000` `88,000`（顯示金額典型 5 位數）
- 下方說明文字：
  > 請填**含手續費、證交稅後**的實際金額（對應券商對帳單）。金額除以股數會自動推算平均成交價。

### D4 — 驗證

- 代號非空
- 賣出日 ≥ 買入日
- 買入金額 > 0
- 賣出金額 > 0
- 股數 > 0

允許 sellAmount < buyAmount（虧損交易）。

### D5 — Migration

1. 改 Draft 結構
2. 改 UI label 與 placeholder
3. 改 submit 計算邏輯
4. 改說明文字
5. 驗證 tsc / vitest / build

## Risks / Trade-offs

- **使用者習慣**：原本能直接抄價，現在要查金額
- **股數的精度**：若使用者不確定股數，金額/股數 會有偏差 — 但實際對帳單一定有股數，問題不大
- **CSV 仍是價 + 金額兩種**：CSV 匯入仍可填價×股數的金額（CSV 已有 12 欄），手動輸入只是另一條路徑
