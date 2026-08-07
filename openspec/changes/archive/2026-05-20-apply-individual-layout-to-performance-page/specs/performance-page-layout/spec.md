## MODIFIED Requirements

### Requirement: PerformancePage 區塊順序（結論優先）

系統 SHALL 使 PerformancePage 在資料就緒後採以下「結論優先」順序：

#### Scenario: 區塊順序

- **WHEN** `trades.length > 0`
- **THEN** 結果區由上至下依序為：
  1. 隱私 banner
  2. 資料輸入區（可摺疊）
  3. **重點建議**（RecommendationPanel）
  4. **自動診斷**（DiagnosisPanel）
  5. 整體績效 Dashboard（PortfolioPerformanceBlock）
  6. 個股矩陣表（StockQuadrantMatrix）
  7. 績效視覺化（PerformanceCharts）
  8. 原始交易表格（RawTradeTable）

### Requirement: 「總實現損益」主判斷視覺強調

`PortfolioPerformanceBlock` 內的「總實現損益」metric card SHALL 採主判斷樣式，視覺上突出於其他 7 卡。

#### Scenario: 主判斷樣式

- **WHEN** PortfolioPerformanceBlock 渲染
- **THEN** 「總實現損益」卡：
  - 背景 `bg-[#f4ead8]` + 2px 金色邊框
  - 右上角「主判斷」chip（金底白字）
  - 數字字級放大為 40px（其他卡 22px）
  - 卡片佔 grid 2 columns（讓視覺更突出）

#### Scenario: 其他卡片維持普通樣式

- **WHEN** 其他 7 metric card 渲染
- **THEN** 維持 `bg-card2` cream 樣式、22px 數字、1 column 寬

### Requirement: PDF 區塊順序同步

PDF 匯出區塊順序 SHALL 與 UI 一致。

#### Scenario: PDF section ids

- **WHEN** 觸發 PDF 匯出
- **THEN** `PDF_SECTION_IDS` 為：
  ```
  performance-banner
  performance-recommendations
  performance-diagnosis
  performance-dashboard
  performance-matrix
  performance-charts
  performance-trades
  ```
