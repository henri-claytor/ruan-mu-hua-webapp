# Design: CSV 簡化 + 向下相容

## Context

手動輸入已 6 欄、CSV 仍 11 欄。要對齊，並保留舊版 CSV 可讀的彈性。

## Goals / Non-Goals

**Goals:**
- CSV 必填欄位降為 6 欄（與手動一致）
- 衍生欄位自動推算（buy_price / sell_price / pnl / return_rate / stock_name）
- 舊版 11/12 欄 CSV 仍可讀
- 範例 CSV 改為簡化版

**Non-Goals:**
- 不改 Trade 型別
- 不改既有資料
- 不引入新欄位

## Decisions

### D1 — REQUIRED_HEADER 縮減為 6 個

```typescript
const REQUIRED_HEADER = [
  'stock_id',
  'buy_date',
  'sell_date',
  'buy_amount',
  'sell_amount',
  'shares',
]

// 選填（提供則用、未提供則自動算）
const OPTIONAL_FIELDS = [
  'stock_name',
  'buy_price',
  'sell_price',
  'pnl',
  'return_rate',
  'note',
]
```

`HEADER` 仍含 12 個（用於 formatTradesCSV 匯出時的完整 header）。

### D2 — 解析時自動推算缺欄位

```typescript
const idx = (col: string) => headers.indexOf(col)
const has = (col: string) => idx(col) >= 0

const stockId = cells[idx('stock_id')]?.trim() ?? ''
const buyDate = cells[idx('buy_date')]?.trim() ?? ''
const sellDate = cells[idx('sell_date')]?.trim() ?? ''
const buyAmount = parseNumber(cells[idx('buy_amount')] ?? '')
const sellAmount = parseNumber(cells[idx('sell_amount')] ?? '')
const shares = parseNumber(cells[idx('shares')] ?? '')

// 驗證必填
if (!stockId) { errors.push(...); continue }
// ... 其他驗證

// 選填欄位（有 → 用、沒有 → 自動算）
const stockName = has('stock_name') ? (cells[idx('stock_name')]?.trim() || stockId) : stockId

let buyPrice = has('buy_price') ? parseNumber(cells[idx('buy_price')] ?? '') : NaN
let sellPrice = has('sell_price') ? parseNumber(cells[idx('sell_price')] ?? '') : NaN
let pnl = has('pnl') ? parseNumber(cells[idx('pnl')] ?? '') : NaN
let returnRate = has('return_rate') ? parseNumber(cells[idx('return_rate')] ?? '') : NaN

// 自動推算（若未提供或無效）
if (isNaN(buyPrice)) buyPrice = buyAmount / shares
if (isNaN(sellPrice)) sellPrice = sellAmount / shares
if (isNaN(pnl)) pnl = sellAmount - buyAmount
if (isNaN(returnRate)) returnRate = buyAmount > 0 ? pnl / buyAmount : 0

// 報酬率自動偵測（保留）
if (Math.abs(returnRate) > 1) returnRate = returnRate / 100

const note = has('note') ? (cells[idx('note')]?.trim() || undefined) : undefined
```

### D3 — 範例 CSV 改為 6 欄

```csv
stock_id,buy_date,sell_date,buy_amount,sell_amount,shares
2330,2025-03-15,2025-09-20,580500,720000,1000
2317,2025-04-01,2025-07-15,330000,317000,2000
0050,2025-01-10,2026-01-10,405000,444600,3000
```

`EXAMPLE_CSV` 與 `public/example-trades.csv` 都改。

### D4 — formatTradesCSV 匯出維持完整 12 欄

匯出時為了讓資料無損保留，匯出格式仍含全部 12 欄。讀回來會 100% 對應。

### D5 — TradeFileUpload 提示文字

```
通用格式 6 欄（stock_id, buy_date, sell_date, buy_amount, sell_amount, shares）
進階使用者可額外帶 stock_name, buy_price, sell_price, pnl, return_rate, note
```

### D6 — 測試補充

- 簡化 6 欄 CSV：解析成功 + 自動推算欄位正確
- 完整 12 欄 CSV：解析成功 + 用提供值
- 混合 9 欄（含 stock_name + note，缺 price/pnl）：解析成功 + 自動推算
- 缺必填（如缺 buy_amount）：報錯

## Risks / Trade-offs

- **推算 vs 提供值**：若 CSV 提供的 pnl 與「sellAmount − buyAmount」不符（如有額外手續費調整），會用 CSV 提供值；若沒提供就推算
- **buy_price 推算誤差**：buy_amount / shares 是平均價，與券商實際成交均價可能有差（多筆同股累計成交時不同）
- **舊資料相容**：既有 trades 已含 buy_price 等，不受影響（只影響新匯入路徑）
