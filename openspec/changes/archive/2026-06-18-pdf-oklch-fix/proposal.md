## Why

Tailwind v4 migration 後，全站 CSS 使用 `oklch()` 顏色函式。`html2canvas@1.4.1` 不支援 `oklch()`，導致 PDF 匯出觸發 `Attempting to parse an unsupported color function "oklch"` 錯誤。實測 `/performance` 頁面點「PDF 報告」即報錯，PDF 完全無法匯出。

此問題早於昨天合規任務、Phase 1（performance-report-structure）、Phase 2（performance-pdf-alignment）之前已存在，是 Tailwind v4 migration 的遺留 bug。Phase 2 完成後將 PDF 截圖區塊清單對齊範本，但若底層截圖機制壞掉，對齊本身也無法驗證。本 change 修復底層相容性問題。

## What Changes

- **替換**：`html2canvas@1.4.1` → `html2canvas-pro@latest`（社群 fork，drop-in API 相容，支援 `oklch()`、`lab()`、`color-mix()` 等現代 CSS 顏色函式）
- **修改**：`src/lib/exportPdf.ts` import 從 `html2canvas` 改為 `html2canvas-pro`
- **保留**：所有匯出邏輯、jsPDF 拼頁機制、Excel/CSV 匯出皆不變

## Capabilities

### Modified Capabilities

- `report-export`: PDF 匯出底層改用 `html2canvas-pro` 以支援 Tailwind v4 的現代 CSS 顏色函式（oklch / lab 等）

## Impact

- 影響檔案（2 檔）：
  - `web-app/package.json`（移除 `html2canvas`，新增 `html2canvas-pro`）
  - `web-app/src/lib/exportPdf.ts`（import 改名）
- 行為差異：使用者觀感無變化（API 相同），唯一差別是 PDF 匯出能成功跑完
- 風險：`html2canvas-pro` 是社群 fork，maintainer 不同；但其專案在 GitHub 上 active 維護，與 `html2canvas` API 一致
