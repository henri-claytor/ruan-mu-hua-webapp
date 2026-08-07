## ADDED Requirements

### Requirement: 組合 Hurst 多尺度雙模式
組合分析頁 Hurst 區塊 SHALL 採用「多尺度優先 + 單尺度 fallback」雙模式：所有股票日報酬 ≥ 240 時用多尺度，否則 fallback 至單尺度（沿用既有行為）。

#### Scenario: 所有股票日報酬充足時用多尺度
- **WHEN** 所有股票 dailyReturns.length ≥ 240
- **THEN** 計算 weightedDaily240 = `calcPortfolioReturns(stocks.map(s => s.dailyReturns.slice(-240)), weights)`；呼叫 `calcMultiScaleHurst(weightedDaily240)` 取得多尺度結果；UI 用 `MultiScaleHurstBlock` 渲染，含 `titleOverride="組合趨勢延續性偵測"`

#### Scenario: 任一股票日報酬不足時 fallback 單尺度
- **WHEN** 任一股票 dailyReturns.length < 240
- **THEN** 不計算多尺度；改用既有 `calcHurst(portForRisk)` 單尺度邏輯；UI 用既有 `PortfolioHurstBlock` 渲染（含頻率標籤、stocksLackingDaily 警示）

#### Scenario: 兩個模式皆無法計算時不顯示 Hurst
- **WHEN** 多尺度條件不滿足且 portForRisk.length < 10
- **THEN** Hurst 區塊不渲染

### Requirement: 組合 ActionGuide 接收 divergence 訊號
`buildPortfolioGuide` 函式 SHALL 接受可選參數 `evDivergence?: EVDivergence` 與 `hurstDivergence?: Divergence`，並依其值產生對應建議文字。

#### Scenario: 短期動能轉弱
- **WHEN** `evDivergence === 'short-deteriorating'`
- **THEN** ActionGuide 顯示「⚠ 組合短期年化 EV 顯著低於長期，近期表現轉弱」

#### Scenario: 短期動能轉強
- **WHEN** `evDivergence === 'short-improving'`
- **THEN** ActionGuide 顯示「⚠ 組合短期年化 EV 顯著高於長期，動能轉強」

#### Scenario: Hurst 短期轉弱
- **WHEN** `hurstDivergence === 'short-weakening'`
- **THEN** ActionGuide 顯示「⚠ 組合短期 H 顯著低於長期，趨勢動能可能轉弱」

#### Scenario: Hurst 短期轉強
- **WHEN** `hurstDivergence === 'short-strengthening'`
- **THEN** ActionGuide 顯示「⚠ 組合短期 H 顯著高於長期，動能轉強」

#### Scenario: stable 或 undefined 不顯示 divergence 訊息
- **WHEN** divergence 為 'stable' / 'mixed' / undefined
- **THEN** 不產生對應 divergence 建議

### Requirement: 組合 MC μ 套用紅漲綠跌
組合 MC 區塊（`PortfolioMcBlock`）顯示 μ（月均報酬）時 SHALL 套用 `fmtPct + colorByReturn` 紅漲綠跌慣例。

#### Scenario: μ 為正
- **WHEN** mcResult.mu > 0
- **THEN** μ 顯示為 `+X.XX%`（紅色）

#### Scenario: μ 為負
- **WHEN** mcResult.mu < 0
- **THEN** μ 顯示為 `−X.XX%`（綠色）

#### Scenario: μ 為 0
- **WHEN** mcResult.mu === 0
- **THEN** μ 顯示為 `0.0000%`（中性色）
