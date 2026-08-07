# performance-page-layout Specification

## Purpose

定義績效分析頁（`/performance`）的版面結構、Dashboard 視覺層次、空態引導與資料輸入區的可摺疊行為。

## Requirements

### Requirement: 績效分析頁的整體版面結構
系統 SHALL 在 `/performance` 路由提供 `PerformancePage`，由上至下依序顯示：頁面標題、隱私 banner（含 ExportMenu）、資料輸入區、**報告標頭區（期間 + 分析日期，僅在有資料時）**、**章節一：整體投資組合概覽（KPI 4×2 grid + 整體績效評估 narrative）**、**章節二：個股賠率 vs 獲利因子分析（含 QuadrantLegendBlock + StockQuadrantMatrix）**、**章節三：重點觀察（RecommendationPanel）**、績效視覺化、原始交易表格、ComplianceFooter。

#### Scenario: 頁面標題與描述
- **WHEN** 頁面渲染
- **THEN** 頂部顯示「績效分析」h1 標題與副標

#### Scenario: 隱私 banner 與匯出選單
- **WHEN** 頁面渲染
- **THEN** 標題下方顯示一行 banner：「💾 交易資料僅儲存於本機瀏覽器，不會上傳雲端」；右側為 ExportMenu 下拉（PDF / Excel / CSV）與「清除全部」按鈕

#### Scenario: 資料輸入區位於 Dashboard 之上
- **WHEN** 頁面有交易資料時
- **THEN** 資料輸入區預設摺疊（顯示「▼ 收折資料輸入」），點擊展開；無資料時預設展開

#### Scenario: 章節順序
- **WHEN** 頁面有交易資料
- **THEN** 主要區塊依「報告標頭 → 章節一 → 章節二（QuadrantLegend → StockQuadrantMatrix）→ 章節三 → PerformanceCharts → RawTradeTable → ComplianceFooter」的順序渲染

#### Scenario: 空態
- **WHEN** trades.length === 0
- **THEN** 顯示「尚無交易資料」空態引導，不渲染報告標頭、章節、Charts、表格與 footer

### Requirement: 自動診斷面板（DiagnosisPanel）— narrative 段落式
系統 SHALL 提供 `DiagnosisPanel` 元件，以 narrative 段落式呈現組合層級的所有診斷項目（取代舊雙軸卡片結構）。

#### Scenario: narrative 結構
- **WHEN** Panel 渲染且有任一 portfolio scope 診斷
- **THEN** 顯示一個「整體績效評估」h3 標題，下方依序列出多段：每段含一個粗體小標（`<level 名稱>：<title>`，例如「優勢：獲利因子非常強勢」）與一段 body 文字（`message → advice`）

#### Scenario: 優勢與風險順序
- **WHEN** Panel 渲染
- **THEN** `level === 'advantage'` 段落排在前；其他 level（alert / warning / note / info）排在後

#### Scenario: 配色對應 level
- **WHEN** 渲染某段標題
- **THEN** advantage 用綠色、alert 紅色、warning amber、note 藍色、info 灰色

#### Scenario: Panel 不渲染條件
- **WHEN** portfolio 層級 diagnoses 為空（含 trades.length === 0）
- **THEN** Panel 不渲染

### Requirement: 重點建議面板（RecommendationPanel）
系統 SHALL 提供 `RecommendationPanel` 元件，編號式條列顯示重點建議。每條建議有「編號 + 標題 + 多行詳細描述」結構。

#### Scenario: 編號顯示
- **WHEN** Panel 渲染且有 ≥ 1 條 recommendation
- **THEN** 每條 recommendation 左側顯示圓形編號徽章（1, 2, 3...）

#### Scenario: 標題與描述
- **WHEN** 每條 recommendation 渲染
- **THEN** 編號右側顯示 `<h4>` 標題（如「強化停損紀律」「改善鴻海操作方式」）+ 多行 `<p>` 詳細描述

#### Scenario: RecommendationPanel 標題顯示
- **WHEN** Panel 渲染
- **THEN** 標題為「重點建議」+ 副標「自動產生的具體行動建議」

#### Scenario: RecommendationPanel - trades 為空時不顯示
- **WHEN** trades.length === 0
- **THEN** Panel 不渲染

#### Scenario: 容器 id
- **WHEN** Panel 渲染外層 div
- **THEN** 外層 div 有 `id="performance-recommendations"` 以供 PDF 匯出截圖

### Requirement: 績效分析頁支援 ?stock= query string 篩選
PerformancePage SHALL 支援透過 URL query string `?stock=` 自動將個股矩陣表預設篩選為指定股票。

#### Scenario: 透過 query string 篩選
- **WHEN** 使用者導航至 `/performance?stock=2330`
- **THEN** 個股矩陣表自動將 stockId 過濾為「2330」，僅顯示該股的列；矩陣表頂部顯示「篩選：2330（清除）」提示

#### Scenario: 清除過濾
- **WHEN** 使用者點擊「清除」過濾標籤
- **THEN** 矩陣表回到顯示全部個股的狀態（query string 不變）

#### Scenario: 自動捲動到矩陣表
- **WHEN** 頁面以 `?stock=` 進入
- **THEN** 載入完成後自動捲動到矩陣表 anchor 位置（smooth scroll）

#### Scenario: 找不到該股票時的處理
- **WHEN** `?stock=0000` 但使用者沒有 0000 的交易紀錄
- **THEN** 矩陣表顯示空狀態「無此股票的交易紀錄」，並提供「← 顯示全部」按鈕清除過濾

### Requirement: 整體績效 Dashboard（PortfolioPerformanceBlock）
系統 SHALL 提供 `PortfolioPerformanceBlock` 元件，輸入 `PortfolioPerformance` 物件，輸出三層視覺層次的整體 Dashboard。

#### Scenario: Hero 列以總實現損益為主數字
- **WHEN** Block 渲染
- **THEN** Hero 列左欄顯示 `ResultCard emphasis="hero"`：標題「總實現損益」、值為 `±xxx,xxx 元` 格式（千分位、紅漲綠跌色）；右欄顯示 4 象限結論徽章（QuadrantBadge size="large"，依 PerformanceQuadrant）+ 「賠率 X × 獲利因子 X」副標

#### Scenario: 8 張主指標卡
- **WHEN** Block 渲染
- **THEN** 顯示 8 張 `ResultCard emphasis="normal"`（grid 2 列 × 4 欄，桌機；2 欄 × 4 列，手機）依序為：總實現損益、整體報酬率（含年化副標）、整體勝率、獲利因子、平均持有天數、勝場均報酬、敗場均虧損、損益比（賠率）

#### Scenario: 弱化細節 inline 行
- **WHEN** Block 渲染
- **THEN** 8 卡片下方顯示 inline 緊湊行（text-small + text-faint/dim）：總投入、期望值（每筆）、最大單筆獲利、最大單筆虧損、最大回撤金額 / 比例、最長持有天數、最短持有天數（不重覆已在主層的指標）

#### Scenario: 4 象限與既有 EV 4 象限分開
- **WHEN** Block 渲染的徽章
- **THEN** 顯示 `PerformanceQuadrant` 標籤（如「Q1: 打法好・結果好」），不使用既有 EV 的「高賠率正期望值」標籤

#### Scenario: 計算依據摺疊
- **WHEN** Block 底部「▶ 展開計算依據」被點擊
- **THEN** 展開區塊顯示各指標的公式與所用筆數（如「賠率 = 平均獲利報酬率 1.85% ÷ 平均虧損報酬率 1.00% = 1.85」）

#### Scenario: 期間摘要顯示
- **WHEN** Block 標題下方副標
- **THEN** 顯示「期間 YYYY-MM-DD – YYYY-MM-DD · 共 N 筆交易」（min(buyDate) 與 max(sellDate)）

### Requirement: 報酬率與金額顯示套用台股慣例
系統 SHALL 在績效分析頁所有「報酬率」與「金額損益」欄位採用「紅漲綠跌」+ `+/−` 號顯示。

#### Scenario: 報酬率欄位
- **WHEN** 任何 returnRate 欄位顯示
- **THEN** 採用 `fmtPct(n)` 格式（`+X.XX%` / `−X.XX%` / `0.00%`）+ `colorByReturn(n)` 配色

#### Scenario: 金額損益欄位
- **WHEN** 任何 pnl / 金額損益欄位顯示
- **THEN** 採用 `fmtMoney(n)` 格式（`+X,XXX 元` / `−X,XXX 元` / `0 元`，千分位 + 強制正負號），配色同 `colorByReturn`

#### Scenario: 非報酬率欄位不適用慣例
- **WHEN** 顯示欄位為勝率、敗率（機率）、平均持有天數、4 象限徽章
- **THEN** 沿用既有色彩語意，不套用「紅漲綠跌」慣例

### Requirement: 空態與引導
系統 SHALL 在無交易資料時顯示空態說明卡片，引導使用者開始輸入。

#### Scenario: 空態 UI
- **WHEN** `trades.length === 0`
- **THEN** Dashboard 與原始交易表格不渲染；改顯示空態卡片：「尚無交易資料，使用上方資料輸入區新增第一筆交易」+ 「下載範例 CSV」連結

#### Scenario: 範例 CSV 下載
- **WHEN** 使用者點擊「範例 CSV」連結（指向 `/example-trades.csv`）
- **THEN** 系統下載 `example-trades.csv`，內含 3 筆示範交易（含完整 13 欄），格式正確

## ADDED Requirements (結論優先 + 主判斷強化)

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

### Requirement: PDF 截圖區塊 DOM id
系統 SHALL 為 `ReportHeaderBlock` 與 `ComplianceFooter` 元件的外層 `<div>` 加上 DOM id，供 PDF 截圖函式擷取。

#### Scenario: ReportHeaderBlock id
- **WHEN** `ReportHeaderBlock` 渲染（trades 非空）
- **THEN** 元件最外層 `<div>` 帶 `id="performance-report-header"`

#### Scenario: ComplianceFooter id
- **WHEN** `ComplianceFooter` 渲染
- **THEN** 元件最外層 `<div>` 帶 `id="performance-compliance-footer"`

### Requirement: 報告標頭區（期間 + 分析日期）
系統 SHALL 在 `/performance` 頁面有交易資料時，於頁面最上方渲染「報告標頭區」（`ReportHeaderBlock`），顯示報告期間與分析日期，與 PDF 範本「投資績效分析報告」標頭一致。

#### Scenario: 期間自動推算
- **WHEN** trades 非空
- **THEN** 標頭顯示「期間 YYYY.MM – YYYY.MM」，其中起始日 = `min(trades[i].buyDate)`、結束日 = `max(trades[i].sellDate)`，格式化為 `YYYY.MM`

#### Scenario: 分析日期顯示
- **WHEN** 標頭渲染
- **THEN** 緊接著期間顯示「分析日期 YYYY.MM.DD」，使用系統當前日期

#### Scenario: 標題顯示
- **WHEN** 標頭渲染
- **THEN** 顯示 h1 標題「投資績效分析報告」

#### Scenario: 空資料不渲染標頭
- **WHEN** `trades.length === 0`
- **THEN** 不渲染報告標頭區

### Requirement: 8 KPI 4×2 grid 順序
系統 SHALL 在「一、整體投資組合概覽」章節（`PortfolioPerformanceBlock`）以 4 欄 × 2 列的 grid 排列 8 個整體 KPI，順序對齊 PDF 範本。「總實現損益」與「整體報酬率」兩張 KPI 卡 SHALL 在 `base` 副資訊位置顯示延伸指標（最大回撤、年化報酬率）。

#### Scenario: KPI 順序
- **WHEN** `PortfolioPerformanceBlock` 渲染
- **THEN** KPI 顯示順序為：第 1 列 — 總實現損益 / 整體報酬率 / 整體勝率 / 獲利因子；第 2 列 — 平均持有天數 / 勝場均報酬 / 敗場均虧損 / 損益比（賠率）

#### Scenario: KPI 數字字級
- **WHEN** 任一 KPI 渲染
- **THEN** 數字一律使用 `display` 字級，上方為 label（caption 字級）

#### Scenario: 紅漲綠跌色碼
- **WHEN** KPI 值為「總實現損益」「整體報酬率」「勝場均報酬」「敗場均虧損」其中之一
- **THEN** 正值用 `text-red-700`、負值用 `text-green-700`、零值用 `text-main`

#### Scenario: 中性色 KPI
- **WHEN** KPI 值為「整體勝率」「獲利因子」「平均持有天數」「損益比（賠率）」其中之一
- **THEN** 一律用 `text-main` 中性色，不套紅綠

#### Scenario: 總實現損益 KPI base 顯示最大回撤
- **WHEN** 「總實現損益」KpiCard 渲染
- **THEN** base 位置顯示 `最大回撤 −X,XXX 元（−Y.Y%）`（使用 `fmtMoney` + `fmtPct`），若 `maxDrawdownPct === 0` 則顯示「無回撤」

#### Scenario: 整體報酬率 KPI base 顯示年化報酬
- **WHEN** 「整體報酬率」KpiCard 渲染
- **THEN** base 位置顯示 `年化 X.X%`（使用 `fmtPct`）

#### Scenario: base 副資訊字級
- **WHEN** 任一 KpiCard 顯示 base 副資訊
- **THEN** base 文字使用 `text-caption` 字級 + `text-faint` 顏色（不搶 KPI 主數字注意力）

### Requirement: 整體績效評估 narrative 段落式呈現
系統 SHALL 在「一、整體投資組合概覽」章節的 KPI grid 之後渲染「整體績效評估」區塊，使用 narrative 段落式呈現（非雙軸卡片），由 `diagnose()` 既有結果產生（不新寫文案）。

#### Scenario: narrative 結構
- **WHEN** 區塊渲染且有 portfolio 層級 diagnoses
- **THEN** 顯示一個「整體績效評估」h3 標題，下方依序列出多段：每段含一個粗體小標 + 一段 body 文字（`message → advice`）

#### Scenario: 優勢與風險順序
- **WHEN** 區塊渲染
- **THEN** `level === 'advantage'` 段落排在前；其他 level 段落排在後

#### Scenario: 不渲染條件
- **WHEN** portfolio 層級 diagnoses 為空
- **THEN** 不渲染「整體績效評估」區塊

### Requirement: 章節編號與標題
系統 SHALL 在 `/performance` 頁面的主要區塊以「一、二、三」中文編號 + 標題對齊 PDF 範本。

#### Scenario: 三大章節標題
- **WHEN** 頁面有交易資料
- **THEN** 依序顯示三個 h2 章節標題：「一、整體投資組合概覽」、「二、個股賠率 vs 獲利因子分析」、「三、重點觀察」

#### Scenario: 章節二副標
- **WHEN** 「二、個股賠率 vs 獲利因子分析」章節渲染
- **THEN** 章節標題下方顯示副標：「賠率衡量打法品質（策略邏輯），獲利因子衡量實際結果（含部位大小影響）。兩者差距可揭示打法與執行之間的落差。」
