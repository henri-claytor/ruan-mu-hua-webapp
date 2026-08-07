## 1. 5 象限分類擴展

- [x] 1.1 `src/lib/trade.ts`：`PerformanceQuadrant` 型別新增 `'單向紀錄（全勝或全敗）'`
- [x] 1.2 `classifyPerformanceQuadrant` 接受 optional `nWins`、`nLosses` 參數，若兩者有提供：全勝（nWins>0 且 nLosses===0）或全敗（nWins===0 且 nLosses>0）→ 回傳「單向紀錄（全勝或全敗）」
- [x] 1.3 `calcStockStats` 中呼叫時傳入 nWins / nLosses
- [x] 1.4 `calcPortfolioPerformance` 中呼叫時傳入 nWins / nLosses
- [x] 1.5 在 `src/lib/trade.test.ts` 更新 / 新增測試：
  - 全勝個股 → quadrant === 單向紀錄（既有「全勝 quadrant === Q1」改為單向）
  - 全敗個股 → quadrant === 單向紀錄（既有「全敗 quadrant === Q4」改為單向）
  - 有勝有敗仍走既有 4 象限規則

## 2. QuadrantBadge 擴 5 類

- [x] 2.1 `src/components/QuadrantBadge.tsx`：`performanceQuadrantStyle` 與 `performanceQuadrantCompact` 加入「單向紀錄（全勝或全敗）」對應
- [x] 2.2 配色：slate 系列（中性，與 Q1–Q4 區隔），Icon 用 `ClipboardCheck` 或 `Wave`
- [x] 2.3 compact 標籤：「單向紀錄」

## 3. 8 張主指標卡 + Dashboard 重構

- [x] 3.1 `PortfolioPerformanceBlock`：Hero 列保留總損益（emphasis="hero"）+ 4 象限徽章；新增 8 卡 grid（2 列 × 4 欄桌機 / 2 欄 × 4 列手機），依序：總損益、整體報酬率、整體勝率、獲利因子、平均持有天數、勝場均報酬、敗場均虧損、損益比
- [x] 3.2 「勝場均報酬」顯示 `fmtPct(avgWinReturnRate)` + 紅色；「敗場均虧損」顯示 `fmtPct(avgLossReturnRate)` + 綠色（既有 avgLossReturnRate 為負值）
- [x] 3.3 inline 細部統計移除已上主層的指標，保留：總投入、最大單筆獲利、最大單筆虧損、最大回撤金額/比例、最長/最短持有天數

## 4. QuadrantLegend 元件

- [x] 4.1 新增 `src/components/trade/QuadrantLegend.tsx`：5 個分類彩色卡（前 4 用 2×2 grid、單向獨佔下方）
- [x] 4.2 每張卡含分類標題 + 1–2 句簡述（如「賠率高 + 獲利因子高，策略與執行雙優」）
- [x] 4.3 配色與 QuadrantBadge 一致

## 5. 矩陣表「診斷摘要」文字欄

- [x] 5.1 新增 `src/lib/diagnosis.ts` 中 `buildStockDiagSummary(s: StockStats): string`：依優先順序回傳第一條符合的文字（全敗 → 全勝 → 賠率 → 資金管理 → 集中度 → 雙優 → 樣本不足 → 預設）
- [x] 5.2 在 `src/lib/diagnosis.test.ts` 新增測試（每條規則的觸發場景）
- [x] 5.3 `StockQuadrantMatrix.tsx`：「診斷」欄改為「診斷摘要」文字欄，每列呼叫 `buildStockDiagSummary(s)`；欄位寬度增加（max-w-md，text-caption text-dim）
- [x] 5.4 保留 `diagnoses` prop 用於 tooltip（既有用法），但欄位主要顯示文字摘要

## 6. 矩陣表整合 QuadrantLegend + 5 類篩選

- [x] 6.1 `StockQuadrantMatrix.tsx` 內部、表格 thead 之前加 `<QuadrantLegend />`
- [x] 6.2 篩選 chips 擴為 6 個：「全部」「Q1 雙優」「Q2 隱藏風險」「Q3 管理問題」「Q4 待檢討」「單向紀錄」
- [x] 6.3 點擊「單向紀錄」chip 過濾 quadrant === '單向紀錄（全勝或全敗）' 的個股
- [x] 6.4 單向紀錄個股的賠率/獲利因子欄顯示「—」（不顯示 ∞ 或 0），不渲染進度條

## 7. 驗證

- [x] 7.1 `npx tsc --noEmit` 通過
- [x] 7.2 `npx vitest run` 全部通過（更新後既有測試 + 新增測試）
- [x] 7.3 `npm run build` 通過
- [x] 7.4 在瀏覽器確認：
  - Dashboard 顯示 8 張主指標卡，勝場均報酬 / 敗場均虧損 入主層
  - 矩陣表上方有 5 象限圖例
  - 全勝個股徽章變為「單向紀錄」，賠率與獲利因子欄顯示「—」
  - 矩陣表「診斷」欄改為文字摘要（含具體數字）
  - 篩選 chips 含「單向紀錄」可點擊過濾
- [x] 7.5 部署到 Vercel
