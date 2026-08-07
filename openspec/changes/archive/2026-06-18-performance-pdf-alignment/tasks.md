## 1. 元件加 DOM id

- [x] 1.1 `ReportHeaderBlock.tsx` 外層 `<div>` 加 `id="performance-report-header"`
- [x] 1.2 `ComplianceFooter.tsx` 外層 `<div>` 加 `id="performance-compliance-footer"`

## 2. PerformancePage PDF 區塊清單

- [x] 2.1 `PerformancePage.tsx` 的 `PDF_SECTION_IDS` 改為 `['performance-report-header', 'performance-dashboard', 'performance-matrix', 'performance-recommendations', 'performance-compliance-footer']`

## 3. PDF 檔名中文化

- [x] 3.1 `ExportMenu.tsx` `exportPdf` 函式內檔名改為 `投資績效分析報告_${today()}.pdf`

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit` 通過
- [x] 4.2 `npx vitest run` 通過（223 passed）
- [x] 4.3 `npm run build` 通過
- [x] 4.4 瀏覽器 preview：注入 trades → 觸發 PDF 匯出 → 下載檔抽驗：
  - 觸紅線：實測時發現 PDF 匯出有 oklch 顏色函式錯誤（Tailwind v4 + html2canvas v1 不相容）
  - 經使用者拍板開新 change `pdf-oklch-fix` 修復後復測通過
  - 5 sections 全到位、檔名 `投資績效分析報告_YYYY-MM-DD.pdf`、PDF 13.8MB
- [x] 4.5 commit + push origin main（Phase 2 commit: `d01ea42`；oklch-fix commit: `d4c2fdb`）
- [x] 4.6 `npx vercel --prod` 部署
- [x] 4.7 tasks.md 記錄 commit hash + deployment URL
  - Phase 2 commit: `d01ea42`
  - oklch-fix commit: `d4c2fdb`
  - Production: https://web-app-gamma-fawn.vercel.app
  - Deployment: `dpl_JBQZWe1fcymKepg3yZ1XVHm28uwE`
