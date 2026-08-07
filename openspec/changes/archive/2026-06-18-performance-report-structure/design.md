## Context

`/performance` 頁面目前由 7 個區塊組成（PortfolioPerformanceBlock / DiagnosisPanel / RecommendationPanel / StockQuadrantMatrix / PerformanceCharts / RawTradeTable / ComplianceFooter）。各區塊內容齊全，但版面結構與「投資績效分析報告」標準 PDF 範本有 4 處差異：

1. 缺標頭期間區（PDF 顯示「期間 2025.06–2026.01 / 分析日期 2026.04.17」）
2. KPI 排列方式不明（PDF 為 4×2 grid，順序固定）
3. 整體績效評估為卡片式，PDF 為段落式 narrative
4. 缺四象限定義圖示區塊（PDF 在個股表前有 2×2 彩色說明）

昨天的合規任務已將文字措辭中性化，本次版型對齊不重做文字。

## Goals / Non-Goals

**Goals:**

- /performance 頁面章節結構對齊 PDF（標頭 → 一概覽 → 二象限分析 → 三重點觀察 → footer）
- 8 KPI 4×2 grid 順序固定（總損益 / 報酬率 / 勝率 / PF / 平均持有 / 勝場均 / 敗場均 / 損益比）
- 整體績效評估 narrative 段落式（沿用既有 advantage / risk 文字，不新寫）
- 新增四象限定義區塊
- 個股表 7 欄齊全
- 紅漲綠跌色碼（總損益、報酬率正紅負綠）

**Non-Goals:**

- 不動計算邏輯（calcPortfolioPerformance / diagnose / buildRecommendations）
- 不改文字措辭（沿用 `wording.ts` / 既有 advice）
- 不補新指標（年化報酬率 / 最大回撤 / 持有天數×報酬相關性 — 下次再做）
- 不動 PDF 匯出（Phase 2 處理）
- 不動 trade store / CSV 範例

## Decisions

### 1. 標頭期間自動推算 vs 使用者輸入
**決定**：自動推算。期間 = `min(trades.buyDate)` – `max(trades.sellDate)`；分析日期 = `new Date()` 當下日期。

**理由**：符合「最小用戶輸入」鐵律。期間從資料自然推算，符合 PDF 範本邏輯（PDF 範本也是依資料時段）。

**替代方案**：加日期選擇器讓使用者自選期間 → 違反最小輸入原則，且非本次目的。

### 2. 8 KPI grid 用既有 token 還是新元件
**決定**：用 Tailwind grid (`grid-cols-2 md:grid-cols-4`) 改造 `PortfolioPerformanceBlock` 既有結構。KPI 數字統一用 `display` 字級（CLAUDE.md 規定）。

**理由**：避免新元件碎片化；既有 block 已有所有 KPI 計算與 fmt 邏輯，只需重排版面。

### 3. DiagnosisPanel narrative 化策略
**決定**：保留既有 `Diagnosis[]` 資料結構與卡片元件作為 fallback；新增「narrative 模式」。優勢 narrative 由 `level === 'advantage'` 的 `title + message + advice` 串成段落，每段一個 H3 小標 + body 文字。風險同理。

**理由**：不動既有 `diagnose()` 函式；只在元件層做呈現切換。後續若要切回卡片很容易。

### 4. 四象限定義新元件位置
**決定**：新增 `QuadrantLegendBlock.tsx`，置於 `StockQuadrantMatrix` 之前。內容為 2×2 grid，4 個彩色方塊對應 4 個象限定義，使用 `QuadrantBadge` 同色系（雙優紅 / 勝率驅動黃 / 賠率驅動橘 / 較弱綠 / 單向紀錄藍）。

**理由**：PDF 範本中四象限定義是個股表的判讀指引，**獨立區塊**比塞進表頭可讀性高。

### 5. 個股表欄位順序
**決定**：照 PDF 範本順序：個股 / 分類 / 勝率 / 賠率 / 獲利因子 / 總損益 / 診斷摘要。若現有實作已符合 → 不動；若有差異 → 調整欄位順序與寬度。

### 6. 紅漲綠跌實作
**決定**：總損益 / 報酬率 / 勝場均報酬 用條件式色碼（正值 `text-red-700`、負值 `text-green-700`、零值 `text-main`）。其餘 KPI（勝率、PF、損益比、平均持有天數）一律中性色 `text-main`。

**理由**：CLAUDE.md 鐵律「紅漲綠跌」明確指向損益相關欄位，比例類指標不適用。

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| `PortfolioPerformanceBlock` 既有版型若已是 4×2 grid → 改動可能為零 | 開始 apply 時先 Read 一次，若已符合則 tasks.md 標 skip |
| 標頭期間若 trades 為空陣列 → 顯示異常 | trades.length === 0 時走既有 empty state，不渲染標頭 |
| narrative 段落式若 advice 文字短促 → 可讀性差 | 沿用既有合規版 advice（昨天已優化），避免短促；若 < 20 字補一句 fallback |
| 四象限定義文字直接引用 PDF → 措辭風險 | PDF 四象限文字（「打法好・結果好」「靠資金或勝率撐場」等）為描述性，非投資建議，無合規風險 |
| 個股表 25+ 檔不分頁可能造成捲動長 | 沿用既有實作（PDF 也是全列），不引入分頁 |
