## 1. csv.ts 修改

- [x] 1.1 `REQUIRED_HEADER` 縮減為 6 欄
- [x] 1.2 parseTradesCSV 增加 `has(col)` 輔助
- [x] 1.3 stock_name / buy_price / sell_price / pnl / return_rate / note 改為「有則用、無則推算」
- [x] 1.4 推算邏輯：buy_price = buy_amount / shares 等
- [x] 1.5 報酬率 > 1 自動 /100 邏輯保留

## 2. EXAMPLE_CSV 改為簡化版

- [x] 2.1 src/lib/csv.ts 內 EXAMPLE_CSV 改為 6 欄
- [x] 2.2 public/example-trades.csv 同步改

## 3. csv.test.ts 補測試

- [x] 3.1 簡化 6 欄：解析成功 + 自動推算正確
- [x] 3.2 完整 12 欄：解析成功 + 用提供值
- [x] 3.3 混合（部分欄位）：解析成功 + 缺欄位自動算
- [x] 3.4 缺必填：回 error

## 4. TradeFileUpload 提示

- [x] 4.1 上傳區「通用格式 13 欄」說明改為「6 欄 + 進階選填」

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 通過
- [x] 5.2 `npx vitest run` 通過（含新 csv 測試）
- [x] 5.3 `npm run build` 通過
- [x] 5.4 瀏覽器確認：
  - 上傳簡化版 CSV 成功
  - 上傳完整 12 欄 CSV 仍成功
  - 範例 CSV 下載為簡化版
- [x] 5.5 部署 Vercel
