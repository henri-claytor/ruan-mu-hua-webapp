# Proposal: 投資組合頁新增「個股 vs 組合對比」區塊

## Why

目前組合頁顯示加權後的組合層級指標（EV / VaR / Hurst / MC），但使用者經常會問：

- 「組合短期 EV 為負，是哪幾檔股票拖累的？」
- 「組合 VaR 高，是某支股票風險特別大嗎？」
- 「組合 Hurst 是隨機，是因為內部標的方向相反互相抵消嗎？」

目前要回答這些問題，使用者需要逐一切到每支股票的個股分析頁手動比對——成本很高。

新增「個股 vs 組合對比」區塊，**自動展示每支股票的同樣指標 + 與組合的對比**，讓使用者一眼看出：

- 哪些股票「拖累」組合（與組合方向相反）
- 哪些股票「帶動」組合（與組合方向一致）
- 哪些股票風險拉高 / 拉低組合
- 哪些股票的趨勢性質與組合不同

## What Changes

### 1. 新增「個股 vs 組合對比」區塊

放在組合 EV 區塊之後、VaR 區塊之前，作為一個獨立的「歸因分析」區塊。內含三個子表（依序）：

#### 子表 1：EV 對比（多尺度）

```
              短期(60日年化) 中期(36月年化) 長期(年化)  整體對比
組合（基準）   −0.4%          +5.0%         +7.0%       (基準)
─────────────────────────────────────────────────────
2330  50%    −2.0% ⚠         +5.0% ✓        +8.0% ✓     半拖累
0050  30%    −1.0% ⚠         +3.0% ✓        +5.0% ✓     半拖累
2317  20%    +5.0% ✓         +8.0% ✓        +6.0% ✓     一致
```

**對比規則**（EV 方向）：
- ✓：個股該尺度 EV 與組合**同號**（同方向貢獻）
- ⚠：異號（拉鋸）
- —：個股該尺度資料不足，不評估

**整體對比結論**（基於三尺度 ✓ 數量）：
- 3/3 ✓ → **「一致」**
- 1–2 ✓ → **「半拖累」/「半帶動」**（依組合方向）
- 0/3 ✓ → **「全對立」**

#### 子表 2：VaR 對比（單一尺度）

```
              VaR 95%      VaR 99%     對比
組合（基準）   −5.2%        −7.8%       (基準)
─────────────────────────────────────────────
2330  50%    −6.5% ⬆       −9.0% ⬆     拉高風險
0050  30%    −3.8% ⬇       −5.5% ⬇     降低風險
2317  20%    −5.1% ≈       −7.6% ≈     接近
```

**對比規則**（VaR 風險程度，比較絕對值）：
- ⬆：個股 |VaR| > 組合 |VaR| 的 1.1 倍 → 拉高組合風險
- ⬇：個股 |VaR| < 組合 |VaR| 的 0.9 倍 → 降低組合風險
- ≈：在 0.9–1.1 倍範圍內 → 接近組合

#### 子表 3：Hurst 對比（多尺度）

```
              短期(60日)    中期(120日)   長期(240日)   對比
組合（基準）   0.45（隨機）  0.55（隨機）  0.62（趨勢）   (基準)
─────────────────────────────────────────────────────────
2330  50%    0.48 ✓        0.58 ✓         0.65 ✓        一致
0050  30%    0.32 ⚠        0.40 ⚠         0.55 ⚠        全對立
2317  20%    0.52 ✓        0.60 ✓         0.68 ✓        一致
```

**對比規則**（Hurst 類別）：
- ✓：個股該尺度與組合**同類別**（趨勢/隨機/回歸 三類）
- ⚠：不同類別
- —：個股該尺度資料不足

### 2. 計算邏輯

對每支已輸入的股票分別計算：

- `calcMultiScaleEV(stock.monthlyReturns, stock.dailyReturns)` → 三尺度 EV
- `calcVaR(stock.monthlyReturns or dailyReturns)` → VaR95 / VaR99
- `calcMultiScaleHurst(stock.dailyReturns)` → 三尺度 Hurst（資料不足回 null）

### 3. 範圍

- **本 change**：對比區塊（EV / VaR / Hurst）+ 結果整合
- **不在本 change**：
  - 不做 MC 對比（蒙地卡羅推估給單股不適合直接對比）
  - 不做加碼分析、產業別分析

## Capabilities

### New Capabilities
- `portfolio-stock-comparison`：個股 vs 組合對比區塊（EV / VaR / Hurst 三維度，多尺度）

### Modified Capabilities
- `portfolio-analyzer`：頁面結構新增對比區塊，位於 EV 區塊與 VaR 區塊之間

## Impact

- `src/components/trade/StockVsPortfolioComparison.tsx`（新）：對比主元件，含 3 個子表
- `src/components/trade/EVComparisonTable.tsx`、`VaRComparisonTable.tsx`、`HurstComparisonTable.tsx`（新或內嵌）：3 個子表
- `src/lib/comparison.ts`（新）：對比計算邏輯
  - `compareStockEV(stockEV, portfolioEV): { short, medium, long, overall }`
  - `compareStockVaR(stockVaR95, portfolioVaR95): { var95, var99, overall }`
  - `compareStockHurst(stockHurst, portfolioHurst): { short, medium, long, overall }`
- `src/lib/comparison.test.ts`（新）：對比規則單元測試
- `src/pages/PortfolioPage.tsx`：插入 `<StockVsPortfolioComparison>` 區塊
- 無 store / API 異動、無新依賴

預期工作量：4–5 小時
