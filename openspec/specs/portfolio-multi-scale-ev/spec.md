# portfolio-multi-scale-ev Specification

## Purpose

對加權組合計算多尺度年化 EV：複用既有 `calcPortfolioReturns` 與 `calcMultiScaleEV`，提供短/中/長三尺度年化期望報酬與 divergence 偵測。組合分析頁的 EV 區塊使用此計算結果，呈現與個股頁完全對等的多尺度體驗。

## Requirements

### Requirement: 組合多尺度年化 EV 計算
系統 SHALL 提供 `calcPortfolioMultiScaleEV(stockMonthlyArrays, stockDailyArrays, weights)` 函式，輸入各股票的月報酬陣列、日報酬陣列、加權比重，輸出 `MultiScaleEVResult | null`。

#### Scenario: 計算邏輯重用既有函式
- **WHEN** 函式被呼叫
- **THEN** 內部步驟為：(a) 用 `calcPortfolioReturns(stockMonthlyArrays, weights)` 計算加權月報酬；(b) 若所有股票日報酬 ≥ 60，用 `calcPortfolioReturns(stocks.map(d => d.slice(-60)), weights)` 計算最近 60 日加權日報酬；(c) 將兩者傳給 `calcMultiScaleEV(weightedMonthly, weightedDaily60)` 取得結果

#### Scenario: 加權月報酬不足 60 筆回傳 null
- **WHEN** weightedMonthly.length < 60
- **THEN** 函式回傳 `null`

#### Scenario: 任一股票日報酬不足 60 筆 → 短期 null
- **WHEN** 任一 stockDailyArrays[i].length < 60
- **THEN** weightedDaily60 為空陣列；calcMultiScaleEV 內部判斷 short = null；多尺度結果 short 欄位為 null，divergence 退化為 stable

#### Scenario: 所有股票日報酬充足
- **WHEN** 所有股票日報酬 ≥ 60 且加權月報酬 ≥ 60
- **THEN** 回傳完整 MultiScaleEVResult，short / medium / long 均成功計算

### Requirement: 組合 EV 區塊使用 MultiScaleEVBlock
組合分析頁 SHALL 使用 `MultiScaleEVBlock` 元件呈現組合多尺度 EV 結果，傳入 `titleOverride="組合期望報酬與賠率優勢"`。

#### Scenario: 多尺度結果存在
- **WHEN** `calcPortfolioMultiScaleEV` 回傳非 null
- **THEN** 渲染 `<MultiScaleEVBlock result={evMulti} monthlyCount={portMonthly.length} dailyCount={minDailyCount} titleOverride="組合期望報酬與賠率優勢" dailyCountLabelOverride="..." />`

#### Scenario: 月報酬不足 60 筆的降級
- **WHEN** `calcPortfolioMultiScaleEV` 回傳 null
- **THEN** 改顯示說明：「組合月報酬資料不足 5 年（{N} 筆 < 60），無法使用多尺度 EV」
