## Why

`/performance` 頁面目前的視覺結構與「投資績效分析報告」標準 PDF 範本有落差，影響課程教學情境下「畫面 → 報告」的一致性。同時，缺少標頭期間區、四象限定義圖示、KPI 4×2 grid、整體評估 narrative 段落式呈現等元素。版型對齊後可讓畫面直接對應教學報告結構，提升學員理解。

本次只調整版型與呈現方式，**不動計算邏輯、不改用語措辭**（沿用昨天合規任務的 `wording.ts`）。

## What Changes

- **新增**：`/performance` 頁面標頭區，顯示「期間 YYYY.MM – YYYY.MM」+「分析日期 YYYY.MM.DD」
- **修改**：`PortfolioPerformanceBlock` 呈現 8 個 KPI 採 4×2 grid 排列，順序對齊 PDF 範本（總損益 / 報酬率 / 勝率 / PF / 平均持有 / 勝場均 / 敗場均 / 損益比）
- **修改**：`DiagnosisPanel` 整體績效評估區由卡片改為 narrative 段落式（標題 + 多段文字）
- **新增**：`QuadrantLegendBlock` 元件 — 2×2 彩色說明區塊，定義 4 個象限（打法好結果好 / 打法差結果好 / 打法差結果差 / 單向紀錄）
- **修改**：`StockQuadrantMatrix` 表格欄位確認為 7 欄（個股 / 分類 / 勝率 / 賠率 / 獲利因子 / 總損益 / 診斷摘要）
- **修改**：`RecommendationPanel` 沿用既有編號式條目，章節編號對齊 PDF（章三）

不動：`wording.ts` / `ComplianceFooter` / `calcPortfolioPerformance` / `diagnose` / `buildRecommendations` 計算邏輯 / trade store / CSV 範例

## Capabilities

### New Capabilities

- `quadrant-legend`: 在 /performance 頁面提供四象限定義的 2×2 彩色說明區塊，作為個股表格的判讀指引

### Modified Capabilities

- `performance-page-layout`: 頁面新增標頭期間區、章節順序與標號對齊 PDF（一、概覽 → 二、賠率 vs 獲利因子 → 三、重點觀察）、8 KPI 4×2 grid、整體評估改 narrative 段落式
- `stock-quadrant-matrix`: 個股表結構改為 7 欄對齊 PDF（個股 / 分類 / 勝率 / 賠率 / 獲利因子 / 總損益 / 診斷摘要），移除「交易筆數」獨立欄（合併到個股欄）、移除「損益貢獻度」、新增「診斷摘要」

## Impact

- 影響檔案（預估 4~6 檔）：
  - `web-app/src/pages/PerformancePage.tsx`（標頭區）
  - `web-app/src/components/trade/PortfolioPerformanceBlock.tsx`（KPI grid）
  - `web-app/src/components/trade/DiagnosisPanel.tsx`（narrative 化）
  - `web-app/src/components/trade/QuadrantLegendBlock.tsx`（新增）
  - `web-app/src/components/trade/StockQuadrantMatrix.tsx`（欄位確認）
  - `web-app/src/components/trade/RecommendationPanel.tsx`（章節編號，可能無變動）

- 無破壞性改動，無 API 變更，無新依賴套件
- 與昨天合規任務（`wording.ts` / `ComplianceFooter`）無衝突
