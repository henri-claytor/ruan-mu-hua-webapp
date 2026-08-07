## 1. 個股統計計算

- [x] 1.1 在 `src/lib/trade.ts` 新增 `StockStats` 介面（含 stockId、stockName、nTrades、勝率、賠率、獲利因子、totalPnl、pnlContribution、avgHoldingDays、quadrant 等）
- [x] 1.2 實作 `calcStockStats(trades, stockId, totalPortfolioPnl): StockStats | null`
- [x] 1.3 實作 `calcAllStockStats(trades): StockStats[]`：取所有 unique stockId、對每個算 stats、回傳依 `|totalPnl|` 降序排列
- [x] 1.4 處理邊界：空陣列、全勝（payoff/PF Infinity）、全敗、totalPortfolioPnl === 0
- [x] 1.5 在 `src/lib/trade.test.ts` 新增測試：
  - 多檔個股聚合計算正確
  - pnlContribution 計算（含正負組合損益場景）
  - 全勝個股 quadrant = Q1
  - 全敗個股 quadrant = Q4
  - 排序為 |totalPnl| desc
  - 空陣列回傳 []

## 2. UI 元件

- [x] 2.1 `QuadrantBadge`：新增 `compact?: boolean` prop；compact 模式對 PerformanceQuadrant 顯示簡短標籤（Q1 雙優 / Q2 隱藏風險 / Q3 管理問題 / Q4 待檢討），hover tooltip 顯示完整標籤
- [x] 2.2 新增 `src/components/trade/StockQuadrantMatrix.tsx`：
  - 篩選 chips（全部 / Q1–Q4）
  - 表格欄位（股票連結、4 象限徽章 compact、筆數、勝率、賠率含進度條、獲利因子含進度條、總損益、貢獻度）
  - 預設排序 |totalPnl| desc
  - 欄位點擊切換排序
  - 樣本不足（< 5 筆）淡灰色提示
  - 損益 / 貢獻度紅漲綠跌 + `+/−` 號
- [x] 2.3 進度條子元件（賠率最大 3.0、獲利因子最大 4.0，依四象限配色）

## 3. 頁面整合

- [x] 3.1 `PerformancePage.tsx`：在 Dashboard 與 RawTradeTable 之間插入 `<StockQuadrantMatrix>`，傳入 `calcAllStockStats(trades)`
- [x] 3.2 矩陣表的股票欄位用 `<Link to={`/individual?code=${stockId}`}>...</Link>` 包覆

## 4. 個股分析頁支援深度連結

- [x] 4.1 `IndividualPage.tsx`：用 `useSearchParams` 讀 `?code=`
- [x] 4.2 mount 時或 code 變更時，若 code 與目前 `individualStockCode` 不同 → 自動觸發 `handleSelect(code, '')`
- [x] 4.3 確認既有 StockSelector 手動選股仍正常（不衝突）

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 通過
- [x] 5.2 `npx vitest run` 全部通過（含新增 stock stats 測試）
- [x] 5.3 `npm run build` 通過
- [x] 5.4 在瀏覽器確認：
  - 矩陣表顯示在 Dashboard 與原始表格之間
  - 4 象限篩選 chips 切換正常
  - 欄位點擊排序正常
  - 進度條視覺與顏色對應 4 象限
  - 樣本 < 5 筆的個股顯示淡灰色提示
  - 點擊股票名稱跳到個股分析頁，自動載入該股
  - 個股頁的 URL 顯示 `?code=XXXX`
  - 直接訪問 `/individual?code=2330` 自動載入
- [x] 5.5 部署到 Vercel
