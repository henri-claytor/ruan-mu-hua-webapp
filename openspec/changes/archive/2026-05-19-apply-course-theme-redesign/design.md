# Design: 課程質感主題重新設計

## Context

使用者提供 `ui-spec.html` 視覺稿，定義了一套「課程質感」的色票與排版系統，需替換現有 iOS Finance Light Theme。重點是**只動視覺層，不動邏輯與資料流**。

新主題核心：
- **暗色 sidebar + 奶油內容區**的雙背景對比
- **金棕主色**取代藍色作為品牌色與互動色
- **Noto Serif TC** 用於標題與大數字，營造「印刷品」質感
- **紅漲綠跌**維持台股慣例

## Goals / Non-Goals

**Goals:**
- 全站視覺切換到 ui-spec 定義的色票與字體
- 頁面 layout 改為 sidebar + 置中內容區
- HomePage 加入 hero / 卡片入口 / howto 步驟
- 元件樣式對齊 ui-spec 範本（panel / btn / metric-card / sbadge / diag-item）
- 保留紅漲綠跌（status 色 mapping 不變）

**Non-Goals:**
- 不改任何計算邏輯（`src/lib/**` 完全不動）
- 不改 Zustand store
- 不改 API integration
- 不改頁面內容資訊架構（只動配色 + 排版）
- 不改 Recharts 視覺化邏輯（只調 stroke 色）

## Decisions

### D1 — Design Tokens 全面替換

**決策**：

```css
:root {
  /* 背景 */
  --color-bg:       #16100a;  /* 深棕（sidebar） */
  --color-bg2:      #1f1509;  /* 次深棕 */
  --color-bg3:      #2a1c0f;
  --color-app:      #f0e6d0;  /* 主內容區（取代 #F2F2F7） */
  --color-surface:  #fff9ef;  /* 卡片（取代 #FFFFFF） */
  --color-elevated: #f4ead8;  /* 浮層卡片 */
  --color-card2:    #ede0c4;  /* 第二層 cream */

  /* 文字 */
  --color-main:  #1a1108;     /* 主文字（深棕） */
  --color-main2: #3a2a18;     /* 次主文字 */
  --color-dim:   #7a6a50;     /* 輔助文字 */
  --color-faint: #b0a090;     /* 弱化文字 / placeholder */

  /* 邊框 */
  --color-border: rgba(154,122,46,.20);
  --color-border-strong: rgba(154,122,46,.30);

  /* 主色（金棕） */
  --color-gold:  #c9a84c;
  --color-gold2: #e0c070;
  --color-gold3: #9a7a2e;     /* 主互動色（取代 #2563EB） */

  /* 紅綠（沿用紅漲綠跌） */
  --color-red:   #c0392b;
  --color-redlt: #f9e8e7;
  --color-grn:   #2e7d52;
  --color-grnlt: #edf7f1;
}
```

**理由**：直接套用 ui-spec.html 的 token 名稱與值，確保 1:1 對應。

### D2 — Tailwind utility mapping

**決策**：保留現有 utility 名稱（`bg-app` / `bg-surface` / `text-main` / `text-dim` / `border-base`），只改背後 CSS 變數值。新增 gold utility：

| Utility | Value |
|---------|-------|
| `bg-app` | `var(--color-app)` (#f0e6d0) |
| `bg-surface` | `var(--color-surface)` (#fff9ef) |
| `bg-elevated` | `var(--color-elevated)` (#f4ead8) |
| `bg-card2` | `var(--color-card2)` (#ede0c4) — **新增** |
| `bg-sidebar` | `var(--color-bg2)` (#1f1509) — **新增** |
| `text-main` | `var(--color-main)` (#1a1108) |
| `text-dim` | `var(--color-dim)` (#7a6a50) |
| `text-faint` | `var(--color-faint)` (#b0a090) |
| `text-gold` | `var(--color-gold)` (#c9a84c) — **新增** |
| `text-gold-dark` | `var(--color-gold3)` (#9a7a2e) — **新增** |
| `border-base` | `var(--color-border)` |
| `border-gold` | `var(--color-border-strong)` — **新增** |

**理由**：保留 utility 名稱可降低改動面（大部分 .tsx 不用改 className）。藍色相關 utility（`text-blue-600` / `bg-blue-600` 等）需手動替換為 `text-gold-dark` / `bg-gold-dark`。

### D3 — 字體與字級

**決策**：

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700;900&family=Noto+Sans+TC:wght@300;400;500&display=swap');

:root {
  --font-serif: 'Noto Serif TC', serif;
  --font-sans:  'Noto Sans TC', sans-serif;
  --font-size-hero:    34px;  /* 新增 — HomePage 主視覺 */
  --font-size-display: 36px;  /* KPI 大數字 */
  --font-size-h1:      22px;  /* 18 → 22 */
  --font-size-h2:      15px;  /* 14 → 15（panel title） */
  --font-size-body:    13.5px;/* 13 → 13.5 */
  --font-size-small:   12px;
  --font-size-label:   11px;
  --font-size-caption: 10.5px;
}
body { font-family: var(--font-sans); }
.font-serif, h1, h2.serif, .display { font-family: var(--font-serif); }
```

**理由**：標題用 serif 是 ui-spec 核心特色；body 字級略放大提升可讀性。

### D4 — Layout：固定 sidebar + 置中內容

**決策**：

```tsx
// App.tsx
<div className="flex min-h-screen bg-app">
  <Sidebar />                            {/* 196px 固定，深色 */}
  <main className="flex-1 ml-[196px] bg-app">
    <div className="max-w-[980px] mx-auto px-7 pt-13 pb-25">
      <Routes>...</Routes>
    </div>
  </main>
</div>
```

**Sidebar 結構**：
- 頂部 logo 區（標題「獲利加速輔助系統」serif + 副標）
- 5 個 nav item（首頁 / 個股分析 / 投資組合 / 比較分析 / 績效分析）
- nav-item active：金色背景 `rgba(201,168,76,.13)` + 金色文字 + 左側 SVG icon

**手機 RWD**（暫不處理，第一版 desktop only）：sidebar 維持顯示，內容區自動 overflow。如要做手機版可後續再 propose。

**理由**：ui-spec 設計即為 desktop-first 課程工具，sidebar 固定可一直看到品牌名稱。

### D5 — HomePage 重新設計

**決策**：

```tsx
<div className="inner">
  <Hero />                              {/* 34px serif + 雙行副標 */}
  <SectionLabel>進場前評估</SectionLabel>
  <Grid3>
    <FeatureCard to="/individual" icon={Bars} title="個股分析" desc="..." />
    <FeatureCard to="/portfolio"  icon={Folder} title="投資組合" desc="..." />
    <FeatureCard to="/compare"    icon={Pulse}  title="比較分析" desc="..." />
  </Grid3>
  <SectionLabel>出場後反思</SectionLabel>
  <WideCard to="/performance" title="績效分析" desc="..." />
  <Howto />                             {/* 4 步驟 grid */}
</div>
```

**動畫**：頁面進入用 `u1`–`u6` class（漸入 + 上滑 0.45s）

**理由**：原 HomePage 較簡單；ui-spec hero + 卡片入口符合課程工具門面。

### D6 — 元件樣式對齊

**決策表**：

| 元件 | 改造方向 |
|------|---------|
| `SectionBlock` | h2 改 serif、底色 `bg-surface`、邊框 `border-base`（金邊） |
| `ResultCard` | 數字部分加 `font-serif`、cream 底 |
| `QuadrantBadge` | 配色 mapping 改用 cream + 金邊 + serif 數字 |
| `ActionGuide` | 三色 badge：warn 金 / ok 綠 / bad 紅 |
| `TradeInputTable` | 表頭金邊、hover 金色 |
| `TradeFileUpload` | 仿 `.upload-area`：dashed 金邊 + 金色 hover |
| `ExportMenu` | 按鈕用 `.btn-ghost` + `.btn-solid` 樣式 |
| `DiagnosisPanel` | level 配色 mapping 微調（advantage 仍綠、alert 仍紅、warning 用金棕 `#9a7a2e`） |
| `RecommendationPanel` | 編號徽章從藍底 → 金棕底（`bg-gold-dark`） |
| `PortfolioPerformanceBlock` | metric-card 改 cream 底 + serif 數字 |
| `StockQuadrantMatrix` | 表頭金邊、win 列加金色微底 |
| `PerformanceCharts` | Recharts stroke：藍 → `#9a7a2e`、grid 線 → `rgba(154,122,46,.15)` |
| `QuadrantLegend` | 邊框與標題配色金棕化 |

### D7 — 互動細節

**決策**：

- **Status badge**（`.sbadge`）：金色邊框 + 金色 dot + pulse 動畫 → 新增為共用元件 `<StatusBadge>` 或直接於 PortfolioPerformanceBlock / IndividualPage 使用
- **Ripple 效果**：保留 ui-spec 範本程式碼，作為 `useRipple()` hook 或 `<RippleHost>` 共用元件，套用在主要 card 上
- **頁面進入動畫**：`u1`–`u6` 漸入 → 加到 `index.css` 的 keyframes，主要頁面元素套用

**理由**：互動細節是品牌感的關鍵，不可省略。但 ripple 與動畫只在首頁、卡片入口、結果區用，不過度使用。

### D8 — 紅綠映射保留

**決策**：所有現有 `text-red-700` / `text-red-500` / `text-green-700` 替換為新 token：

| 舊 utility | 新 utility | 對應 CSS var |
|-----------|----------|--------------|
| `text-red-700` / `text-red-500` | `text-pos` | `var(--color-red)` (#c0392b) |
| `text-green-700` / `text-green-600` | `text-neg` | `var(--color-grn)` (#2e7d52) |
| `bg-red-50` / `bg-red-100` | `bg-pos-soft` | `var(--color-redlt)` (#f9e8e7) |
| `bg-green-50` / `bg-green-100` | `bg-neg-soft` | `var(--color-grnlt)` (#edf7f1) |
| `border-red-200` | `border-pos` | rgba(192,57,43,.2) |
| `border-green-200` | `border-neg` | rgba(46,125,82,.2) |

**理由**：仍紅漲綠跌，但色值統一為 ui-spec 的標準色。

### D9 — Recharts 配色

**決策**：

```ts
// utils/chartStyle.ts
export const CHART_COLORS = {
  primary: '#9a7a2e',     // 主色（藍 → 金棕）
  pos:     '#c0392b',     // 紅（漲）
  neg:     '#2e7d52',     // 綠（跌）
  grid:    'rgba(154,122,46,.15)',
  axis:    '#7a6a50',
}
export const TOOLTIP_STYLE = {
  backgroundColor: '#fff9ef',
  border: '1px solid rgba(154,122,46,.2)',
  borderRadius: 8,
  fontFamily: "'Noto Sans TC', sans-serif",
}
export const AXIS_TICK_STYLE = { fill: '#7a6a50', fontSize: 11 }
```

### D10 — 影響檔案盤點與 Migration 順序

**Migration 順序**：

1. **Phase 1：tokens**：
   - 改 `src/index.css`（變數、字體匯入、global styles）
   - 改 `tailwind.config.*`（如有則改，否則改 inline @theme）
   - 加上 `text-pos` / `text-neg` / `text-gold-dark` 等新 utility

2. **Phase 2：layout 框架**：
   - 新增 `src/components/Sidebar.tsx`（取代 NavBar 用法）
   - 改 `src/App.tsx` 引入 Sidebar + main 容器
   - 移除 / 保留 `NavBar.tsx`（可保留供未來手機版用）

3. **Phase 3：頁面**：
   - `HomePage`：加 Hero / Grid3 / WideCard / Howto
   - `IndividualPage` / `PortfolioPage` / `ComparePage` / `PerformancePage`：套用 page-hd / panel / inner 樣式

4. **Phase 4：元件**：
   - 改 `SectionBlock` / `ResultCard` / `QuadrantBadge` / `ActionGuide`
   - 改 `trade/*` 全部元件（DiagnosisPanel / RecommendationPanel / Matrix / Charts / Tables）

5. **Phase 5：utility 替換**：
   - 全域搜尋 `text-blue-` / `text-red-` / `bg-blue-` / `bg-green-` 並替換
   - 全域搜尋 `text-2xl` / `text-3xl` 並替換為 token

6. **Phase 6：驗證**：
   - `npx tsc --noEmit`
   - `npx vitest run`
   - `npm run build`
   - 瀏覽器 5 個頁面視覺確認
   - 部署 Vercel

## Risks / Trade-offs

- **改動面巨大**：估計 20+ 檔案受影響，但因 utility 名稱大多保留，文字編輯量可控
- **Recharts 圖表顏色需重新校準**：紅綠保留可降低風險
- **手機 RWD 暫不處理**：第一版 desktop only，後續可單獨 propose
- **既有截圖文件、PDF 範例需更新**：archived changes 不動，但目前活躍的 docs 可能需更新
- **使用者切換習慣需時間**：藍色 → 金棕對重度使用者是視覺衝擊，但符合「課程質感」品牌定位
