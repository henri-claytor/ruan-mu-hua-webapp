## MODIFIED Requirements

### Requirement: 組合 Hurst 多尺度雙模式
組合分析頁 Hurst 區塊 SHALL 採用嚴格多尺度模式：所有股票日報酬 ≥ 240 時顯示多尺度 Hurst；任一股票不足時顯示「資料不足」說明列，**不再 fallback 至單尺度**（與個股分析頁行為一致）。

#### Scenario: 所有股票日報酬充足時用多尺度
- **WHEN** 所有股票 dailyReturns.length ≥ 240
- **THEN** 計算 weightedDaily240 = `calcPortfolioReturns(stocks.map(s => s.dailyReturns.slice(-240)), weights)`；呼叫 `calcMultiScaleHurst(weightedDaily240)` 取得多尺度結果；UI 用 `MultiScaleHurstBlock` 渲染，含 `titleOverride="組合趨勢延續性偵測"`

#### Scenario: 任一股票日報酬不足時顯示說明列
- **WHEN** 任一股票 dailyReturns.length < 240
- **THEN** 不渲染 Hurst 區塊主體；改顯示說明列：「組合趨勢延續性偵測未顯示：所有股票日報酬必須 ≥ 240 筆才能計算多尺度 Hurst。目前 {缺少股票名稱列表} 不足。」

#### Scenario: 不再 fallback 至單尺度
- **WHEN** 任一股票日報酬 < 240
- **THEN** 系統不呼叫 `calcHurst` 計算單尺度 Hurst；不渲染既有 `PortfolioHurstBlock` 元件
