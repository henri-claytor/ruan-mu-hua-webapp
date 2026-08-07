## 1. 報告標頭區（期間 + 分析日期）

- [x] 1.1 新增 `src/components/trade/ReportHeaderBlock.tsx`（期間自動推算 + 分析日期）
- [x] 1.2 `PerformancePage.tsx` 在資料輸入區之後、章節一之前插入 `<ReportHeaderBlock trades={trades} />`，空資料時自動不渲染

## 2. 章節一：整體投資組合概覽

- [x] 2.1 `PortfolioPerformanceBlock.tsx` KPI 改 4×2 grid，順序依 PDF 範本（總損益 / 報酬率 / 勝率 / PF / 平均持有 / 勝場均 / 敗場均 / 損益比）
- [x] 2.2 KPI 數字字級統一 `display`，label 為 `caption`
- [x] 2.3 紅漲綠跌：總損益 / 報酬率 / 勝場均 / 敗場均 套用條件式色碼；勝率 / PF / 平均持有 / 損益比 中性色
- [x] 2.4 章節一外層加 h2 標題「一、整體投資組合概覽」

## 3. 整體績效評估 narrative 段落式

- [x] 3.1 `DiagnosisPanel.tsx` 改為 narrative 段落式呈現（保留既有資料結構）
- [x] 3.2 優勢段落（level === 'advantage'）排在前，風險段落排在後
- [x] 3.3 每段格式：`<level>：<title>` 為粗體小標 + 一段 body 文字（`message → advice`）
- [x] 3.4 空 portfolio diagnoses 時不渲染整個區塊

## 4. 章節二：四象限定義 + 個股表

- [x] 4.1 新增 `src/components/trade/QuadrantLegendBlock.tsx`（2×2 grid 四象限說明）
- [x] 4.2 章節二外層加 h2 標題「二、個股賠率 vs 獲利因子分析」+ 副標說明
- [x] 4.3 `QuadrantLegendBlock` 渲染順序：副標 → 2×2 legend → StockQuadrantMatrix
- [x] 4.4 `StockQuadrantMatrix.tsx` 欄位改為 7 欄結構：個股（含筆數）/ 分類 / 勝率 / 賠率 / 獲利因子 / 總損益 / 診斷摘要
- [x] 4.5 移除舊欄位「交易筆數」（合併到個股欄）、「損益貢獻度」；同時刪除舊 `QuadrantLegend.tsx`
- [x] 4.6 新增「診斷摘要」欄，使用 `buildStockDiagSummary(stock)` 產生文字

## 5. 章節三：重點觀察

- [x] 5.1 章節三外層加 h2 標題「三、重點觀察」
- [x] 5.2 `RecommendationPanel.tsx` 沿用 `WORDING.recommendationTitle`，前面加上「三、」中文編號

## 6. PerformancePage 整合

- [x] 6.1 `PerformancePage.tsx` 主 return 依序：標題 / 隱私 banner / 資料輸入 / ReportHeaderBlock / 章節一（PortfolioPerformanceBlock + DiagnosisPanel narrative）/ 章節二（QuadrantLegendBlock + StockQuadrantMatrix）/ 章節三（RecommendationPanel）/ PerformanceCharts / RawTradeTable / ComplianceFooter
- [x] 6.2 確保所有區塊只在 `hasTrades` 為 true 時渲染

## 7. 驗證

- [x] 7.1 `npx tsc --noEmit` 通過
- [x] 7.2 `npx vitest run` 通過（223 passed）
- [x] 7.3 `npm run build` 通過
- [x] 7.4 瀏覽器（注入合成 trades）確認：
  - 標頭「投資績效分析報告」+「期間 YYYY.MM – YYYY.MM」+「分析日期 YYYY.MM.DD」✓
  - 8 KPI 4×2 grid 順序正確、紅漲綠跌 ✓（總損益 +165,000 紅、敗場均虧損 −9.0% 綠、中性 KPI 全中性色）
  - 整體績效評估 narrative 段落式 ✓
  - 四象限定義 2×2 區塊 ✓
  - 個股表 7 欄 ✓
  - 三章節「一、二、三」標題 ✓
  - 合規 footer ✓、無「推薦」字、僅 footer 的「非投資建議」必要字
- [x] 7.5 commit + push origin main
- [x] 7.6 `npx vercel --prod` 部署
- [x] 7.7 tasks.md 記錄 commit hash + deployment URL
  - Commit: `80044e3`
  - Production: https://web-app-gamma-fawn.vercel.app
  - Deployment: `dpl_HUusAPWkbmJTRH32PJNqgVSc9QUp`
