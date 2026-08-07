# Tasks: UI Patch P1–P3

## P1 — 等寬數字字體軌道

- [x] `index.html`：新增 Google Fonts preconnect + JetBrains Mono stylesheet link
- [x] `src/index.css`：`@theme` 新增 `--font-sans` / `--font-num` token
- [x] `src/index.css`：`body` 改用 `var(--font-sans)`
- [x] `src/index.css`：新增 `.num` utility（font-family + tabular-nums + tnum/cv11 + letter-spacing）
- [x] `src/components/ResultCard.tsx`：value `<span>` 加 `num` class
- [x] `src/pages/IndividualPage.tsx`：P5/P50/P95 數值加 `num`；Hurst 步驟計算欄加 `num`
- [x] `src/pages/PortfolioPage.tsx`：P5/P50/P95 數值加 `num`；比重合計 span 加 `num`
- [x] `src/pages/ComparePage.tsx`：數值 td 包 `<span className="num">`

## P2 — SVG 圖標集

- [x] `src/components/icons.tsx`：新增（9 個圖標：Home、BarChart、Folder、Scale、Trophy、Check、Alert、Ban、Wave）
- [x] `src/components/QuadrantBadge.tsx`：Emoji → SVG（Trophy、Check、Alert、Ban）
- [x] `src/components/NavBar.tsx`：Emoji → SVG（Home、BarChart、Folder、Scale）；移除 📈 標題 emoji
- [x] `src/pages/HomePage.tsx`：Emoji → SVG（BarChart、Folder、Scale）；移除 📈 hero emoji；移除 /hurst 工具卡片

## P3 — CSS 變數色彩系統

- [x] `src/index.css`：`@theme` 新增 11 個語意色彩 token（positive/negative/attention/accent 各含 soft 版；bar/grid/ref）
- [x] `src/utils/chartStyle.ts`：全部 hex 改為 `token()` 讀取 CSS 變數；新增 SSR fallback；tooltip 加 `fontFamily` + `fontVariantNumeric`
