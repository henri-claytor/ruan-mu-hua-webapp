## 1. 手動「開始比較」按鈕

- [x] 1.1 新增 `computed` state（預設 false）
- [x] 1.2 加 useEffect：兩股 stockCode 或 returns 變動 → reset `computed = false`
- [x] 1.3 在 StockPanel grid 之下加「開始比較」`btn-solid` 按鈕
- [x] 1.4 按鈕狀態：未準備 disabled / ready 「開始比較」/ 已計算「重新比較」/ loading「載入中...」
- [x] 1.5 結果區渲染條件改為 `computed && resultA.ev && resultB.ev`

## 2. ActionGuide 移到頂部

- [x] 2.1 將 ActionGuide block 從底部搬到結果區第一個（已有金邊強化版本）

## 3. 綜合勝出方主判斷卡

- [x] 3.1 計算 winsA / winsB（依 6 個 advantage 物件統計）
- [x] 3.2 渲染主判斷卡：金邊 + 「綜合勝出方」chip + 「整體推薦」+ 36px serif 名稱 + 「A 勝 N / B 勝 M / 平手 K」副值
- [x] 3.3 位置：ActionGuide 之後、比較表之前

## 4. 比較表 cmp-table 樣式

- [x] 4.1 表格 outer `<div>` 樣式套用 panel-like cream
- [x] 4.2 `<table>` 加 `className="cmp-table"`
- [x] 4.3 表頭採 cmp-table th 既有樣式（serif 11px、金色 letter-spacing）
- [x] 4.4 數值 cell 加 `num red` / `num green` 等
- [x] 4.5 勝出方 cell 加 `.win` class（自動綠底高亮）
- [x] 4.6 「綠色背景 = 該項目較佳」提示維持

## 5. 命名修正

- [x] 5.1 「期望值（EV）」→「期望報酬率」
- [x] 5.2 副標：「並排比較 EV、VaR 與 Hurst 指數」→「並排比較期望報酬率、下行虧損與趨勢強度」
- [x] 5.3 「象限判斷」→「象限評級」

## 6. 驗證

- [x] 6.1 `npx tsc --noEmit` 通過
- [x] 6.2 `npx vitest run` 通過
- [x] 6.3 `npm run build` 通過
- [x] 6.4 瀏覽器確認：
  - 選股不會自動 fetch / 顯示
  - 按按鈕後顯示結果
  - ActionGuide 在頂部
  - 綜合勝出方主判斷卡正確
  - 比較表 cmp-table 樣式
  - 命名一致
- [x] 6.5 部署 Vercel
