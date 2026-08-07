# Proposal: 組合 Hurst 嚴格對齊個股頁（移除單尺度 fallback）

## Why

前一個 change（`align-portfolio-page`）讓組合頁的 Hurst 區塊採用「多尺度優先 + 單尺度 fallback」雙模式，但這與個股頁的行為不一致：

- **個股頁**：日報酬 ≥ 240 → 多尺度；不足 → 顯示「資料不足 240 筆」說明列，**不 fallback** 單尺度
- **組合頁（前次設計）**：所有股票日報酬 ≥ 240 → 多尺度；不足 → fallback 單尺度

不一致導致：

1. 使用者預期錯位：在個股看到「資料不足」會理解為功能限制，在組合看到單尺度 H 值會以為「組合分析有比較多種模式」
2. 體驗連續性破壞：使用者在兩頁看到的「Hurst 區塊」UI 結構完全不同（一個是 MultiScaleHurstBlock 三卡片，一個是 PortfolioHurstBlock 單一 H 值 + 累積偏差圖）
3. 維護成本：兩個 Hurst 元件並存（PortfolioHurstBlock 為單尺度組合專用），實際使用率低

使用者明確要求：「結果要跟個股一樣」。

## What Changes

### 1. 移除組合頁的單尺度 Hurst fallback

組合頁 Hurst 區塊行為改為：

- 所有股票日報酬 ≥ 240 → `MultiScaleHurstBlock`（與個股頁一致）
- 任一股票日報酬 < 240 → 顯示「資料不足」說明列（與個股頁一致），**不再 fallback**

### 2. 移除 `PortfolioHurstBlock` 元件

該元件僅存在於 `PortfolioPage`，作為單尺度 fallback 使用；移除後不再被引用。

### 3. 移除 `hurstSingle` / `calcHurst` 在 PortfolioPage 的呼叫

簡化計算邏輯：只計算 `hurstMulti`，不再需要 `hurstSingle` 變數。

### 4. ActionGuide 訊號保持不變

ActionGuide 仍接收 `hurstH` 與 `hurstDivergence`，但 hurstH 來源僅從 hurstMulti.short.h（資料夠時）；資料不足時兩個都為 null/undefined。

## Capabilities

### Modified Capabilities
- `portfolio-analyzer`：移除「Hurst 多尺度雙模式」規格，改為「Hurst 嚴格多尺度（資料不足顯示說明）」與個股頁一致

## Impact

- `src/pages/PortfolioPage.tsx`：
  - 移除 `hurstSingle` 計算與相關 import（`calcHurst`、`HurstResult`）
  - 移除 `PortfolioHurstBlock` 子元件（不再被引用）
  - Hurst 區塊 JSX 改為：`hurstMulti` 存在 → `<MultiScaleHurstBlock>`；不存在 → 「資料不足」說明列
  - `HurstLineChart` import 移除（單尺度元件不再使用）
- `src/lib/portfolio.ts` / `src/lib/hurst.ts` / `src/components/charts/MultiScaleHurstBlock.tsx`：不變
- ActionGuide 與 buildPortfolioGuide 介面不變（`hurstH` 與 `hurstDivergence` 仍可選）

無 store / API 異動、無新依賴。

預期工作量：30–45 分鐘（純刪除 + 改 JSX 結構）
