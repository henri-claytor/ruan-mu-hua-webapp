## 1. 改寫 TradeInputTable

- [x] 1.1 簡化 `Draft` 介面為 6 個欄位（stockId / buyDate / sellDate / buyPrice / sellPrice / shares）
- [x] 1.2 簡化 `emptyDraft()` 對應
- [x] 1.3 移除 `autoCalc` 函式（自動算移到 submit）
- [x] 1.4 `handleSubmit` 內自動計算 buyAmount / sellAmount / pnl / returnRate
- [x] 1.5 stockName 留空時用 stockId
- [x] 1.6 移除 note 輸入（傳入 undefined）

## 2. 版面調整

- [x] 2.1 grid 改為 `grid-cols-2 md:grid-cols-7`（6 欄 + 1 按鈕單列）
- [x] 2.2 「+ 新增」按鈕改為 `btn btn-solid` 樣式（與全站一致）
- [x] 2.3 移除「清空」按鈕（手動清空意義不大）
- [x] 2.4 移除「自動算損益」按鈕（自動執行）

## 3. 驗證

- [x] 3.1 `npx tsc --noEmit` 通過
- [x] 3.2 `npx vitest run` 通過
- [x] 3.3 `npm run build` 通過
- [x] 3.4 瀏覽器確認績效頁手動輸入：
  - 桌機 6 欄 + 按鈕單列
  - 手機 2 欄 wrap
  - 輸入後自動計算金額與損益
  - 新增成功後欄位重置
- [x] 3.5 部署 Vercel
