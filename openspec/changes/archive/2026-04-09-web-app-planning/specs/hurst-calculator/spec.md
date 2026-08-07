## ADDED Requirements

### Requirement: Hurst 指數計算（個股）
Hurst Calculator SHALL 對輸入的月報酬率序列執行 R/S Analysis，計算 Hurst Exponent（H 值）。

#### Scenario: H 值計算正確
- **WHEN** 使用者輸入至少 10 筆月報酬率
- **THEN** 系統計算 H = log(R/S) / log(n)，其中 R = MAX(累積偏差) − MIN(累積偏差)，S = STDEV(報酬率)，n = 筆數

#### Scenario: H 值在合理範圍
- **WHEN** 輸入有效的月報酬率序列
- **THEN** 計算出的 H 值介於 0 與 1 之間

#### Scenario: 累積偏差逐步顯示
- **WHEN** H 值計算完成
- **THEN** 頁面顯示每月累積偏差數值（Xₜ = Σ(rᵢ − μ)），可供使用者核對

### Requirement: H 值三區間判斷
Hurst Calculator SHALL 根據 H 值顯示對應的市場行為判斷文字。

#### Scenario: 趨勢延續型
- **WHEN** H > 0.6
- **THEN** 顯示「趨勢延續型（Persistent）」判斷文字與說明

#### Scenario: 隨機遊走型
- **WHEN** 0.4 ≤ H ≤ 0.6
- **THEN** 顯示「隨機遊走型（Random Walk）」判斷文字與說明

#### Scenario: 均值回歸型
- **WHEN** H < 0.4
- **THEN** 顯示「均值回歸型（Anti-persistent）」判斷文字與說明

### Requirement: 與 Google Sheet Hurst 分頁計算一致
Web App 的 H 值計算結果 SHALL 與 Google Sheet Hurst 分頁公式計算結果相符（誤差 < 0.001）。

#### Scenario: 相同數據相同結果
- **WHEN** 輸入與 Google Sheet Raw Data 相同的 120 筆報酬率
- **THEN** Web App H 值 = Sheet Hurst 分頁 H 值（誤差 < 0.001）

### Requirement: Portfolio 模式支援
Hurst Calculator SHALL 支援「Portfolio 模式」，直接使用 Portfolio Analyzer 計算出的加權組合報酬率序列。

#### Scenario: 切換至 Portfolio 模式
- **WHEN** 使用者選擇「使用組合報酬率」選項（且 Portfolio 頁面已有計算結果）
- **THEN** Hurst 計算自動使用加權組合月報酬率，H 值即時更新
