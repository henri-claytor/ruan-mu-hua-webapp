## Why

`apply-course-theme-redesign` 已完成全站 design tokens 與 HomePage / IndividualPage 視覺對齊 ui-spec 範本。但 **PortfolioPage、ComparePage、PerformancePage** 仍保留先前的版面結構，與 ui-spec 對應頁面範本有明顯落差：
- field / actions / panel 結構未統一
- chip、port-row、cmp-table、upload-area、metric-grid 等 ui-spec 特定元件未實作
- sbadge / pulse dot / sdiv 直線分隔等視覺細節缺失

本 change 將剩餘 3 個分析頁套用 ui-spec 範本的結構與元件樣式，達成全站視覺一致性。

## What Changes

- **PortfolioPage**：
  - page-hd 對齊樣式（serif h1 + 清除連結）
  - 加入股票：field 樣式 + 加入按鈕（btn-solid）+ stock-chips（金色 pill + × 移除）
  - actions：複製摘要 + 計算組合（btn-ghost / btn-solid）
  - 「組合加權配置」panel：port-row 排版（名稱 + 權重 + 進度條 + 貢獻 EV + × 移除）
  - 「組合風險與報酬概覽」panel：3 cols EV/VaR/Hurst（cream evcol 樣式 + serif 數字）+ stats row（P5/P50/P95 直線分隔）+ sbadge 結論

- **ComparePage**：
  - page-hd / page-sub
  - field 雙欄輸入（股票 A / B）
  - actions：複製摘要 + 開始比較
  - 「指標對比總覽」panel：cmp-table 樣式（serif header、`.win` 綠底高亮、num 大字）
  - 「綜合建議」panel：2 diag-items（ok 綠 / warn 金）

- **PerformancePage**：
  - upload-area 改 dashed 金邊 + 金色 hover 樣式
  - actions：手動輸入（btn-ghost）+ 匯出報告（btn-solid）
  - 「績效指標總覽」panel：metrics-grid 樣式（cream metric-card + serif 數字 + label）+ sbadge 整體結論
  - 「自動診斷報告」panel：diag-item 三色（ok / warn / bad）對應 advantage / warning / alert
  - RecommendationPanel 編號徽章樣式微調（金棕 vs 既有顏色一致性）

- **共用元件**：
  - 新增 `PortRow` 元件（port-row 排版）
  - 新增 `StockChips` 元件（chip + 移除）
  - 新增 `CmpTable` 元件或在 StockVsPortfolioComparison 套用
  - 統一 `panel` / `field` / `actions` className 規則

- **保留**：所有計算邏輯、Zustand store、API client、tests 不動

## Capabilities

### Modified Capabilities

- `result-first-layout`：擴充 PortfolioPage / ComparePage / PerformancePage 的 ui-spec 對齊要求

## Impact

- **影響檔案**：
  - `src/pages/PortfolioPage.tsx`
  - `src/pages/ComparePage.tsx`
  - `src/pages/PerformancePage.tsx`
  - `src/components/trade/TradeFileUpload.tsx`（upload-area）
  - `src/components/trade/PortfolioPerformanceBlock.tsx`（metrics-grid 對齊）
  - `src/components/trade/DiagnosisPanel.tsx`（diag-item 三色微調）
  - `src/components/trade/ExportMenu.tsx`（按鈕 btn-ghost/solid）
  - `src/components/trade/StockVsPortfolioComparison.tsx`（cmp-table 樣式）
  - 可能新增 `src/components/PortRow.tsx`、`src/components/StockChip.tsx`
- **不影響**：`src/lib/**` 純函式、tests、Zustand、API
- **風險**：
  - cmp-table 的 .win 高亮邏輯需重新檢視（既有 StockVsPortfolioComparison 已有對比表，可能只需微調樣式）
  - upload-area 拖曳行為要保留
  - 個股 chips 互動（× 移除）邏輯不變
