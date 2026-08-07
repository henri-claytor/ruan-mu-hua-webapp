# action-guide Specification

## Purpose

`ActionGuide` 元件根據各分析頁的計算結果，產生 2–4 條繁體中文建議行動說明，協助使用者解讀 EV、VaR、Hurst 等指標的綜合意義，並提示具體的觀察方向。

## Requirements

### Requirement: Individual page action guide
系統 SHALL 在個股分析結果底部顯示 ActionGuide 元件，根據 EV、VaR 等級與 Hurst H 值產生 2–4 條繁體中文建議行動說明。

#### Scenario: 正期望值且趨勢持續
- **WHEN** EV > 0 且 Hurst H > 0.6
- **THEN** 顯示「EV 正值且趨勢持續，可考慮建立或維持多頭倉位」

#### Scenario: 負期望值
- **WHEN** EV < 0
- **THEN** 顯示「期望值為負，建議觀望或縮減現有部位」

#### Scenario: 高下行風險
- **WHEN** VaR95 絕對值 > 10%
- **THEN** 顯示「下行風險偏高（VaR95 超過 10%），建議控管單筆部位大小」

#### Scenario: 均值回歸訊號
- **WHEN** Hurst H < 0.4
- **THEN** 顯示「Hurst < 0.4 顯示均值回歸傾向，不宜在高點追買」

#### Scenario: 無 Hurst 資料
- **WHEN** Hurst 結果為 null（資料不足）
- **THEN** 不顯示 Hurst 相關建議，其餘建議正常顯示

### Requirement: Portfolio page action guide
系統 SHALL 在投資組合分析結果底部顯示 ActionGuide 元件，根據組合 EV、VaR 等級與 Hurst（若有）產生建議。

#### Scenario: 組合正期望值
- **WHEN** 組合 EV > 0
- **THEN** 顯示「組合整體期望值為正，策略方向正確」

#### Scenario: 組合股數不足
- **WHEN** 組合股數 < 3
- **THEN** 顯示「組合股數較少，可考慮增加持股以分散非系統性風險」

#### Scenario: 組合高風險
- **WHEN** 組合 VaR95 絕對值 > 10%
- **THEN** 顯示「組合下行風險偏高，建議評估是否調降高波動股票比重」

### Requirement: Compare page action guide
系統 SHALL 在比較分析結果底部顯示 ActionGuide 元件，僅當兩股均有完整資料時顯示跨股比較建議。

#### Scenario: EV 優劣比較
- **WHEN** 兩股 EV 均有值且差異 > 0.5%
- **THEN** 顯示「{EV 較高股票名稱} 期望值較高，若其他條件相近，優先考慮該股」

#### Scenario: 其中一股 EV 為負
- **WHEN** 其中一股 EV < 0、另一股 EV > 0
- **THEN** 顯示「{EV 為負股票名稱} 期望值為負，兩股方向相反，應謹慎評估」

#### Scenario: 資料不足時不顯示
- **WHEN** 任一股尚未選取或資料不足
- **THEN** ActionGuide 元件不渲染

### Requirement: 免責聲明顯示
系統 SHALL 在 ActionGuide 元件底部顯示固定免責說明，文字為「以上為統計模型參考建議，非投資意見，不構成買賣依據。」

#### Scenario: 有任何建議時顯示免責聲明
- **WHEN** ActionGuide 有至少一條建議顯示
- **THEN** 免責聲明文字顯示於建議列表正下方，使用 `text-faint text-small` 樣式

### Requirement: IndividualPage 分析區塊順序
系統 SHALL 依資料頻率軌道排列個股分析區塊，月報酬軌道（EV、蒙地卡羅）在前，風險頻率軌道（VaR、Hurst）在後。

#### Scenario: 結果顯示時的區塊順序
- **WHEN** 個股分析計算完成並渲染結果
- **THEN** 區塊顯示順序為：EV → 蒙地卡羅 → VaR → Hurst，且兩軌道間有視覺分隔標示

#### Scenario: 頻率軌道標題說明
- **WHEN** 兩個軌道之間的分隔線顯示
- **THEN** 分隔線附帶說明文字，標示風險頻率軌道所使用的資料頻率（如「日報酬 252 筆」）
