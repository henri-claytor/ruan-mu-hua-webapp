# portfolio-stock-comparison Specification

## Purpose

組合分析頁的「個股 vs 組合對比」區塊：含 EV / VaR / Hurst 三個維度的子表 Tab 切換，幫助使用者看出每支股票對組合各維度的貢獻方向（同方向 / 對立 / 風險高低 / 類別差異）。

## Requirements

### Requirement: 對比計算邏輯
系統 SHALL 提供 `compareEV / compareVaR / compareHurstCategory` 三個對比函式，輸出每尺度的對比狀態與整體對比結論。

#### Scenario: EV 對比同號 → aligned
- **WHEN** stockEV 與 portfolioEV 同號（皆 ≥ 0 或皆 < 0）
- **THEN** 該尺度對比結果為 `'aligned'`

#### Scenario: EV 對比異號 → opposed
- **WHEN** stockEV 與 portfolioEV 異號
- **THEN** 該尺度對比結果為 `'opposed'`

#### Scenario: EV 該尺度資料不足
- **WHEN** stockEV 為 null
- **THEN** 該尺度對比結果為 `'na'`

#### Scenario: VaR 比較風險大小
- **WHEN** `|stockVaR| / |portfolioVaR| > 1.1`
- **THEN** VaR 對比結果為 `'higher-risk'`（個股拉高組合風險）

#### Scenario: VaR 比組合風險小
- **WHEN** `|stockVaR| / |portfolioVaR| < 0.9`
- **THEN** VaR 對比結果為 `'lower-risk'`

#### Scenario: VaR 接近組合
- **WHEN** `0.9 ≤ ratio ≤ 1.1`
- **THEN** VaR 對比結果為 `'similar'`

#### Scenario: Hurst 同類別 → aligned
- **WHEN** stockH 與 portfolioH 屬於同一類別（都 > 0.6 趨勢、或都在 0.4–0.6 隨機、或都 < 0.4 回歸）
- **THEN** 該尺度對比結果為 `'aligned'`

#### Scenario: Hurst 不同類別 → opposed
- **WHEN** stockH 與 portfolioH 屬於不同類別
- **THEN** 該尺度對比結果為 `'opposed'`

### Requirement: 整體對比結論判斷
系統 SHALL 依據各尺度（或欄位）的對比結果計數，產生「一致 / 部分對立 / 全對立 / 資料不足」整體結論。

#### Scenario: 全部 aligned
- **WHEN** 所有可評估尺度（不含 'na'）都是 aligned
- **THEN** 整體結論為 `'一致'`

#### Scenario: 全部 opposed
- **WHEN** 所有可評估尺度都是 opposed
- **THEN** 整體結論為 `'全對立'`

#### Scenario: 混合
- **WHEN** 既有 aligned 也有 opposed
- **THEN** 整體結論為 `'部分對立'`

#### Scenario: 全部資料不足
- **WHEN** 所有尺度都是 'na'
- **THEN** 整體結論為 `'資料不足'`

### Requirement: StockVsPortfolioComparison 元件
系統 SHALL 提供 `StockVsPortfolioComparison` 元件，輸入組合與個股的對比資料，渲染含 3 個子表（EV / VaR / Hurst）的 Tab 切換區塊。

#### Scenario: 主元件結構
- **WHEN** 元件渲染
- **THEN** 顯示「個股 vs 組合對比」標題 + 副標 +「Tab 切換」三個子表（EV / VaR / Hurst），預設選中 EV

#### Scenario: 元件位置
- **WHEN** 組合頁完整渲染
- **THEN** 此元件位於 `<MultiScaleEVBlock>` 之後、`<PortfolioVarBlock>` 之前

#### Scenario: 顯示條件
- **WHEN** 組合 evMulti 為 null 或 varResult 為 null
- **THEN** 不渲染此元件

#### Scenario: EV Tab 旁顯示計數摘要
- **WHEN** EV Tab 標籤渲染
- **THEN** 標籤旁顯示計數摘要：「N 一致 / M 部分對立 / X 全對立」

### Requirement: EV 對比子表
EV 子表 SHALL 顯示組合（基準列）與每支股票的多尺度年化 EV，並標示每尺度對比結果與整體結論。

#### Scenario: 基準列顯示
- **WHEN** EV 子表渲染
- **THEN** 第一列為「組合（基準）」，顯示組合三尺度年化 EV 數值（紅漲綠跌），整體對比欄顯示「(基準)」

#### Scenario: 個股列顯示
- **WHEN** 任一股票列渲染
- **THEN** 顯示股票代號、比重、三尺度年化 EV（紅漲綠跌數值 + ✓/⚠/— 對比符號），最右側為整體結論 badge

#### Scenario: 對比符號顏色
- **WHEN** 顯示 ✓ 或 ⚠ 對比符號
- **THEN** ✓ 用綠色（aligned）、⚠ 用 amber（opposed）、— 用 faint 灰色（na）

### Requirement: VaR 對比子表
VaR 子表 SHALL 顯示組合與每支股票的 VaR 95% 與 99%，並標示風險程度差異。

#### Scenario: 基準列與對比符號
- **WHEN** VaR 子表渲染
- **THEN** 組合列顯示組合 VaR95 / VaR99；個股列顯示股票 VaR95 / VaR99，並附 ⬆（higher-risk）、⬇（lower-risk）、≈（similar）符號

#### Scenario: 整體對比結論
- **WHEN** VaR 子表的個股列整體欄
- **THEN** 顯示「拉高風險」（兩個 VaR 都 higher-risk）/「降低風險」（兩個都 lower-risk）/「接近組合」（兩個都 similar）/「混合」（其他組合）

### Requirement: Hurst 對比子表
Hurst 子表 SHALL 顯示組合與每支股票的多尺度 H 值，並標示類別對比。

#### Scenario: 顯示三尺度 + 類別
- **WHEN** Hurst 子表渲染
- **THEN** 每列顯示三尺度 H 值（小數兩位）+ 該尺度類別標籤（趨勢/隨機/回歸）+ ✓/⚠/— 對比符號

#### Scenario: 個股 Hurst 全資料不足時
- **WHEN** 個股日報酬 < 240 → 個股 multi-scale Hurst 為 null
- **THEN** 該股的三尺度欄都顯示 — ，整體欄顯示「資料不足」
