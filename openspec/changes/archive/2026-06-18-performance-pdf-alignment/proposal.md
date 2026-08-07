## Why

Phase 1（`performance-report-structure`）已將 `/performance` 頁面版型對齊「投資績效分析報告」PDF 範本。PDF 匯出採 html2canvas 截 DOM 方式，因此 Web 結構已自動對齊範本；但目前 PDF 截圖區塊清單仍包含 PDF 範本沒有的 Charts 與 RawTradeTable，且缺少 ReportHeaderBlock 與 ComplianceFooter 的截圖區塊。本次補齊缺漏、移除多餘區塊、檔名中文化，讓 PDF 匯出與範本完全一致。

## What Changes

- **修改**：`PerformancePage.tsx` 的 `PDF_SECTION_IDS` 順序與內容對齊 PDF 範本（標頭 → 章一 → 章二 → 章三 → footer）
- **新增**：`ReportHeaderBlock.tsx` 外層加 `id="performance-report-header"` 供 PDF 截圖
- **新增**：`ComplianceFooter.tsx` 外層加 `id="performance-compliance-footer"` 供 PDF 截圖
- **移除**：PDF 截圖區塊不再包含 `performance-charts`、`performance-trades`（PDF 範本沒有這兩節）
- **修改**：PDF 檔名從 `performance-report-{date}.pdf` 改為 `投資績效分析報告_{date}.pdf`（中文化，對齊範本標題）

不動：`exportPdf.ts` 截圖核心邏輯、Web 版型、計算邏輯、Excel/CSV 匯出

## Capabilities

### Modified Capabilities

- `report-export`: PDF 匯出區塊清單對齊範本（標頭 + 章一 + 章二 + 章三 + footer），檔名中文化
- `performance-page-layout`: 新增 ReportHeaderBlock 與 ComplianceFooter 的 DOM id，PDF_SECTION_IDS 順序更新

## Impact

- 影響檔案（預估 3 檔）：
  - `web-app/src/components/trade/ReportHeaderBlock.tsx`（加 id）
  - `web-app/src/components/ComplianceFooter.tsx`（加 id）
  - `web-app/src/pages/PerformancePage.tsx`（PDF_SECTION_IDS 順序）
  - `web-app/src/components/trade/ExportMenu.tsx`（PDF 檔名）
- 無破壞性改動、無新依賴、Excel / CSV 匯出不受影響
