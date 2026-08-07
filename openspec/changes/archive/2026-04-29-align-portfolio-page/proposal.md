# Proposal: 投資組合頁與個股頁功能對齊

## Why

過去多個 changes 把個股分析頁升級到「多尺度年化 EV、多尺度 R/S 迴歸 Hurst、紅漲綠跌、ActionGuide 含 divergence 訊號、計算步驟摺疊」等完整功能，但**投資組合頁停留在單尺度版本**。這造成：

1. **使用者預期不一致**：先看完個股頁的多尺度 EV / Hurst 後，回頭看組合頁的單尺度，會以為組合分析「比較陽春」
2. **缺少 4 象限徽章**：組合 EV 區塊只顯示數字，沒有像個股頁那樣的「Q1 雙優」結論徽章
3. **ActionGuide 訊號不足**：組合的建議行動沒有「短期動能轉弱」「短期 H 偏離長期」等多尺度 divergence 警示
4. **小細節不一致**：MC μ 沒套紅漲綠跌、EV 基礎統計用 ResultCard 而非 inline 弱化、缺 Avg Gain/Loss 顯示、無 EV 計算步驟摺疊

對齊後，使用者在「進場前評估」的個股 / 組合兩頁體驗會完全一致，只是分析對象不同。

## What Changes

### 1. 組合 EV 升級為多尺度年化 EV（最大改動）

- 新增 `calcPortfolioMultiScaleEV(stockMonthlyArrays, stockDailyArrays, weights)` 函式
- 短期：近 60 日加權組合日報酬 → 年化 252（需所有股票日報酬 ≥ 60；不足則短期區塊顯示「資料不足」）
- 中期：近 36 月加權組合月報酬 → 年化 12
- 長期：全部加權組合月報酬 → 年化 12
- divergence 偵測（同個股版本）：stable / short-improving / short-deteriorating / mixed
- 重用既有 `MultiScaleEVBlock` 元件，新增可選 `titleOverride / subtitleOverride` prop 支援組合頁標題前綴「組合」

### 2. 組合 Hurst 升級為多尺度（含 fallback）

- 若所有股票日報酬 ≥ 240：用 `calcMultiScaleHurst(weightedDaily240)` 多尺度
- 否則：fallback 為既有單尺度 `calcHurst(portForRisk)`（保留現行行為）
- 重用既有 `MultiScaleHurstBlock` 元件（多尺度時）；單尺度時保留 `PortfolioHurstBlock`

### 3. ActionGuide 訊號豐富化

- `buildPortfolioGuide` 接受新參數 `evDivergence?: EVDivergence` 與 `hurstDivergence?: Divergence`
- 加對應建議文字：
  - `evDivergence === 'short-deteriorating'` → 「⚠ 組合短期年化 EV 顯著低於長期，近期表現轉弱」
  - `evDivergence === 'short-improving'` → 「⚠ 組合短期年化 EV 顯著高於長期，動能轉強」
  - `hurstDivergence === 'short-weakening'` → 「⚠ 組合短期 H 顯著低於長期，趨勢動能可能轉弱」
  - `hurstDivergence === 'short-strengthening'` → 「⚠ 組合短期 H 顯著高於長期，動能轉強」

### 4. 小細節對齊（MC μ 紅漲綠跌、EV 基礎統計 inline）

- `PortfolioMcBlock` 的 μ 顯示套用 `fmtPct + colorByReturn`（與個股頁一致）
- 移除既有 `PortfolioEVBlock`，改為 `MultiScaleEVBlock`（自動具備 inline 弱化勝敗率與計算步驟摺疊）

### 範圍

- **本 change**：組合頁 4 個分析區塊全部與個股頁對齊
- **不在範圍**：
  - **不做反向跨頁連結**（組合多股加權，邏輯不對應；既有設計決定不做）
  - **不動個股頁**（已是基準）
  - **不動 ComparePage**（不在對齊範圍）

## Capabilities

### New Capabilities
- `portfolio-multi-scale-ev`：組合多尺度年化 EV 計算（短日 60 / 中月 36 / 長月全期 + divergence）

### Modified Capabilities
- `portfolio-analyzer`：組合 Hurst 升級為多尺度（fallback 單尺度）；ActionGuide 訊號擴充
- `multi-scale-ev`：`MultiScaleEVBlock` 新增可選 title/subtitle override props

## Impact

- `src/lib/ev.ts`：新增 `calcPortfolioMultiScaleEV()` 函式
- `src/lib/ev.test.ts`：新增測試（多尺度組合 EV 邏輯、資料不足邊界、divergence）
- `src/components/charts/MultiScaleEVBlock.tsx`：新增 `titleOverride` / `subtitleOverride` 可選 props
- `src/components/charts/MultiScaleHurstBlock.tsx`：同樣新增 title/subtitle override（給組合用）
- `src/pages/PortfolioPage.tsx`：
  - 計算邏輯：新增 multi-scale EV 與 multi-scale Hurst（fallback）邏輯
  - 移除 `PortfolioEVBlock`，改用 `MultiScaleEVBlock`
  - Hurst 區塊：multi-scale 時用 `MultiScaleHurstBlock`，否則用既有 `PortfolioHurstBlock`
  - MC μ 套用 `fmtPct + colorByReturn`
  - ActionGuide 傳入 evDivergence + hurstDivergence
- `src/components/ActionGuide.tsx`：`PortfolioSignals` 介面擴充；`buildPortfolioGuide` 增加 divergence 規則

無 store schema 異動、無 API 異動、無新依賴。

預期工作量：5–6 小時
