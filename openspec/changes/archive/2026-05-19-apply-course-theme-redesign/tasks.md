## 1. Design Tokens（Phase 1）

- [x] 1.1 `src/index.css`：加入 Noto Serif TC + Noto Sans TC 字體 `@import`
- [x] 1.2 `src/index.css`：替換 `:root` CSS 變數（bg / surface / elevated / card2 / main / main2 / dim / faint / gold / gold-dark / border / red / redlt / grn / grnlt）
- [x] 1.3 `src/index.css`：更新 `--font-size-*` token（hero 34、display 36、h1 22、h2 15、body 13.5、small 12、label 11、caption 10.5）
- [x] 1.4 `src/index.css`：定義 `body` 預設 sans、`.font-serif` 工具、`.display` 工具
- [x] 1.5 `tailwind.config.*`（或 `index.css` `@theme`）：擴充 `bg-shell` / `bg-sidebar` / `bg-card2` / `text-gold` / `text-gold-dark` / `bg-gold` / `bg-gold-dark` / `border-gold` / `text-pos` / `text-neg` / `bg-pos-soft` / `bg-neg-soft`
- [x] 1.6 加入 `u1`–`u6` 漸入動畫 keyframes 與 class
- [x] 1.7 加入 `.sdot` pulse 動畫

## 2. Layout：Sidebar（Phase 2）

- [x] 2.1 新增 `src/components/Sidebar.tsx`：196px 固定、深色背景、logo 區、5 個 nav item（含 SVG icon）
- [x] 2.2 `Sidebar`：active 狀態用 `useLocation` 判斷，套用金色 active 樣式
- [x] 2.3 `src/App.tsx`：移除頂部 NavBar 使用、改為 `<Sidebar />` + `<main className="ml-[196px] bg-app">` + 內部 `.inner` 容器
- [x] 2.4 確認 `NavBar.tsx` 是否仍被引用，若不需可保留檔案（暫不刪除）

## 3. HomePage 重新設計（Phase 3a）

- [x] 3.1 `HomePage.tsx`：新增 Hero 區塊（serif 34px 主標 + 兩行副標）
- [x] 3.2 加入 section label「進場前評估」+ 3 欄等寬卡片（grid-cols-3）：個股 / 組合 / 比較
- [x] 3.3 每張卡含 SVG icon、serif 標題、描述、「開始使用 →」cta，hover 上移 + 金色漸層橫條動畫
- [x] 3.4 加入 section label「出場後反思」+ card-wide（橫向佈局）：績效分析
- [x] 3.5 加入 howto 區塊（4 step grid，圓形編號徽章）
- [x] 3.6 各區塊套用 `u1`–`u6` 漸入動畫
- [x] 3.7 加入 ripple 效果（共用 hook `useRipple` 或 inline 實作）

## 4. 其他頁面樣式套用（Phase 3b）

- [x] 4.1 `IndividualPage`：page-hd（h1 22px serif + tag）、page-sub、field 包裹輸入區、actions 按鈕、panel 結構
- [x] 4.2 `PortfolioPage`：相同樣式 + stock-chips（金色 chip + × 移除）
- [x] 4.3 `ComparePage`：相同樣式 + 雙欄輸入 + cmp-table
- [x] 4.4 `PerformancePage`：相同樣式 + upload-area（dashed 金邊）

## 5. 共用元件樣式調整（Phase 4a）

- [x] 5.1 `SectionBlock`：標題 serif 15px、底色 surface、邊框 base
- [x] 5.2 `ResultCard`：數字加 font-serif、cream 底
- [x] 5.3 `QuadrantBadge`：色票對映金棕系（5 象限 + 單向紀錄）
- [x] 5.4 `ActionGuide`：三色 diag-item 樣式

## 6. trade/* 元件樣式調整（Phase 4b）

- [x] 6.1 `DiagnosisPanel`：level 配色 mapping 調整（advantage 仍綠、alert 仍紅、warning 改 #fef9ec + text-gold-dark、note 改金棕、info 改 cream）
- [x] 6.2 `RecommendationPanel`：編號徽章從藍 → `bg-gold-dark`、外層 panel 樣式對齊
- [x] 6.3 `PortfolioPerformanceBlock`：8 個 metric-card 改 cream + serif 數字
- [x] 6.4 `QuadrantLegend`：邊框與標題金棕化
- [x] 6.5 `StockQuadrantMatrix`：表頭金邊、win 列加金色微底
- [x] 6.6 `TradeInputTable`：表頭金邊、hover 金色
- [x] 6.7 `TradeFileUpload`：仿 `.upload-area` 樣式（dashed 金邊 + 金色 hover）
- [x] 6.8 `ExportMenu`：按鈕用 btn-ghost / btn-solid 樣式
- [x] 6.9 `RawTradeTable`：表頭金邊、border 金色
- [x] 6.10 `StockVsPortfolioComparison`：cmp-table 樣式對齊

## 7. Charts 與圖表配色（Phase 4c）

- [x] 7.1 更新 `src/utils/chartStyle.ts`（或 `chart-style`）：CHART_COLORS / TOOLTIP_STYLE / AXIS_TICK_STYLE 改金棕系
- [x] 7.2 確認 `PerformanceCharts.tsx` 與 `src/components/charts/*` 套用新色票
- [x] 7.3 grid 線改 `rgba(154,122,46,.15)`、axis tick 改 `text-dim`

## 8. utility 全域替換（Phase 5）

- [x] 8.1 全域搜尋 `text-blue-` / `bg-blue-` / `border-blue-`，替換為 `text-gold-dark` / `bg-gold-dark` / `border-gold`
- [x] 8.2 全域搜尋 `text-red-` / `bg-red-` / `border-red-`，整理為 `text-pos` / `bg-pos-soft` / `border-pos`（或保留 Tailwind 紅階若是 semantic 警示）
- [x] 8.3 全域搜尋 `text-green-` / `bg-green-`，整理為 `text-neg` / `bg-neg-soft`
- [x] 8.4 全域搜尋 `text-2xl` / `text-3xl` / `text-4xl`，替換為 token utility（如 display / h1）

## 9. 驗證（Phase 6）

- [x] 9.1 `npx tsc --noEmit` 通過
- [x] 9.2 `npx vitest run` 全部通過（logic 不變，應原樣通過）
- [x] 9.3 `npm run build` 通過
- [x] 9.4 瀏覽器手動確認 5 個頁面：HomePage / IndividualPage / PortfolioPage / ComparePage / PerformancePage
  - sidebar 顯示正確、active 狀態金色
  - 字體 Noto Serif / Sans TC 載入
  - panel / metric-card / btn / sbadge 視覺對齊 ui-spec
  - 紅漲綠跌沿用
  - PDF 匯出仍可運作（視覺可能微差，先確認不破）
- [x] 9.5 部署 Vercel

## 10. 個股頁視覺微調（Phase 7 — 部署後對比 ui-spec 微調）

- [x] 10.1 `MultiScaleEVBlock`：Divergence banner 改用 `.sbadge` 緊湊樣式 + `.sdot` 金色 pulse 圓點
- [x] 10.2 `MultiScaleEVBlock`：長期勝敗率 stats row 改用直線分隔（上下 border + `w-px h-3` 直立分隔）+ 標籤精簡為「長期勝敗率與平均盈虧（月頻）」
- [x] 10.3 `QuadrantBadge`：`size="large"` 模式對 EV 象限改 vertical 佈局（icon + 兩行 serif 標題 + 副標）
- [x] 10.4 `QuadrantBadge`：EV 象限配色翻轉成紅漲綠跌
  - 高賠率正期望值（最佳）→ 紅色（最佳評級）
  - 低賠率正期望值（勝率驅動）→ amber
  - 高賠率負期望值 → amber
  - 低賠率負期望值（避免）→ 綠色（避免操作）
- [x] 10.5 `MultiScaleEVBlock.ScaleCard`：統一卡片為 `bg-card2` cream 底 + 金色淡邊，所有內容（label、windowDesc、年化 EV 大數、評級、樣本警語）放卡內左對齊
- [x] 10.6 部署 Vercel
