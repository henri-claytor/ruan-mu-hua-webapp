## MODIFIED Requirements

### Requirement: PDF 報告匯出
系統 SHALL 提供 `exportPerformancePdf(sections, filename)` 函式，使用 `jspdf` + `html2canvas` 將指定 DOM 元素截圖組成多頁 A4 直式 PDF。

#### Scenario: PDF 結構（含重點建議）
- **WHEN** 使用者點擊「PDF 報告」
- **THEN** 系統依序截圖以下區塊並組成多頁 PDF：隱私 banner → PortfolioPerformanceBlock → DiagnosisPanel → **RecommendationPanel** → StockQuadrantMatrix → PerformanceCharts → RawTradeTable

#### Scenario: PDF 檔名
- **WHEN** PDF 產生完成
- **THEN** 檔名為 `performance-report-YYYY-MM-DD.pdf`

#### Scenario: 區塊不存在時跳過
- **WHEN** 某區塊在 DOM 中不存在
- **THEN** 跳過該區塊，不影響 PDF 其餘內容

#### Scenario: 高度超過一頁時自動分頁
- **WHEN** 某區塊截圖高度超過 A4 可用高度
- **THEN** 系統將該區塊切片成多頁，每頁不超過 A4
