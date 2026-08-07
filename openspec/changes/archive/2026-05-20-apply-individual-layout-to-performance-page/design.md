# Design: PerformancePage 套用同面邏輯

## Context

績效頁為事後分析工具，與其他 3 頁（個股/組合/比較）的「事前評估」性質不同。但「結論優先」與「視覺權重」邏輯仍適用。

## Goals / Non-Goals

**Goals:**
- 重點建議 + 自動診斷移到 Dashboard 之前
- 「總實現損益」加金邊主判斷
- PDF section 順序同步
- 命名一致性

**Non-Goals:**
- 不加查詢/計算按鈕（資料來自輸入，無 fetch）
- 不動 DiagnosisPanel 雙軸結構（已是結論性 panel）
- 不動 RecommendationPanel 編號式結構
- 不動 calc/lib 邏輯

## Decisions

### D1 — 區塊新順序

```
1. Header + 隱私 banner
2. 資料輸入區（CSV / 手動，可摺疊）
─── 以下為 hasTrades 才渲染 ───
3. 🆕 重點建議（RecommendationPanel）
4. 🆕 自動診斷（DiagnosisPanel）
5. 整體績效 Dashboard（PortfolioPerformanceBlock）
6. 個股矩陣表（StockQuadrantMatrix）
7. 績效視覺化（PerformanceCharts）
8. 原始交易表格（RawTradeTable）
```

**理由**：
- 重點建議是行動性結論 → 最頂
- 自動診斷是事實性結論 → 第二
- Dashboard 是綜合 KPI → 第三（給予細節驗證）
- 個股矩陣 / Charts / Trades 是 drill-down 細節

### D2 — 「總實現損益」主判斷強化

**決策**：在 `PortfolioPerformanceBlock` 內讓「總實現損益」卡升級為主判斷：

```tsx
{/* Hero 主判斷：總實現損益 占 2 cols */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
  <div className="md:col-span-2">
    <MetricCard
      label="總實現損益"
      value={fmtMoney(p.totalPnl)}
      tone={colorByReturn(p.totalPnl)}
      base={`總投入 ${fmtMoney(p.totalInvested)}`}
      isPrimaryMain
    />
  </div>
  <MetricCard label="整體報酬率" ... />
  <MetricCard label="整體勝率" ... />
  ...
</div>
```

`MetricCard` 加 `isPrimaryMain` prop：
- 主判斷時：`relative bg-[#f4ead8] border-2 border-[#c9a84c]` + 右上「主判斷」chip
- 主判斷時：數字字級放大為 40px

**理由**：總實現損益是最直觀的「整體成果」，作為主判斷讓使用者第一眼看到。

### D3 — PDF section ids 重排

```typescript
const PDF_SECTION_IDS = [
  'performance-banner',
  'performance-recommendations',  // 移到第 2
  'performance-diagnosis',         // 移到第 3
  'performance-dashboard',
  'performance-matrix',
  'performance-charts',
  'performance-trades',
]
```

確保 PDF 匯出順序與 UI 一致。

### D4 — 命名抽查

抽查項目（已多次替換，做最後檢查）：
- `PortfolioPerformanceBlock`：計算步驟內「賠率 = 平均獲利報酬率... = 損益比」確認已改
- `PortfolioPerformanceBlock`：「損益比（賠率）」label 已改為「損益比」
- `PerformanceCharts`：subtitle 內任何殘留「EV / 賠率」
- `StockQuadrantMatrix`：表頭命名
- 排查 grep `/賠率\b/` 在 PerformancePage 相關元件

### D5 — Migration 順序

1. 改 `MetricCard` 加 `isPrimaryMain` prop
2. 改 `PortfolioPerformanceBlock` 讓「總實現損益」用主判斷樣式 + 占 2 cols
3. 改 `PerformancePage` 區塊順序 + PDF section ids
4. 抽查 grep 殘留命名
5. tsc / vitest / build / 部署

## Risks / Trade-offs

- **重點建議在最頂可能讓使用者跳過 Dashboard 細節**：但這正是「結論優先」的本意；想看細節向下滾即可
- **PDF 順序改變**：使用者既有印出來的舊版 PDF 順序不同，但這是視覺一致性的必要代價
- **總實現損益占 2 cols**：grid 4 columns 變得 2+3 不均衡；可接受，視覺上突出主判斷
