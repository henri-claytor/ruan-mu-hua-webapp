## ADDED Requirements

### Requirement: PDF 截圖區塊 DOM id
系統 SHALL 為 `ReportHeaderBlock` 與 `ComplianceFooter` 元件的外層 `<div>` 加上 DOM id，供 PDF 截圖函式擷取。

#### Scenario: ReportHeaderBlock id
- **WHEN** `ReportHeaderBlock` 渲染（trades 非空）
- **THEN** 元件最外層 `<div>` 帶 `id="performance-report-header"`

#### Scenario: ComplianceFooter id
- **WHEN** `ComplianceFooter` 渲染
- **THEN** 元件最外層 `<div>` 帶 `id="performance-compliance-footer"`

## MODIFIED Requirements

### Requirement: PDF 區塊順序同步

PDF 匯出區塊順序 SHALL 與 PDF 範本「投資績效分析報告」一致，不再與 Web UI 完全相同（Web 仍渲染 Charts 與 Trades 表格供互動查詢，PDF 不含）。

#### Scenario: PDF section ids

- **WHEN** 觸發 PDF 匯出
- **THEN** `PDF_SECTION_IDS` 為：
  ```
  performance-report-header
  performance-dashboard
  performance-matrix
  performance-recommendations
  performance-compliance-footer
  ```
