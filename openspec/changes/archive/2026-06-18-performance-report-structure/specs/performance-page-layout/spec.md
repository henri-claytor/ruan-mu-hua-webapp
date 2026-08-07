## ADDED Requirements

### Requirement: 報告標頭區（期間 + 分析日期）
系統 SHALL 在 `/performance` 頁面有交易資料時，於頁面最上方渲染「報告標頭區」，顯示報告期間與分析日期，與 PDF 範本「投資績效分析報告」標頭一致。

#### Scenario: 期間自動推算
- **WHEN** trades 非空
- **THEN** 標頭顯示「期間 YYYY.MM – YYYY.MM」，其中起始日 = `min(trades[i].buyDate)`、結束日 = `max(trades[i].sellDate)`，格式化為 `YYYY.MM`

#### Scenario: 分析日期顯示
- **WHEN** 標頭渲染
- **THEN** 緊接著期間顯示「分析日期 YYYY.MM.DD」，使用系統當前日期

#### Scenario: 空資料不渲染標頭
- **WHEN** `trades.length === 0`
- **THEN** 不渲染報告標頭區（沿用既有空態引導）

### Requirement: 8 KPI 4×2 grid 順序
系統 SHALL 在「一、整體投資組合概覽」章節（`PortfolioPerformanceBlock`）以 4 欄 × 2 列的 grid 排列 8 個整體 KPI，順序對齊 PDF 範本。

#### Scenario: KPI 順序
- **WHEN** `PortfolioPerformanceBlock` 渲染
- **THEN** KPI 顯示順序為：第 1 列 — 總實現損益 / 整體報酬率 / 整體勝率 / 獲利因子；第 2 列 — 平均持有天數 / 勝場均報酬 / 敗場均虧損 / 損益比（賠率）

#### Scenario: KPI 數字字級
- **WHEN** 任一 KPI 渲染
- **THEN** 數字一律使用 `display` 字級（CLAUDE.md 規定），上方為 label（small / caption 字級）

#### Scenario: 紅漲綠跌色碼
- **WHEN** KPI 值為「總實現損益」「整體報酬率」「勝場均報酬」「敗場均虧損」其中之一
- **THEN** 正值用 `text-red-700`、負值用 `text-green-700`、零值用 `text-main`

#### Scenario: 中性色 KPI
- **WHEN** KPI 值為「整體勝率」「獲利因子」「平均持有天數」「損益比（賠率）」其中之一
- **THEN** 一律用 `text-main` 中性色，不套紅綠

### Requirement: 整體績效評估 narrative 段落式
系統 SHALL 在「一、整體投資組合概覽」章節的 KPI grid 之後渲染「整體績效評估」區塊，使用 narrative 段落式呈現（非卡片），由 `diagnose()` 既有結果產生。

#### Scenario: narrative 結構
- **WHEN** 「整體績效評估」區塊渲染且有 portfolio 層級 diagnoses
- **THEN** 顯示一個「整體績效評估」h2 標題，下方依序列出 4 段（或更多）小區塊：每段含一個粗體小標（`<level>：<title>`，例如「優勢：獲利因子非常強勢」）與一段 body 文字（`message` + `→ advice`）

#### Scenario: 優勢與風險順序
- **WHEN** narrative 區塊渲染
- **THEN** `level === 'advantage'` 段落排在前；`level !== 'advantage'` 段落（alert / warning / note / info）排在後

#### Scenario: 不渲染條件
- **WHEN** portfolio 層級 diagnoses 為空
- **THEN** 不渲染「整體績效評估」區塊

### Requirement: 章節編號與標題
系統 SHALL 在 `/performance` 頁面的主要區塊以「一、二、三」中文編號 + 標題對齊 PDF 範本。

#### Scenario: 三大章節標題
- **WHEN** 頁面有交易資料
- **THEN** 依序顯示：「一、整體投資組合概覽」、「二、個股賠率 vs 獲利因子分析」、「三、重點觀察」三個 h2 章節標題

#### Scenario: 章節二副標
- **WHEN** 「二、個股賠率 vs 獲利因子分析」章節渲染
- **THEN** 章節標題下方顯示一行副標：「賠率衡量打法品質（策略邏輯），獲利因子衡量實際結果（含部位大小影響）。兩者差距可揭示打法與執行之間的落差。」

## MODIFIED Requirements

### Requirement: 績效分析頁的整體版面結構
系統 SHALL 在 `/performance` 路由提供 `PerformancePage`，由上至下依序顯示：頁面標題與隱私 banner、資料輸入區、**報告標頭區（期間 + 分析日期，僅在有資料時）**、**章節一：整體投資組合概覽（KPI 4×2 grid + 整體績效評估 narrative）**、**章節二：個股賠率 vs 獲利因子分析（含 QuadrantLegendBlock + StockQuadrantMatrix）**、**章節三：重點觀察（RecommendationPanel）**、績效視覺化、原始交易表格、ComplianceFooter。

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
