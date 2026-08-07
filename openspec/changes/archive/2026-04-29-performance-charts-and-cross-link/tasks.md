## 1. 圖表 utility

- [x] 1.1 在 `src/lib/trade.ts` 新增 `holdingDaysHistogram(trades): Bucket[]`，6 個固定分桶（0-7 / 8-14 / 15-30 / 31-60 / 61-90 / 90+），每桶 `{ bucket, wins, losses, avgWinReturn, avgLossReturn }`
- [x] 1.2 在 `src/lib/trade.test.ts` 新增 histogram 測試（空陣列、各桶分配正確、勝敗場分離正確）

## 2. 圖表元件

- [x] 2.1 新增 `src/components/charts/CumulativePnlChart.tsx`：Recharts AreaChart + 滾動高點 LineChart + ReferenceArea（最大回撤陰影）；副標顯示「最大回撤 −X 元（−Y.Y%）」
- [x] 2.2 新增 `src/components/charts/StockContributionBar.tsx`：水平 BarChart，依 |totalPnl| 排序，前 15 名 + 其餘聚合「其他」；正紅負綠
- [x] 2.3 新增 `src/components/charts/HoldingDaysDistribution.tsx`：6 桶 stacked BarChart，勝場紅 / 敗場綠

## 3. PerformanceCharts 容器

- [x] 3.1 新增 `src/components/trade/PerformanceCharts.tsx`：摺疊容器（預設展開），標題「績效視覺化」；累積曲線全寬 + 貢獻長條 / 持有分佈並排（grid-cols-1 md:grid-cols-2）
- [x] 3.2 trades.length < 5 時顯示「圖表參考度有限」提示
- [x] 3.3 在 `PerformancePage.tsx` 中、矩陣表後、原始表格前插入 `<PerformanceCharts trades={trades} />`

## 4. PerformancePage 支援 ?stock= query string

- [x] 4.1 PerformancePage 用 `useSearchParams` 讀 `?stock=`
- [x] 4.2 將 stockCode 傳給 `<StockQuadrantMatrix filterStockId={stockCode} />`
- [x] 4.3 mount 時 / stockCode 變更時若有值 → 自動 smooth scroll 到矩陣表 anchor
- [x] 4.4 找不到對應 stockId → 矩陣表內部顯示空態（由元件自身處理）

## 5. StockQuadrantMatrix 擴充

- [x] 5.1 新增 `filterStockId?: string` prop
- [x] 5.2 內部過濾邏輯：filterStockId + quadrant filter 同時生效（AND）
- [x] 5.3 過濾標籤 UI：「篩選：{stockId} {stockName} ✕」（藍色 chip）
- [x] 5.4 清除按鈕邏輯：使用 React state 控制本地清除，不修改 URL（讓父層決定是否同步）
- [x] 5.5 找不到對應 stockId 時的空態：「無此股票的交易紀錄」+ 「顯示全部」按鈕

## 6. 個股分析頁底部「我交易過這檔」摘要

- [x] 6.1 新增 `src/components/trade/MyTradeHistoryBlock.tsx`：接受 `stockCode` 與 `marketPayoff` props
- [x] 6.2 從 `useTradeStore` 過濾 trades，呼叫 `calcStockStats` 取得統計
- [x] 6.3 Filled 狀態：顯示交易筆數、勝率、總損益、Q1–Q4 徽章、市場 vs 我賠率對照、查看明細連結
- [x] 6.4 Empty 狀態：顯示「尚未記錄交易」+ 引導連結至 `/performance`
- [x] 6.5 市場 vs 我賠率對照解讀文字（差距門檻 0.2，三段式邏輯）
- [x] 6.6 evMulti === null 時對照欄改顯示「市場長期資料不足，無法對照」

## 7. IndividualPage 整合

- [x] 7.1 在 IndividualPage 的 ActionGuide 之後新增 `<MyTradeHistoryBlock stockCode={results.stockCode} marketPayoff={results.evMulti?.long.ev.actualOdds ?? null} />`
- [x] 7.2 摘要區塊在「無 results」時不顯示（與 ActionGuide 同條件）

## 8. 驗證

- [x] 8.1 `npx tsc --noEmit` 通過
- [x] 8.2 `npx vitest run` 全部通過（含新增 histogram 測試）
- [x] 8.3 `npm run build` 通過
- [x] 8.4 在瀏覽器確認：
  - PerformanceCharts 區塊在矩陣表後、原始表格前
  - 累積損益曲線顯示主曲線、滾動高點、最大回撤陰影
  - 個股貢獻長條依 |totalPnl| 排序、紅漲綠跌
  - 持有天數分佈 6 桶疊加勝敗場
  - 個股分析頁底部「我交易過這檔」顯示
  - 有交易時：市場 vs 我賠率對照 + 解讀文字依差距變化
  - 無交易時：空態 + 引導至績效分析
  - 從個股頁點「查看完整交易明細」→ 跳到 `/performance?stock=XXXX` → 矩陣表自動篩選 + 自動捲動
- [x] 8.5 部署到 Vercel
