## ADDED Requirements

### Requirement: ExportMenu 元件
系統 SHALL 提供 `ExportMenu` 下拉選單，整合 PDF / Excel / CSV 三種匯出選項，取代既有「匯出 CSV」單一按鈕。

#### Scenario: 下拉選單三選項
- **WHEN** 使用者點擊「⬇ 匯出」按鈕
- **THEN** 顯示下拉選單，三個選項：「PDF 報告（含圖表）」「Excel 工作簿（4 分頁）」「CSV 交易明細」

#### Scenario: 載入中狀態
- **WHEN** 使用者點擊任一匯出選項
- **THEN** 按鈕顯示「處理中…」，停用其他點擊；完成後恢復

#### Scenario: 匯出失敗的錯誤處理
- **WHEN** 匯出過程中發生錯誤（例如 html2canvas 失敗、xlsx 寫入失敗）
- **THEN** 顯示一行錯誤訊息「匯出失敗：{錯誤摘要}」，按鈕恢復可點擊狀態

### Requirement: PDF 報告匯出
系統 SHALL 提供 `exportPerformancePdf(elements)` 函式，使用 `jspdf` + `html2canvas` 將指定 DOM 元素截圖組成多頁 A4 直式 PDF。

#### Scenario: PDF 結構
- **WHEN** 使用者點擊「PDF 報告」
- **THEN** 系統依序截圖以下區塊並組成多頁 PDF：隱私 banner（含期間摘要） → PortfolioPerformanceBlock → DiagnosisPanel → StockQuadrantMatrix → PerformanceCharts → RawTradeTable

#### Scenario: PDF 檔名
- **WHEN** PDF 產生完成
- **THEN** 檔名為 `performance-report-YYYY-MM-DD.pdf`（YYYY-MM-DD 為今日日期）

#### Scenario: 區塊不存在時跳過
- **WHEN** 某區塊在 DOM 中不存在（如尚未展開的摺疊區）
- **THEN** 跳過該區塊，不影響 PDF 其餘內容

### Requirement: Excel 工作簿匯出
系統 SHALL 提供 `exportPerformanceXlsx(data)` 函式，使用 `xlsx` 套件產生 4 個分頁的 workbook 檔案。

#### Scenario: 4 個分頁
- **WHEN** 使用者點擊「Excel 工作簿」
- **THEN** 系統產生 xlsx 檔案，包含 4 個分頁：「整體指標」「個股統計」「交易明細」「診斷建議」

#### Scenario: Sheet 1「整體指標」內容
- **WHEN** Sheet 1 渲染
- **THEN** 顯示 PortfolioPerformance 的所有欄位（期間、總筆數、勝/敗場、總損益、整體報酬、年化、勝率、賠率、獲利因子、期望值、最大回撤、平均持有、4 象限）

#### Scenario: Sheet 2「個股統計」內容
- **WHEN** Sheet 2 渲染
- **THEN** 每列一檔股票，欄位 = StockStats 的所有欄位 + 「觸發診斷」欄列出該股相關的 diagnosis ID（以 ; 分隔）；排序依 |totalPnl| 降序

#### Scenario: Sheet 3「交易明細」內容
- **WHEN** Sheet 3 渲染
- **THEN** 每列一筆交易，欄位 = Trade 介面的 13 欄；排序依 sellDate 降序

#### Scenario: Sheet 4「診斷建議」內容
- **WHEN** Sheet 4 渲染
- **THEN** 每列一條診斷，欄位：id、level、scope、stockId（若有）、title、message、advice

#### Scenario: Excel 檔名
- **WHEN** Excel 產生完成
- **THEN** 檔名為 `performance-report-YYYY-MM-DD.xlsx`

#### Scenario: 動態載入 xlsx 套件
- **WHEN** 使用者首次點擊「Excel 工作簿」
- **THEN** 透過 dynamic import 載入 xlsx 套件（避免初始 bundle 過大）；後續點擊不再重複載入

### Requirement: 既有 CSV 匯出維持
系統 SHALL 在 ExportMenu 中保留「CSV 交易明細」選項，行為與既有 `formatTradesCSV` 相同。

#### Scenario: CSV 行為不變
- **WHEN** 使用者點擊「CSV 交易明細」
- **THEN** 下載與 Change 1 相同格式的 CSV（13 欄、UTF-8、檔名 `trades-YYYY-MM-DD.csv`）
