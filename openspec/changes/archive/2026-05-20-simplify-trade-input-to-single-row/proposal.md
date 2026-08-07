## Why

目前 TradeInputTable 有 12 個欄位（grid 2/4 cols），排成 3 行 + 備註，視覺笨重且輸入冗長。使用者反饋希望「橫一排不換行」。多數欄位可自動推算，無需手動輸入。

## What Changes

### 簡化為單列 6 欄

```
[代號*] [買入日*] [賣出日*] [買入價*] [賣出價*] [股數*] [+新增]
```

### 隱藏（自動推算）

- `buyAmount = buyPrice × shares`
- `sellAmount = sellPrice × shares`
- `pnl = sellAmount − buyAmount`
- `returnRate = pnl / buyAmount`

### 移除欄位

- 股票名稱：留空時用代號作為名稱
- 備註：可後續在 RawTradeTable 編輯
- 買入價金 / 賣出價金 / 損益 / 報酬率：全自動算

### 假設無手續費

- 簡化版本假設無手續費（誤差通常 < 0.5%）
- 若使用者需精確值，後續在 RawTradeTable 編輯損益欄位

### 橫向版面

- 改 `grid-cols-7`（6 欄 + 1 按鈕），桌機單列
- 手機（< md）：保留 2 欄 grid，欄位較少不會太擠

## Capabilities

### Modified Capabilities

- `data-import-export`：手動輸入表單簡化為 6 欄

## Impact

- **影響檔案**：
  - `src/components/trade/TradeInputTable.tsx`：簡化 Draft / Field 結構
- **不影響**：
  - Trade type 結構（仍含所有 12 個欄位，只是 UI 簡化）
  - calcPortfolioPerformance / diagnosis / recommendations
  - CSV 匯入 / RawTradeTable
  - tests
- **風險**：
  - 假設無手續費 → 損益略有誤差（通常可接受）
  - 進階使用者需透過 RawTradeTable 後續編輯
