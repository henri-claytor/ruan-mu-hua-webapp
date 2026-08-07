## 1. 套件替換

- [x] 1.1 移除 `html2canvas` dependency
- [x] 1.2 新增 `html2canvas-pro@2.0.4` dependency
- [x] 1.3 `src/lib/exportPdf.ts` import 改為 `from 'html2canvas-pro'`

## 2. 驗證

- [x] 2.1 `npx tsc --noEmit` 通過
- [x] 2.2 `npx vitest run` 通過（223 passed）
- [x] 2.3 `npm run build` 通過
- [x] 2.4 瀏覽器 preview：注入 trades → 觸發 PDF 匯出 → 確認：
  - 不再拋 oklch 錯誤 ✓
  - PDF blob 成功產生（application/pdf, 13.8MB, 5 頁）✓
  - 5 sections 全到位（標頭 144px / 章一 1556px / 章二 1178px / 章三 728px / footer 62px）✓
- [x] 2.5 commit + push origin main
- [x] 2.6 `npx vercel --prod` 部署
- [x] 2.7 tasks.md 記錄 commit hash + deployment URL
  - Commit: `d4c2fdb`
  - Production: https://web-app-gamma-fawn.vercel.app
  - Deployment: `dpl_JBQZWe1fcymKepg3yZ1XVHm28uwE`
