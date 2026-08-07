## Why

目前 web-app 採 iOS Finance Light Theme（藍色 + 灰階），雖然乾淨但缺少「課程質感」與品牌感，與「阮慕驊獲利加速輔助系統」的課程定位不符。使用者已提供 `ui-spec.html` 完整視覺稿，採金棕 + 奶油色 + Noto Serif TC 標題的「課程質感」配色，需要將整個 web-app 切換到此新主題。

## What Changes

- **BREAKING**：design tokens 全面更換
  - 背景：`#F2F2F7` → 奶油 `#f0e6d0`（內容區）+ 深棕 `#16100a`（sidebar）
  - 卡片：`#FFFFFF` → 象牙白 `#fff9ef`，金色邊框 `rgba(154,122,46,.2)`
  - 主色：藍 `#2563EB` → 金棕 `#9a7a2e` / `#c9a84c`
  - 文字：iOS 灰階 → 深棕系 `#1a1108` / `#3a2a18` / `#7a6a50`
  - 紅綠：紅 `#DC2626` → `#c0392b`、綠 `#16A34A` → `#2e7d52`（沿用紅漲綠跌）
- **字體**：Inter / 系統字 → Noto Serif TC（標題、KPI 大數字）+ Noto Sans TC（內文）
- **字級**：
  - h1 18px → 22px（頁面標題，serif、letter-spacing 1px）
  - hero h1 新增 34px（首頁主視覺）
  - 區塊標題 panel-title 15px（serif）
  - body 13 → 13.5px、KPI display 36px（保留）
- **頁面 layout 改造**：
  - 左側 196px 固定深色 sidebar（取代頂部 NavBar），含 5 個 nav 項目
  - 內容區 max-width 980px 置中，padding `52px 28px 100px`
  - HomePage：加入 hero 主視覺、3 卡片 grid（個股 / 組合 / 比較）、寬卡片（績效）、howto 步驟區
- **元件樣式對齊 ui-spec**：
  - `.panel`（標題 serif、副標 muted、白底金邊）
  - `.btn-ghost` / `.btn-solid`（金色邊框 / 金色實底）
  - `.metric-card`（cream 底 + serif 數字）
  - `.sbadge`（金色 status + pulse dot）
  - `.diag-item` 三色（warn 金 / ok 綠 / bad 紅，與 DiagnosisPanel level 對映）
  - `.cmp-table`（比較表 .win 綠底高亮）
- **保留**：所有計算邏輯、資料流、Zustand store、tests、API 整合不動

## Capabilities

### Modified Capabilities

- `design-system-tokens`：色票全面替換為「課程質感」系統、字體加入 Noto Serif/Sans TC、字級微調
- `result-first-layout`：HomePage 新增 hero + 卡片入口、整體頁面採 sidebar layout

## Impact

- **影響檔案**：
  - `src/index.css`（tokens、字體匯入、global styles）
  - `tailwind.config.*`（如有 — 確認 utility 對應）
  - `src/components/NavBar.tsx` → `Sidebar.tsx`（左側固定欄）
  - `src/App.tsx`（layout 容器調整）
  - 所有頁面 `HomePage` / `IndividualPage` / `PortfolioPage` / `ComparePage` / `PerformancePage`
  - 共用元件 `ResultCard` / `SectionBlock` / `QuadrantBadge` / `ActionGuide` 等
  - `trade/*` 元件配色微調（DiagnosisPanel / RecommendationPanel / Matrix / Charts）
- **不影響**：`src/lib/**` 全部純函式邏輯、tests、Zustand store、API client
- **風險**：
  - Recharts 圖表 stroke 顏色需重新對映（藍 → 金棕、紅綠保留）
  - PDF / Excel 匯出視覺需重新檢視
  - 既有截圖文件可能需更新
