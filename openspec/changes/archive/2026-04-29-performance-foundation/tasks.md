## 1. 資料模型與 Store

- [x] 1.1 在 `src/lib/trade.ts` 新增 `Trade` 介面（13 欄位 + 選填 note）
- [x] 1.2 在 `src/lib/trade.ts` 新增 `PortfolioPerformance` 介面（含 4 象限 quadrant 欄位）
- [x] 1.3 在 `src/lib/trade.ts` 新增 `PerformanceQuadrant` 型別（4 種分類）
- [x] 1.4 新增 `src/store/useTradeStore.ts`：zustand store + persist (`name: 'rmh-trades-v1'`)，提供 `addTrade / updateTrade / removeTrade / importTrades / clearAll`

## 2. 核心指標計算

- [x] 2.1 在 `src/lib/trade.ts` 實作 `daysBetween(buyDate, sellDate): number`
- [x] 2.2 實作 `calcPortfolioPerformance(trades): PortfolioPerformance | null`，含全部欄位計算（勝率、賠率、獲利因子、期望值、最大回撤、年化、持有期間、4 象限）
- [x] 2.3 實作 `classifyPerformanceQuadrant(payoff, profitFactor): PerformanceQuadrant`，門檻 `payoff>=1.5` × `profitFactor>=2.0`
- [x] 2.4 處理邊界值：空陣列 → null、全勝 → Infinity、累積高點為 0 → maxDrawdownPct = 0
- [x] 2.5 新增 `src/lib/trade.test.ts`：單元測試涵蓋
  - 勝率與筆數計數
  - 賠率（含全勝邊界）
  - 獲利因子（含全勝邊界）
  - 期望值
  - 最大回撤（手算 case）
  - 年化報酬率（已知資料對照）
  - 4 象限分類四個 case + Infinity 處理
  - 空陣列回傳 null

## 3. CSV 解析 utility

- [x] 3.1 新增 `src/lib/csv.ts`：`parseTradesCSV(text): { trades: Trade[]; errors: string[] }`
- [x] 3.2 解析 header 與欄位映射（`stock_id` → `stockId` 等）
- [x] 3.3 日期格式驗證（嚴格 `YYYY-MM-DD`）、數值欄位驗證
- [x] 3.4 報酬率自動偵測（>1 視為百分比、否則視為小數）
- [x] 3.5 註解行（`#` 開頭）與空白行跳過
- [x] 3.6 新增 `formatTradesCSV(trades): string` 用於匯出
- [x] 3.7 新增 `src/lib/csv.test.ts`：測試解析 / 格式化 / 錯誤訊息

## 4. UI 元件（src/components/trade/）

- [x] 4.1 新增 `PortfolioPerformanceBlock.tsx`：Hero 列（總損益 + 4 象限徽章 + 整體報酬率 / 年化）+ 中層卡片 5 張 + 弱化 inline 行 + 計算依據 disclosure
- [x] 4.2 新增 `RawTradeTable.tsx`：表格欄位（股票 / 買賣日 / 持有 / 價格 / 股數 / 損益 / 報酬率 / 操作）、預設 sellDate 倒序、欄位點擊排序、行內編輯與刪除
- [x] 4.3 新增 `TradeInputTable.tsx`：手動表格新增 / 編輯，即時驗證 `sellDate >= buyDate` / 數值非負
- [x] 4.4 新增 `TradeFileUpload.tsx`：拖放或選檔 → 預覽前 5 筆 → 確認匯入；錯誤訊息含行號 / 欄位
- [x] 4.5 新增 `PrivacyBanner.tsx`（或 inline）：「💾 交易資料僅儲存於本機瀏覽器」+「清除全部」按鈕（含確認對話框）

## 5. 共用元件擴充

- [x] 5.1 `QuadrantBadge.tsx`：擴充支援新 `PerformanceQuadrant` 型別（4 個 Q1–Q4 標籤對應 icon）；使用 union 型別參數或新增 `PerformanceQuadrantBadge` 變體
- [x] 5.2 `icons.tsx`：新增 `ClipboardCheck` 圖標（剪貼板打勾）作為「績效分析」NavBar 圖示

## 6. 頁面整合

- [x] 6.1 新增 `src/pages/PerformancePage.tsx`：標題 → 隱私 banner → 資料輸入區（Tab：手動 / CSV，預設展開或摺疊依 trades.length）→ Dashboard → 原始交易表格
- [x] 6.2 空態：trades.length === 0 時顯示「尚無交易資料，立即新增第一筆」+ 範例 CSV 下載連結
- [x] 6.3 範例 CSV：在 `public/example-trades.csv` 放 3 筆示範資料
- [x] 6.4 `App.tsx`：新增 `/performance` 路由
- [x] 6.5 `NavBar.tsx`：新增第 5 個項目「績效分析」+ ClipboardCheck 圖示，桌機 sidebar 與手機底部 tab 都加入

## 7. 報酬率 / 金額顯示慣例

- [x] 7.1 在 `src/utils/format.ts` 新增 `fmtMoney(n: number, withSign = true): string`：千分位 + 強制正負號（`+139,500 元` / `−5,200 元` / `0 元`）
- [x] 7.2 確保所有報酬率欄位用 `fmtPct` + `colorByReturn`、所有金額損益用 `fmtMoney` + `colorByReturn`

## 8. 驗證

- [x] 8.1 `npx tsc --noEmit` 通過
- [x] 8.2 `npx vitest run` 全部通過（含新增 trade.test.ts、csv.test.ts、format.test.ts 擴充）
- [x] 8.3 在瀏覽器確認：
  - NavBar 第 5 個項目「績效分析」桌機與手機都正常
  - 空態顯示與範例 CSV 下載正常
  - 手動輸入新增 → 立即顯示在 Dashboard 與原始表格
  - CSV 上傳 → 預覽 → 確認 → 顯示
  - 編輯 / 刪除單筆 → Dashboard 立即更新
  - 隱私 banner 顯示、清除全部 → 確認對話框 → 清空
  - 報酬率紅漲綠跌 + `+/−` 號顯示
  - 4 象限徽章顯示 Q1/Q2/Q3/Q4 標籤
- [x] 8.4 部署到 Vercel
