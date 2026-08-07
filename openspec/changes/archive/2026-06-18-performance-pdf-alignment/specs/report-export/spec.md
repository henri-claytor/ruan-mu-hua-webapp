## MODIFIED Requirements

### Requirement: PDF 報告匯出
系統 SHALL 提供 `exportPerformancePdf(sections, filename)` 函式，使用 `jspdf` + `html2canvas` 將指定 DOM 元素截圖組成多頁 A4 直式 PDF。匯出區塊順序與「投資績效分析報告」PDF 範本一致：標頭 → 章一概覽 → 章二象限分析 → 章三重點觀察 → 合規 footer。

#### Scenario: A4 直式格式
- **WHEN** 函式建立 jsPDF 實例
- **THEN** 使用 `{ format: 'a4', orientation: 'p', unit: 'mm' }`，每頁邊距 10mm

#### Scenario: 依序截圖各 section
- **WHEN** 傳入 `sections` 陣列
- **THEN** 函式依陣列順序逐一處理：取得 elementId 對應 DOM、使用 `html2canvas` 截圖、嵌入 PDF；若 element 不存在則跳過該 section

#### Scenario: PDF 截圖區塊清單對齊 PDF 範本
- **WHEN** PerformancePage 傳入 `pdfSectionIds` 給 ExportMenu
- **THEN** 陣列順序為 `['performance-report-header', 'performance-dashboard', 'performance-matrix', 'performance-recommendations', 'performance-compliance-footer']`，不再包含 `performance-banner`、`performance-charts`、`performance-trades`

#### Scenario: 圖片超頁切分
- **WHEN** 某 section 截圖高度超過一頁可用高度
- **THEN** 自動切多頁顯示（每頁高度 = `USABLE_HEIGHT = 277mm`）

#### Scenario: 圖片寬度自動縮放
- **WHEN** 嵌入 PDF
- **THEN** 寬度固定為 `USABLE_WIDTH = 190mm`；高度依原比例縮放

#### Scenario: PDF 檔名中文化
- **WHEN** ExportMenu 觸發 PDF 匯出
- **THEN** 檔名為 `投資績效分析報告_YYYY-MM-DD.pdf`（對齊範本標題）

#### Scenario: 載入指示
- **WHEN** PDF 匯出進行中
- **THEN** ExportMenu 按鈕顯示「處理中…」並停用，完成後恢復
