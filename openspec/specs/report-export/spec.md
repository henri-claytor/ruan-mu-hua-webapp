# report-export Specification

## Purpose

定義績效分析頁的報告匯出功能：PDF（多頁 A4，含 Dashboard / 矩陣 / 圖表 / 診斷）、Excel（4 個分頁）、CSV（交易明細）三種格式，統一在 `ExportMenu` 下拉選單。

## Requirements

### Requirement: ExportMenu 元件
系統 SHALL 提供 `ExportMenu` 下拉選單，整合 PDF / Excel / CSV 三種匯出選項，取代既有「匯出 CSV」單一按鈕。

#### Scenario: 下拉選單三選項
- **WHEN** 使用者點擊「⬇ 匯出」按鈕
- **THEN** 顯示下拉選單，三個選項：「PDF 報告（含圖表）」「Excel 工作簿（4 分頁）」「CSV 交易明細」

#### Scenario: 載入中狀態
- **WHEN** 使用者點擊任一匯出選項
- **THEN** 按鈕顯示「處理中…」，停用其他點擊；完成後恢復

#### Scenario: 匯出失敗的錯誤處理
- **WHEN** 匯出過程中發生錯誤
- **THEN** 顯示一行錯誤訊息「匯出失敗：{錯誤摘要}」，按鈕恢復可點擊狀態

### Requirement: PDF 報告匯出
系統 SHALL 提供 `exportPerformancePdf(sections, filename)` 函式，使用 `jspdf` + `html2canvas-pro` 將指定 DOM 元素截圖組成多頁 A4 直式 PDF。匯出區塊順序與「投資績效分析報告」PDF 範本一致：標頭 → 章一概覽 → 章二象限分析 → 章三重點觀察 → 合規 footer。

#### Scenario: A4 直式格式
- **WHEN** 函式建立 jsPDF 實例
- **THEN** 使用 `{ format: 'a4', orientation: 'p', unit: 'mm' }`，每頁邊距 10mm

#### Scenario: 依序截圖各 section
- **WHEN** 傳入 `sections` 陣列
- **THEN** 函式依陣列順序逐一處理：取得 elementId 對應 DOM、使用 `html2canvas-pro` 截圖、嵌入 PDF；若 element 不存在則跳過該 section

#### Scenario: 支援現代 CSS 顏色函式
- **WHEN** DOM 樣式使用 `oklch()`、`lab()`、`color-mix()` 等現代 CSS 顏色函式（Tailwind v4 預設）
- **THEN** 截圖能成功完成，不再拋出 `unsupported color function` 錯誤

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

### Requirement: Excel 工作簿匯出
系統 SHALL 提供 `exportPerformanceXlsx(performance, stocks, trades, diagnoses, filename)` 函式，使用 `xlsx` 套件產生 4 個分頁的 workbook。

#### Scenario: 4 個分頁
- **WHEN** 使用者點擊「Excel 工作簿」
- **THEN** 系統產生 xlsx 檔案，包含 4 個分頁：「整體指標」「個股統計」「交易明細」「診斷建議」

#### Scenario: Sheet 1「整體指標」內容
- **WHEN** Sheet 1 渲染
- **THEN** 顯示 PortfolioPerformance 的所有欄位（期間、總筆數、勝/敗場、總損益、整體報酬、年化、勝率、賠率、獲利因子、期望值、最大回撤、平均持有、4 象限）

#### Scenario: Sheet 2「個股統計」內容
- **WHEN** Sheet 2 渲染
- **THEN** 每列一檔股票，欄位 = StockStats 的所有欄位 + 「觸發診斷」欄列出該股相關的 diagnosis ID（以 `;` 分隔）；排序依 |totalPnl| 降序

#### Scenario: Sheet 3「交易明細」內容
- **WHEN** Sheet 3 渲染
- **THEN** 每列一筆交易，欄位包含 13 個 Trade 欄位 + 衍生 holding_days；排序依 sellDate 降序

#### Scenario: Sheet 4「診斷建議」內容
- **WHEN** Sheet 4 渲染
- **THEN** 每列一條診斷，欄位：id、level、scope、stockId（若有）、title、message、advice

#### Scenario: Excel 檔名
- **WHEN** Excel 產生完成
- **THEN** 檔名為 `performance-report-YYYY-MM-DD.xlsx`

#### Scenario: 動態載入 xlsx 套件
- **WHEN** 使用者首次點擊「Excel 工作簿」
- **THEN** 透過 dynamic import 載入 xlsx 套件（避免初始 bundle 過大）

### Requirement: 既有 CSV 匯出維持
系統 SHALL 在 ExportMenu 中保留「CSV 交易明細」選項，行為與既有 `formatTradesCSV` 相同。

#### Scenario: CSV 行為不變
- **WHEN** 使用者點擊「CSV 交易明細」
- **THEN** 下載與 Change 1 相同格式的 CSV（13 欄、UTF-8、檔名 `trades-YYYY-MM-DD.csv`）
