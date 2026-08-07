# Proposal: 績效分析結構對齊報告範本

## Why

使用者提供了一份成熟的「投資績效分析報告」PDF 範本，內容結構清晰、商務感強。比對既有實作後發現四個結構性落差，影響專業度與可讀性：

1. **缺「單向紀錄」第 5 分類**：PDF 為全勝（無虧損）或全敗（無獲利）的個股建立獨立分類「單向紀錄」，並明確顯示「賠率與獲利因子無法計算」。目前實作把全勝歸入 Q1，會顯示 `Infinity` 或 `∞`，語意不準
2. **主指標卡只有 5 張**：PDF 將「勝場均報酬」「敗場均虧損」並列為主指標（共 8 張）。目前實作把它們放在「細部統計」inline 行，降低能見度
3. **矩陣表缺四象限說明圖例**：PDF 在表格上方先展示 4 個（即將擴為 5 個）象限的彩色說明卡，引導使用者理解分類意義。目前實作無圖例
4. **矩陣表「診斷」欄為 emoji 計數**：PDF 為每股提供 1–2 句具體文字摘要（含金額 / 比例 / 報酬率）。目前實作只顯示 🔴 N 🟡 M 計數 + hover tooltip，資訊密度低且不利分享 / 列印

本 change 處理「結構與分類」對齊，下一個 change（Change B）處理評估邏輯（優勢/風險 + 重點建議區）。

## What Changes

### 1. 新增「單向紀錄（單向）」第 5 象限

```typescript
export type PerformanceQuadrant =
  | 'Q1: 打法好・結果好'
  | 'Q2: 打法差・結果好（靠重倉或勝率撐場）'
  | 'Q3: 打法好・結果差（資金管理需改善）'
  | 'Q4: 打法差・結果差（全面檢討）'
  | '單向紀錄（全勝或全敗）'  // 新增
```

**判斷邏輯**：
- 全勝（nLosses === 0，所有交易 pnl > 0）→ 單向紀錄
- 全敗（nWins === 0，所有交易 pnl < 0）→ 單向紀錄
- 其他依既有 4 象限規則

**顯示**：
- 賠率欄位顯示「—」（而非 ∞ / 0）
- 獲利因子欄位顯示「—」
- 徽章樣式：藍色（中性）+ 既有 ClipboardCheck / 中性 icon
- compact 簡短版：「單向紀錄」

### 2. 主指標卡擴為 8 張

新增兩張到主層：

| 順序 | 卡片 | 來源 |
|------|------|------|
| 1 | 總實現損益 | Hero |
| 2 | 整體報酬率 | （與年化合併）|
| 3 | 整體勝率 | 既有 |
| 4 | 獲利因子 | 既有 |
| 5 | 平均持有天數 | 既有 |
| 6 | **勝場均報酬**（NEW）| 從 inline 細部移上來 |
| 7 | **敗場均虧損**（NEW）| 從 inline 細部移上來 |
| 8 | 損益比（賠率）| 既有 |

**細部統計 inline 行**保留剩下的：總投入、最大單筆獲利、最大單筆虧損、最大回撤、最長/最短持有天數。

### 3. 矩陣表上方加四象限圖例

新增 `QuadrantLegend` 元件，5 格 grid 顯示 5 個分類的彩色卡，每格含：
- 標籤（如「打法好・結果好」）
- 簡述（如「賠率高 + 獲利因子高，策略與執行雙優」）

### 4. 矩陣表「診斷」欄改為「診斷摘要」文字欄

從 emoji 計數改為 1–2 句具體文字描述，含具體數字（如「9 筆全敗，虧損第二大」「賠率 0.47 有問題，均虧損是均獲利兩倍」）。

文字產生規則（每股最多顯示 1 個）：
- 全敗 ≥ 3 筆 → 「N 筆全敗，平均虧損 X%，停損紀律需改善」
- 全敗 2 筆 → 「N 筆全敗，疑似未停損」
- 全勝且 N ≥ 5 → 「N 筆全勝，均報酬 X%」+ 報酬效率提示（如「薄利多筆」< 10%、「短週期高效率」< 15 天等）
- 全勝且 N < 5 → 「N 筆全勝，樣本少參考性有限」
- 賠率 < 0.8 → 「賠率 X 偏低，靠勝率撐場」
- 賠率 ≥ 1.5 且獲利因子 < 1 → 「邏輯對但押注管理有問題」
- pnlContribution > 0.2 → 「貢獻整體 X%，集中度高」
- 其他預設：「N 筆，勝率 X%，均報酬 Y%」

### 範圍

- **本 change**：5 象限分類、主指標卡擴展、四象限圖例、診斷摘要文字欄
- **不在範圍**（→ Change B）：
  - 「優勢」型診斷規則
  - DiagnosisPanel 分欄改造
  - 「重點建議」獨立區塊

## Capabilities

### Modified Capabilities
- `portfolio-performance-metrics`：4 象限分類擴為 5 類（加「單向紀錄」）
- `performance-page-layout`：Dashboard 主指標卡擴為 8 張
- `stock-quadrant-matrix`：上方加四象限圖例、診斷欄改為文字摘要

## Impact

- `src/lib/trade.ts`：`PerformanceQuadrant` 型別擴 5 類；`classifyPerformanceQuadrant` 新增單向偵測
- `src/lib/trade.test.ts`：新增「全勝歸單向紀錄」「全敗歸單向紀錄」測試
- `src/components/QuadrantBadge.tsx`：擴 5 類樣式 + compact 標籤
- `src/components/trade/PortfolioPerformanceBlock.tsx`：8 張卡片佈局（grid-cols-2 md:grid-cols-4 lg:grid-cols-4 + 2 行）
- `src/components/trade/QuadrantLegend.tsx`（新）：5 格分類說明
- `src/components/trade/StockQuadrantMatrix.tsx`：
  - 加 QuadrantLegend 於頂部
  - 診斷欄改為文字摘要（新增 `buildStockDiagSummary(stats): string` utility）
- `src/lib/diagnosis.ts`：新增 `buildStockDiagSummary(stats: StockStats): string` 文字摘要產生器
- `src/lib/diagnosis.test.ts`：新增摘要文字測試
- `src/components/trade/StockVsPortfolioComparison.tsx`：使用 5 類 quadrant 時不破

無 store / API 異動、無新依賴。

預期工作量：3–4 小時
