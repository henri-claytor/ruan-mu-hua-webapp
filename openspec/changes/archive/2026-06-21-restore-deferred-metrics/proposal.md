## Why

Phase 1（`performance-report-structure`）為了純版型對齊 PDF 範本，簡化 `PortfolioPerformanceBlock` 時拿掉了「年化報酬率」與「最大回撤」兩個延伸資訊（PDF 範本本身也沒這兩條）。當時的 design.md Non-Goals 明確記載「不補新指標（年化報酬率 / 最大回撤 / 持有天數×報酬相關性 — 下次再做）」。

本次還這兩個欠帳。持有天數×報酬相關性留下次（需新增計算 + 散布圖）。

## What Changes

- **修改**：`PortfolioPerformanceBlock.tsx` 的「整體報酬率」KpiCard 加 `base="年化 X.X%"`
- **修改**：`PortfolioPerformanceBlock.tsx` 的「總實現損益」KpiCard 加 `base="最大回撤 X 元（−Y.Y%）"`，紅綠跌色（負值綠、零值中性）
- **歧義處理**：`maxDrawdownPct === 0` 時顯示「無回撤」

不動：`calcPortfolioPerformance` / `trade.ts` 計算邏輯、wording、ComplianceFooter、其他頁面、PDF 截圖區塊清單、KPI grid 4×2 結構

## Capabilities

### Modified Capabilities

- `performance-page-layout`: 8 KPI 4×2 grid 中，「總實現損益」與「整體報酬率」兩張卡片加 base 副資訊（最大回撤、年化報酬率），不擴張 grid 數量

## Impact

- 影響檔案（預估 1 檔）：
  - `web-app/src/components/trade/PortfolioPerformanceBlock.tsx`
- 無破壞性、無新依賴、不動計算
- 顯示資訊更豐富但版面不變
