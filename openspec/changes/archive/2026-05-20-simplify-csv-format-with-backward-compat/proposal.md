## Why

手動輸入已簡化為 6 欄（代號 / 買入日 / 賣出日 / 買入金額 / 賣出金額 / 股數），但 CSV 上傳仍要求 11 欄（含 buy_price / sell_price / pnl / return_rate / stock_name 等）。

兩種輸入方式不一致：
- 手動：6 欄、自動推算
- CSV：11 欄、全部手填

使用者準備 CSV 時要算 pnl / return_rate / amount 等，麻煩且容易出錯（自己算可能有四捨五入）。

需要：
1. CSV 必填欄位減少為 6 欄（與手動一致）
2. 衍生欄位由解析器自動算
3. 舊版 11 欄 CSV 仍可讀（向下相容）

## What Changes

### CSV 必填欄位簡化為 6 欄

```csv
stock_id, buy_date, sell_date, buy_amount, sell_amount, shares
```

### 選填欄位（提供則用、未提供則自動算）

- `stock_name`：預設 = stock_id
- `buy_price`：預設 = buy_amount / shares
- `sell_price`：預設 = sell_amount / shares
- `pnl`：預設 = sell_amount − buy_amount
- `return_rate`：預設 = pnl / buy_amount
- `note`：預設 undefined

### 向下相容

- 既有 11/12 欄 CSV 不會失效
- header 自動偵測，缺欄位即用推算值
- 報酬率自動偵測（> 1 視為百分比格式，邏輯保留）

### 範例 CSV 更新

`EXAMPLE_CSV` 與 `public/example-trades.csv` 改為簡化版本：

```csv
stock_id,buy_date,sell_date,buy_amount,sell_amount,shares
2330,2025-03-15,2025-09-20,580500,720000,1000
2317,2025-04-01,2025-07-15,330000,317000,2000
0050,2025-01-10,2026-01-10,405000,444600,3000
```

但仍提供完整 12 欄範例給進階使用者參考。

### 範本下載按鈕

- 上傳區提供「下載範例 CSV」連結（已有）
- 連結指向簡化版本

## Capabilities

### Modified Capabilities

- `data-import-export`：CSV 必填欄位精簡 + 衍生欄位自動推算

## Impact

- **影響檔案**：
  - `src/lib/csv.ts`：parseTradesCSV 調整必填欄位 + 衍生欄位自動算
  - `src/lib/csv.test.ts`：補測試（簡化版 / 舊版 / 部分欄位）
  - `public/example-trades.csv`：精簡為 6 欄版本
  - `src/components/trade/TradeFileUpload.tsx`：說明文字更新
- **不影響**：
  - Trade 型別不變
  - 既有資料、其他元件
- **風險**：
  - 自動推算的 buy_price 可能與舊資料的 buy_price 有微小差異（四捨五入）— 但語義是「平均成交價」，可接受
  - 舊版 CSV 解析路徑要保留並測試
