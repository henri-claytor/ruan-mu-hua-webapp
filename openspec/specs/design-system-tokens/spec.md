## ADDED Requirements

### Requirement: 語意顏色 Token 定義

系統 SHALL 在 `src/index.css` 以 CSS 變數定義「課程質感」色票，並對應 Tailwind utility。全站禁止硬編 `text-[#xxx]` / `bg-[#xxx]`（Recharts stroke 除外）。

Token 清單：

| CSS 變數 | 值 | Tailwind utility |
|---------|---|-----------------|
| `--color-bg` | `#16100a` | `bg-shell`（深棕，sidebar 主色） |
| `--color-bg2` | `#1f1509` | `bg-sidebar` |
| `--color-app` | `#f0e6d0` | `bg-app`（內容區） |
| `--color-surface` | `#fff9ef` | `bg-surface`（卡片白） |
| `--color-elevated` | `#f4ead8` | `bg-elevated` |
| `--color-card2` | `#ede0c4` | `bg-card2` |
| `--color-main` | `#1a1108` | `text-main` |
| `--color-main2` | `#3a2a18` | `text-main2` |
| `--color-dim` | `#7a6a50` | `text-dim` |
| `--color-faint` | `#b0a090` | `text-faint` |
| `--color-gold` | `#c9a84c` | `text-gold` / `bg-gold` |
| `--color-gold-dark` | `#9a7a2e` | `text-gold-dark` / `bg-gold-dark` |
| `--color-border` | `rgba(154,122,46,.20)` | `border-base` |
| `--color-border-strong` | `rgba(154,122,46,.30)` | `border-gold` |
| `--color-red` | `#c0392b` | `text-pos` |
| `--color-redlt` | `#f9e8e7` | `bg-pos-soft` |
| `--color-grn` | `#2e7d52` | `text-neg` |
| `--color-grnlt` | `#edf7f1` | `bg-neg-soft` |

#### Scenario: 背景色與 sidebar 對比

- **WHEN** 頁面載入完成
- **THEN** sidebar 背景為 `#1f1509`、內容區為 `#f0e6d0`、卡片為 `#fff9ef`

#### Scenario: 主色為金棕，禁用藍色作為品牌色

- **WHEN** 任何互動元素（按鈕、連結、active tab、編號徽章）渲染
- **THEN** 主色為 `var(--color-gold-dark)` (#9a7a2e)，hover 為 `var(--color-gold)` (#c9a84c)
- **AND** 全站不得使用 `text-blue-*` / `bg-blue-*` 系列 utility

#### Scenario: 紅漲綠跌沿用

- **WHEN** 顯示 KPI 數字或損益
- **THEN** 正值用 `text-pos` (#c0392b)、負值用 `text-neg` (#2e7d52)
- **AND** 軟色背景用 `bg-pos-soft` / `bg-neg-soft`

#### Scenario: 禁止硬編色值

- **WHEN** 任何元件使用 `text-[#xxx]` 或 `bg-[#xxx]`（Recharts stroke 除外）
- **THEN** code review 應拒絕；ESLint 規則（若有）應警告

### Requirement: 字型與字級 Token 定義

系統 SHALL 匯入 Google Fonts 之 Noto Serif TC（標題、KPI 大數）與 Noto Sans TC（內文），並定義字級 token。

#### Scenario: 字體匯入

- **WHEN** 頁面載入
- **THEN** `<head>` 含 Noto Serif TC（weight 400/600/700/900）與 Noto Sans TC（weight 300/400/500）連結
- **AND** body 預設 font-family 為 `'Noto Sans TC', sans-serif`

#### Scenario: 標題使用 serif

- **WHEN** 渲染 `<h1>` 頁面標題、`.panel-title`、KPI 大數字、ResultCard 數字
- **THEN** font-family 為 `'Noto Serif TC', serif`

字級 token：

| Token | 大小 | 用途 |
|-------|-----|-----|
| `--font-size-hero` | 34px | HomePage 主視覺標題（serif 900） |
| `--font-size-display` | 36px | KPI 大數字（serif 900） |
| `--font-size-h1` | 22px | 頁面標題（serif 700） |
| `--font-size-h2` | 15px | panel-title / section-label（serif 700） |
| `--font-size-body` | 13.5px | 正文 |
| `--font-size-small` | 12px | 輔助說明 |
| `--font-size-label` | 11px | field label |
| `--font-size-caption` | 10.5px | 圖表刻度 / 提示 |

#### Scenario: 頁面標題使用 h1 token + serif

- **WHEN** 任何頁面渲染主標題
- **THEN** 字級為 22px、font-family Noto Serif TC、weight 700、letter-spacing 1px

#### Scenario: HomePage hero

- **WHEN** HomePage 主視覺標題渲染
- **THEN** 字級為 34px、weight 900、letter-spacing 5px、文字色 `var(--color-main)`

### Requirement: Sidebar Layout

系統 SHALL 在 `src/App.tsx` 採用「左側固定 sidebar（196px）+ 主內容區（max-width 980px 置中）」的桌機佈局，取代頂部 NavBar。

#### Scenario: Sidebar 結構

- **WHEN** 任何頁面渲染
- **THEN** 左側顯示固定 sidebar（width 196px、bg #1f1509、左貼齊）
- **AND** sidebar 含頂部 logo 區（「獲利加速輔助系統」serif 標題 + 「阮慕驊課程工具」副標）
- **AND** sidebar 含 5 個 nav item：首頁、個股分析、投資組合、比較分析、績效分析（每個帶 SVG icon）

#### Scenario: Nav active 狀態

- **WHEN** 當前路由匹配某 nav item
- **THEN** 該 item 背景為 `rgba(201,168,76,.13)`、文字色為 `var(--color-gold)`、weight 500

#### Scenario: 主內容區置中

- **WHEN** 任何頁面渲染
- **THEN** 主內容包在 `.inner`（max-width 980px、margin auto、padding 52px 28px 100px）

### Requirement: 元件視覺對齊 ui-spec

系統 SHALL 使所有共用元件視覺對齊 ui-spec 範本。

#### Scenario: Panel 卡片

- **WHEN** 渲染 SectionBlock 或 panel
- **THEN** 背景 `bg-surface` (#fff9ef)、邊框 `border-base` (rgba(154,122,46,.20))、padding 26px、border-radius 8px
- **AND** panel-title 為 serif 15px weight 700 色 `text-main`，panel-sub 為 sans 11.5px 色 `text-dim`

#### Scenario: 按鈕 ghost / solid

- **WHEN** 渲染按鈕
- **THEN** btn-ghost：透明底 + 金邊 `border-gold` + 文字 `text-gold-dark`、hover 加深
- **AND** btn-solid：底色 `bg-gold-dark` + 文字白、hover 變 `bg-gold` + 文字 `text-main`

#### Scenario: Status badge

- **WHEN** 顯示 sbadge（如「整體配置具正期望值」）
- **THEN** 含 6px 金色圓點（pulse 動畫 2s）+ 金邊外框 + 金棕文字

#### Scenario: Diagnosis item 三色

- **WHEN** 顯示診斷項目
- **THEN** advantage / ok：底色 `bg-neg-soft` + 文字 `text-neg`
- **AND** warning：底色 #fef9ec + 文字 `text-gold-dark`
- **AND** alert / bad：底色 `bg-pos-soft` + 文字 `text-pos`

#### Scenario: Metric card

- **WHEN** 顯示 KPI metric-card
- **THEN** 背景 `bg-card2` (#ede0c4)、邊框淡金、padding 16px 18px
- **AND** 數字字級 22–36px、font-family serif、weight 700

### Requirement: EV 象限評級徽章視覺對齊

系統 SHALL 使 `QuadrantBadge` 在 `size="large"` 模式下對 EV 象限採 vertical 佈局，並依紅漲綠跌調整配色。

#### Scenario: Large 模式 vertical 佈局

- **WHEN** `QuadrantBadge` 以 `size="large"` 渲染 EV 象限
- **THEN** 佈局為 vertical：icon (22px) 在上、兩行 serif 13px 標題（如「高賠率」+「正期望值」）置中、最下方副標 (10.5px、字間距 1px) 顯示「最佳評級」/「勝率驅動」/「勝率不足」/「避免操作」之一
- **AND** 容器 `min-w-[140px]`、padding `px-5 py-4`、`border-2`

#### Scenario: 紅漲綠跌配色

- **WHEN** EV 象限為「高賠率正期望值（最佳）」
- **THEN** 配色為紅系（`bg-red-50` + `text-red-700` + `border-red-300`），對應紅漲 = 正向最佳
- **AND** 「低賠率負期望值（避免）」配色為綠系，對應綠跌 = 應避免
- **AND** 「低賠率正期望值（勝率驅動）」與「高賠率負期望值」配色為 amber，對應警示

### Requirement: 多尺度卡片視覺對齊

系統 SHALL 使 `MultiScaleEVBlock` 的三尺度卡片（短/中/長）採統一 cream 底 + 內容左對齊。

#### Scenario: 卡片背景與佈局

- **WHEN** 渲染短/中/長尺度卡片
- **THEN** 卡片背景為 `bg-card2` (#ede0c4)、邊框 `border-base`、hover 邊框加深
- **AND** 內容左對齊，依序顯示：尺度 label（10.5px、字間距 1.5px、dim 色）→ windowDesc（10.5px）→「年化 EV」label（10.5px）→ 大數字（serif 24px、紅漲綠跌依正負）→ 評級文字（10.5px、dim）→ 樣本警語（短期才顯示，10.5px、faint）

#### Scenario: Divergence banner 採 sbadge 樣式

- **WHEN** 渲染 Divergence 判讀橫幅
- **THEN** 採 `.sbadge` 緊湊 inline-flex 樣式（金邊外框、金色文字、padding 8px 14px）
- **AND** 文字左側含 `.sdot` 6px 金色圓點（2s pulse 動畫）

#### Scenario: 長期勝敗率 stats row

- **WHEN** 渲染長期勝敗率與平均盈虧
- **THEN** 上下 `border-t border-b border-base`、橫向 `flex flex-wrap`
- **AND** 各 stat 間以直立分隔線（`w-px h-3 bg-[rgba(154,122,46,0.18)]`）分隔
- **AND** 勝率與 Avg Gain 用紅色（紅漲）、敗率與 Avg Loss 用綠色（綠跌）

## ADDED Requirements (typography + decimal rules)

### Requirement: 全站採 Noto Sans TC 單一字型

系統 SHALL 全站使用 Noto Sans TC 作為唯一字型，移除 Noto Serif TC。

#### Scenario: 字體匯入

- **WHEN** 頁面載入
- **THEN** `<head>` 僅含 Noto Sans TC（weight 300/400/500/700/900）連結，不含 Noto Serif TC

#### Scenario: body 預設 font-family

- **WHEN** 任何文字渲染
- **THEN** font-family chain 為 `'Noto Sans TC', system-ui, -apple-system, sans-serif`

#### Scenario: 標題、KPI 數字統一 sans

- **WHEN** `<h1>`、`<h2>`、`.panel-title`、KPI 大數、`.num`、`.font-serif` 渲染
- **THEN** font-family 均為 `'Noto Sans TC', sans-serif`
- **AND** `.font-serif` class 暫保留為 alias 指向 sans，避免大規模 markup 改動

#### Scenario: 數字 tabular-nums

- **WHEN** `.num` class 套用
- **THEN** 含 `font-variant-numeric: tabular-nums`，數字等寬對齊

### Requirement: 全站小數位分類規則

系統 SHALL 在 `src/utils/format.ts` 提供 5 個分類 utility，所有顯示遵循其預設精度。

#### Scenario: 金額顯示

- **WHEN** 呼叫 `fmtMoney(312450)`
- **THEN** 回傳 `'312,450'`（0 位小數、千分位、無正負號）

#### Scenario: 百分比顯示

- **WHEN** 呼叫 `fmtPct(0.1234)`
- **THEN** 回傳 `'+12.3%'`（預設 1 位小數、自動加 +/− 號）

- **WHEN** 呼叫 `fmtPct(-0.045)`
- **THEN** 回傳 `'−4.5%'`

- **WHEN** 呼叫 `fmtPct(0)`
- **THEN** 回傳 `'0.0%'`（0 不加號）

- **WHEN** 呼叫 `fmtPct(0.013253, 4)`
- **THEN** 回傳 `'+1.3253%'`（顯式指定 4 位仍生效）

#### Scenario: 勝率顯示

- **WHEN** 呼叫 `fmtWinRate(0.6)`
- **THEN** 回傳 `'60%'`（0 位、無正負號）

- **WHEN** 呼叫 `fmtWinRate(0.5833)`
- **THEN** 回傳 `'58%'`

#### Scenario: 一般指標顯示

- **WHEN** 呼叫 `fmtRatio(1.4267)`
- **THEN** 回傳 `'1.43'`（2 位、無正負號）

- **WHEN** 呼叫 `fmtRatio(Infinity)`
- **THEN** 回傳 `'∞'`

#### Scenario: 萬元金額

- **WHEN** 呼叫 `fmtWan(285000)`
- **THEN** 回傳 `'28.5 萬'`

### Requirement: 元件呼叫一致性

全站元件 SHALL 不再使用 inline `toFixed` / `(x*100).toFixed` 等格式化邏輯，改呼叫 utility。

#### Scenario: 勝率/敗率呼叫 fmtWinRate

- **WHEN** PortfolioPerformanceBlock、MultiScaleEVBlock、cmp-table 等渲染勝率/敗率
- **THEN** 統一呼叫 `fmtWinRate(rate)`，不再 inline `(rate * 100).toFixed(2)`

#### Scenario: 賠率/PF/Hurst/D 呼叫 fmtRatio

- **WHEN** 渲染賠率、獲利因子、Hurst、D 值
- **THEN** 統一呼叫 `fmtRatio(value)`（預設 2 位）

#### Scenario: 金額呼叫 fmtMoney

- **WHEN** 渲染損益、平均獲利/虧損、總投入等元金額
- **THEN** 統一呼叫 `fmtMoney(value)`（0 位、千分位）

## ADDED Requirements (readable labels + base values)

### Requirement: 指標命名集中表

系統 SHALL 在 `src/lib/labels.ts` 提供集中命名表 `METRIC_LABELS`，所有 UI 字串從此匯入，禁止散落寫死。

#### Scenario: 集中表內容

- **WHEN** 任何元件渲染指標標題
- **THEN** 由 `METRIC_LABELS` 取得字串，至少包含：
  - `evAnnual` = '年化期望報酬率'
  - `payoffRatio` = '損益比'
  - `profitFactor` = '獲利因子'
  - `winRate` = '勝率'、`lossRate` = '敗率'
  - `hurstH` = '趨勢強度 H'
  - `fractalD` = '分形維度 D'
  - `var95` / `var99` = '95% 下行虧損' / '99% 下行虧損'
  - `mcP5` / `mcP50` / `mcP95` = '悲觀情境' / '中位情境' / '樂觀情境'
  - `totalPnl` = '總實現損益'
  - `overallReturn` = '整體報酬率'
  - `avgHolding` = '平均持有天數'

### Requirement: 指標卡視覺層級統一規格

所有指標卡 SHALL 採統一視覺層級：主標題 → 視窗描述 → 指標名稱 → 主數字 → 底層值 → 評級 chip → 警語。

#### Scenario: 卡片內容由上至下

- **WHEN** 任何指標卡（EV / VaR / Hurst / D / MC / 績效 metric）渲染
- **THEN** 依序呈現：
  1. 主標題（18px 粗體，或 reference tier 弱化）
  2. 視窗描述（11px dim，僅有窗口概念的卡片）
  3. 指標名稱（13px dim）
  4. 主數字（28–36px 粗體 + 紅漲綠跌）
  5. 底層值（11px dim，必有）
  6. 評級 chip（若該指標有狀態判讀）
  7. 警語（若樣本不足）

#### Scenario: 底層值內容對應

- **WHEN** 卡片渲染底層值
- **THEN** 依下表對應：
  - EV 卡片 → 「日平均報酬率 X%」或「月平均報酬率 X%」
  - VaR 卡片 → 「N 筆日報酬第 K 百分位」
  - Hurst H 卡片 → 「R/S 迴歸斜率（M 點）」
  - 分形維度 D 卡片 → 「H = X（D = 2 − H）」
  - Monte Carlo 中位 / 悲觀 / 樂觀 → 「μ=X% / σ=Y%」
  - 績效 metric-card → 依 D3 對應表（總投入 / 年化 / 勝場數比 / 等）

### Requirement: 全站「賠率」改稱「損益比」

所有使用者面對的字串 SHALL 將「賠率」改為「損益比」；內部變數 / type / 函式名稱保持 `payoff` / `payoffRatio`。

#### Scenario: UI 文字

- **WHEN** 任何元件、診斷訊息、建議文案、PDF / Excel 匯出顯示
- **THEN** 顯示「損益比」，不顯示「賠率」

#### Scenario: 內部命名保留

- **WHEN** code 中變數 / interface / type 使用 `payoffRatio`
- **THEN** 不變更，僅 UI 字串改

### Requirement: VaR 與 Monte Carlo 命名

- VaR 95% / 99% SHALL 顯示為「95% 下行虧損」/「99% 下行虧損」
- Monte Carlo P5 / P50 / P95 SHALL 顯示為「悲觀情境」/「中位情境」/「樂觀情境」
- 副標可保留技術名稱（如「VaR 95%」、「P50 終值」）作為小字輔助

#### Scenario: VaR 主標

- **WHEN** VarBlock 渲染
- **THEN** 區塊內主指標卡標題為「95% 下行虧損」/「99% 下行虧損」

#### Scenario: Monte Carlo 主標

- **WHEN** McBlock 渲染各情境
- **THEN** 標題為「悲觀情境」「中位情境」「樂觀情境」

### Requirement: 合規詞彙集中表

系統 SHALL 在 `src/lib/wording.ts` 提供 `WORDING` 物件與 `COMPLIANCE_FOOTER` 常數，集中所有「使用者面對的合規敏感詞彙」。

#### Scenario: WORDING 內容

- **WHEN** 元件需要顯示區塊標題、chip、評級註記等
- **THEN** 從 `WORDING` 匯入，不直接寫死字串
- **AND** 至少包含：actionGuideTitle、recommendationTitle、diagnosisTitle、shortTermVerdict、longTermVerdict、excelDiagSheet、quadrantBestNote、quadrantWorstNote

#### Scenario: COMPLIANCE_FOOTER 內容

- **WHEN** 引用 `COMPLIANCE_FOOTER`
- **THEN** 為「本系統所有分析皆為統計教學示例，非投資建議，不構成買賣依據。投資人應依自身判斷負責。」
- **AND** 註解保留原始（替換前）值方便未來還原

### Requirement: Quadrant 標籤合規化

`Quadrant` type 字面量 SHALL 採中性「評級註記」用詞。

#### Scenario: 字面量內容

- **WHEN** `Quadrant` type 定義
- **THEN** 雙優：`'高賠率正期望值（雙優）'`、較弱：`'低賠率負期望值（較弱）'`
- **AND** 其他兩個維持：`'低賠率正期望值（勝率驅動）'`、`'高賠率負期望值（賠率驅動但勝率不足）'`

### Requirement: 4 個分析頁加合規 Footer

系統 SHALL 在 IndividualPage、PortfolioPage、ComparePage、PerformancePage 四個分析頁底部（結果區最末）渲染 `<ComplianceFooter />`。

#### Scenario: Footer 渲染條件

- **WHEN** 該頁有計算結果顯示
- **THEN** 結果區塊最底渲染 ComplianceFooter
- **AND** Footer 含 ⚠ 圖示 + `COMPLIANCE_FOOTER` 文字

### Requirement: ActionGuide 內 disclaimer 強化

`ActionGuide.tsx` 內既有的 disclaimer 字串 SHALL 改為與 `COMPLIANCE_FOOTER` 一致。

#### Scenario: 統一文字

- **WHEN** ActionGuide 渲染 footer
- **THEN** 文字與 `COMPLIANCE_FOOTER` 一致（含 ⚠ 圖示）
