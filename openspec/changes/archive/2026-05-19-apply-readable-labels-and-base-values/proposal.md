## Why

目前個股/組合/績效頁的指標卡片有兩個體驗問題：

1. **術語抽象**：「年化 EV」「賠率」「Hurst H」「VaR」「P5/P50/P95」對非專業使用者不直觀
2. **缺乏計算底層**：使用者只看到年化結果，不知道是從什麼「單期」推算出來的；只看 VaR % 不知道對應哪個百分位；只看 D 值不知道對應的 H 值

統一改為白話命名 + 每張卡新增「底層值」副行，可讓使用者快速理解指標含義並驗證來源。

## What Changes

### 命名替換（UI 字串）

| 舊 | 新 |
|---|---|
| 年化 EV | 年化期望報酬率 |
| EV 期望值多尺度分析 | 期望報酬率多尺度分析 |
| 單期月 EV / 日 EV | 月平均報酬率 / 日平均報酬率 |
| 賠率（Payoff Ratio）| 損益比 |
| Hurst H / Hurst 指數 | 趨勢強度 H |
| VaR 95% / 99% | 95% 下行虧損 / 99% 下行虧損 |
| P5 / P50 / P95 | 悲觀情境 / 中位情境 / 樂觀情境 |

**保留**：獲利因子、勝率、敗率、分形維度 D、走勢規律性偵測、趨勢延續性偵測（已白話或本身就是專有名）

**內部不動**：`lib/*` 的 type、函式、interface 變數名稱（EV / payoffRatio / hurst.h 等）保持英文，只動 UI 字串。

### 底層值新增（每張卡 + 1 行 dim 副值）

**個股頁**：
- EV 三尺度：日/月平均報酬率
- VaR 95% / 99%：第 N 百分位 + 樣本筆數
- Hurst 三尺度：R/S 迴歸斜率（既有資料）
- 走勢規律性 D 三尺度：H = X（D = 2 − H）
- Monte Carlo 1Y / 3Y / 5Y：μ / σ

**組合頁**：同個股（用加權後值）

**績效頁** PortfolioPerformanceBlock 8 個 metric-card：
- 總實現損益：總投入
- 整體報酬率：年化
- 整體勝率：勝場數 / 總筆數
- 獲利因子：總獲利 / 總虧損
- 平均持有天數：最長 / 最短
- 勝場均報酬：勝場筆數
- 敗場均虧損：敗場筆數
- 損益比：Avg Gain / Avg Loss

**比較頁**：cmp-table 不動（表格已有上下文）

### 卡片視覺層級調整

每張卡的視覺層級重新定義（從上到下）：
1. 主標題（如「最近 3 個月」）— 字級放大 18px、粗體
2. 視窗描述（如「日報酬最近 60 筆」）— 11px dim
3. 指標名稱（如「年化期望報酬率」）— 13px dim
4. 主數字 — serif/sans 36px 粗體、紅漲綠跌
5. **NEW**：底層值（dim 11px）
6. 評級 chip（既有）
7. 警語 / 樣本不足等（既有）

## Capabilities

### Modified Capabilities

- `multi-scale-ev`：UI 命名 + 底層值 + 卡片視覺層級
- `individual-var-montecarlo`：VaR / MC 卡片命名 + 底層值
- `multi-scale-hurst`：Hurst 卡片底層值
- `fractal-dimension`：D 卡片底層值（已有 H 推算，加上顯示）
- `portfolio-performance-metrics`：8 metric-card 命名 + 底層值

## Impact

- **影響檔案**（純 UI 字串 + 卡片結構，不動邏輯）：
  - `src/components/charts/MultiScaleEVBlock.tsx`
  - `src/components/charts/MultiScaleHurstBlock.tsx`
  - `src/components/charts/FractalDimensionBlock.tsx`
  - `src/components/trade/PortfolioPerformanceBlock.tsx`
  - `src/pages/IndividualPage.tsx`（VarBlock / McBlock 兩個 inline 元件）
  - `src/pages/PortfolioPage.tsx`（同個股相關 inline 元件）
  - `src/pages/ComparePage.tsx`（cmp-table headers）
  - `src/components/ActionGuide.tsx`（訊息文案）
  - `src/components/QuadrantBadge.tsx`（large 模式副標）
  - `src/lib/diagnosis.ts` / `recommendations.ts`（訊息中提到「賠率」改「損益比」）
  - `src/utils/export.ts`（PDF / 文字摘要）
- **不影響**：邏輯、tests（除 diagnosis/recommendations 訊息文字斷言）、API、store、計算公式
- **風險**：
  - 「賠率 → 損益比」散落 20+ 處，需仔細掃
  - PDF / Excel 匯出視覺 / 文字會跟著變
  - 測試中的訊息文字斷言需更新
