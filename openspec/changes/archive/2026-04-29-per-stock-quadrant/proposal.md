# Proposal: 個股賠率 vs 獲利因子矩陣表

## Why

Change 1 完成了「整體組合層級」的績效 Dashboard，但使用者最關心的問題是：

- 「**哪一檔股票**讓我賺最多 / 賠最多？」
- 「**哪一檔**打法好但結果差（資金管理）？」
- 「**哪一檔**全部虧損（停損紀律有問題）？」

整體層級看不出個股的差異——必須對每一檔個股分別計算指標，並用 4 象限定位每一檔的「打法 vs 結果」品質。這是診斷投資行為最關鍵的視角。

此外，個股表上的股票應該能**深度連結到既有個股分析頁** `/individual?code=XXXX`——讓使用者看完「我交易這檔的成績」，立刻能跳去看「這檔股票的市場特性」（EV / VaR / Hurst），形成「後向 → 前向」的閉環。

## What Changes

### 個股統計計算

新增 `calcStockStats(trades, stockId)` 與 `calcAllStockStats(trades)`：

- 對每一檔個股分別計算：交易筆數、勝率、賠率、獲利因子、總損益、損益貢獻度、平均持有天數、4 象限分類
- 排序：依總損益（絕對值）由大至小

### 個股賠率 vs 獲利因子矩陣表元件

新增 `StockQuadrantMatrix` 元件，呈現每一檔股票一列：

- 欄位：股票（深度連結）、4 象限徽章、交易筆數、勝率、賠率（含進度條）、獲利因子（含進度條）、總損益、損益貢獻度
- 4 象限篩選按鈕（全部 / Q1 / Q2 / Q3 / Q4）
- 欄位點擊排序

### 個股深度連結

點擊矩陣表中的股票名稱 → 路由到 `/individual?code=2330`，並讓 IndividualPage 自動讀取 query string 載入該股票的市場分析。

### IndividualPage 接收 query string

修改 IndividualPage 在 mount 時讀取 `?code=` 參數，自動觸發 `handleSelect`。

### 範圍

- **本 change 完成**：個股統計計算 + 矩陣表 + 深度連結（單向：績效 → 個股）
- **不在本 change**：反向連結（個股頁顯示「我交易過這檔」摘要 → Change 3）、累積損益曲線、市場賠率對照（→ Change 3）

## Capabilities

### New Capabilities
- `per-stock-stats`：個股層級的績效指標計算（StockStats 介面 + calc 函式）
- `stock-quadrant-matrix`：個股賠率 vs 獲利因子矩陣表 UI 元件，含篩選、排序、深度連結

### Modified Capabilities
- `performance-page-layout`：在績效分析頁的 Dashboard 與原始交易表格之間插入矩陣表
- `result-first-layout`：個股頁支援 `?code=` query string 自動載入

## Impact

- `src/lib/trade.ts`：新增 `StockStats` 介面、`calcStockStats(trades, stockId)`、`calcAllStockStats(trades)`、4 象限分類沿用既有 `classifyPerformanceQuadrant`
- `src/lib/trade.test.ts`：新增個股統計測試
- `src/components/trade/StockQuadrantMatrix.tsx`（新）：矩陣表元件
- `src/pages/PerformancePage.tsx`：在 Dashboard 之後插入矩陣表
- `src/pages/IndividualPage.tsx`：mount 時讀 `?code=` 自動載入
- 無 API、store 異動
