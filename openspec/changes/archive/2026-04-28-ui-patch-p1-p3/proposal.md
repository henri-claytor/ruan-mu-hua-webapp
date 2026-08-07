# Proposal: UI Patch P1–P3 視覺梳理

## 背景

目前 web-app 存在三個視覺品質問題：
1. KPI 數字使用 system sans-serif，小數點與符號寬度不等，導致欄位對齊破版
2. 導覽列、象限徽章、首頁卡片使用 Emoji 圖標，在 Windows / Android 上渲染不一致
3. 圖表顏色（Recharts stroke）直接寫死 hex，未來換主題或做夜間模式需要多處修改

## 目標

套用設計師提供的 Patch P1–P3，完成視覺梳理：

- **P1** — 建立等寬數字字體軌道（JetBrains Mono + tabular-nums），讓所有 KPI、VaR、蒙地卡羅數字整齊對齊
- **P2** — 以 Lucide 風格 SVG 圖標取代所有 Emoji（導覽 4 個 + 象限 4 個）
- **P3** — 將強調色提升為 CSS 變數（@theme token），chartStyle.ts 改讀 CSSOM，建立 single source of truth

## 影響範圍

- `index.html` — 載入 Google Fonts
- `src/index.css` — 新增字型 token、`.num` utility、色彩 token
- `src/utils/chartStyle.ts` — 改讀 CSS 變數
- `src/components/ResultCard.tsx` — KPI 數值加 `num` class
- `src/components/icons.tsx` — 新增（9 個 SVG 圖標）
- `src/components/QuadrantBadge.tsx` — Emoji → SVG
- `src/components/NavBar.tsx` — Emoji → SVG
- `src/pages/HomePage.tsx` — Emoji → SVG，移除已失效 /hurst 卡片
- `src/pages/IndividualPage.tsx` — P5/P50/P95、Hurst 步驟加 `num`
- `src/pages/PortfolioPage.tsx` — P5/P50/P95、比重合計加 `num`
- `src/pages/ComparePage.tsx` — 數值 td 加 `num`

## 不在範圍內

- ResultCard / QuadrantBadge 的 Tailwind color class（`bg-green-50` 等）暫維持硬編碼，下一階段再遷移至 token
- 夜間模式（Dark Mode）
