## Why

Phase 1（`performance-report-structure`）design.md Non-Goals 載明三個延後指標。前次 `restore-deferred-metrics` 還了「年化報酬率 + 最大回撤」兩個，剩「持有天數×報酬率相關性」最後一個。本次補上，全部欠帳清零。

PDF 範本第三章「重點建議」第 5 條明確提到：「各標的持有天數 vs 報酬率的相關性分析，讓評估更完整」。此分析能讓使用者觀察自身策略是否依賴特定持有期間（短打 vs 長抱）。

## What Changes

- **新增**：`src/lib/correlation.ts` — 提供 `calcPearsonCorrelation(xs, ys)` 純函式計算 Pearson 相關係數 + `interpretCorrelation(r)` 解讀文字
- **新增**：`src/components/trade/HoldingReturnScatter.tsx` — 散布圖元件，使用 Recharts ScatterChart，每筆 trade 一點，紅綠跌色碼
- **修改**：`src/components/trade/PerformanceCharts.tsx` — 整合新散布圖
- **新增**：`src/lib/correlation.test.ts` — vitest 測試（正相關 / 負相關 / 無相關 / 邊界）

不動：`trade.ts` / `ev.ts` / `var.ts` / `hurst.ts` 既有計算；`calcPortfolioPerformance`；wording；ComplianceFooter；PDF 截圖區塊清單；其他頁面

## Capabilities

### New Capabilities

- `correlation-analysis`: 提供持有天數與報酬率的 Pearson 相關係數計算與散布圖視覺化，作為績效分析的延伸觀察

### Modified Capabilities

- `performance-charts`: 圖表清單新增「持有天數 vs 報酬率散布圖」

## Impact

- 影響檔案（預估 4 檔）：
  - `web-app/src/lib/correlation.ts`（新增）
  - `web-app/src/lib/correlation.test.ts`（新增）
  - `web-app/src/components/trade/HoldingReturnScatter.tsx`（新增）
  - `web-app/src/components/trade/PerformanceCharts.tsx`（整合）
- 無新依賴（Recharts 已有）
- 無破壞性改動
