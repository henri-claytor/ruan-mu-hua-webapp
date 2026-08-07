## 1. MetricCard 加主判斷樣式

- [x] 1.1 `PortfolioPerformanceBlock` 內 MetricCard 加 `isPrimaryMain` prop
- [x] 1.2 isPrimaryMain：`relative bg-[#f4ead8] border-2 border-[#c9a84c]` + 右上「主判斷」chip
- [x] 1.3 isPrimaryMain：數字字級從 22px 放大為 40px
- [x] 1.4 其他卡維持原樣

## 2. PortfolioPerformanceBlock 主卡佈局

- [x] 2.1 「總實現損益」卡傳入 `isPrimaryMain`
- [x] 2.2 「總實現損益」卡外層加 `md:col-span-2`
- [x] 2.3 確認其他 7 卡分布合理（grid-cols-4 / col-span-1）

## 3. PerformancePage 區塊順序

- [x] 3.1 重點建議從原位置移到 Dashboard 之前（hasTrades 條件保留）
- [x] 3.2 自動診斷從原位置移到重點建議之後、Dashboard 之前
- [x] 3.3 區塊 wrapper id（`performance-recommendations` / `performance-diagnosis` / `performance-dashboard`）順序調整

## 4. PDF section ids 重排

- [x] 4.1 `PDF_SECTION_IDS` 陣列順序調整：banner → recommendations → diagnosis → dashboard → matrix → charts → trades

## 5. 命名抽查

- [x] 5.1 grep `賠率`、`EV` 在 PerformancePage 相關元件
- [x] 5.2 確認 PortfolioPerformanceBlock 計算步驟「損益比 =」已正確
- [x] 5.3 PerformanceCharts subtitle 殘留檢查

## 6. 驗證

- [x] 6.1 `npx tsc --noEmit` 通過
- [x] 6.2 `npx vitest run` 通過（含 performance-page-layout spec）
- [x] 6.3 `npm run build` 通過
- [x] 6.4 瀏覽器確認：
  - 區塊順序：banner → 輸入 → 重點建議 → 診斷 → Dashboard → 矩陣 → Charts → 交易表
  - 「總實現損益」卡金邊 + 「主判斷」chip + 40px
  - PDF 匯出順序一致
- [x] 6.5 部署 Vercel
