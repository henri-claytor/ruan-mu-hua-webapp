# hurst-calculator Specification

## Purpose

對報酬率序列執行 Rescaled Range (R/S) 分析，計算 Hurst Exponent（H 值），協助判斷時間序列是趨勢延續、隨機遊走或均值回歸。

## Requirements

### Requirement: Hurst 指數計算（個股）
Hurst Calculator SHALL 對輸入的報酬率序列執行多窗口 R/S 線性迴歸法（multi-window R/S regression），計算 Hurst Exponent（H 值）。當可用子窗口尺寸數 < 2 時，fallback 回單點公式 `H = log(R/S) / log(n)`。

#### Scenario: 多窗口 R/S 迴歸計算 H
- **WHEN** 使用者輸入至少 10 筆報酬率，且可用子窗口尺寸（取自 [10, 20, 40, 80, 160] 中 size ≤ N/2 的值）數 ≥ 2
- **THEN** 系統對每個尺寸 size 將序列尾部對齊切成 floor(N/size) 個不重疊子窗口、計算每個子窗口的 R/S 並取平均，得到資料點 (n, average R/S)。對 (log(n), log(R/S)) 點集做最小平方法線性迴歸（含 Anis-Lloyd 小樣本偏差修正），**H = 迴歸斜率**

#### Scenario: 短序列 fallback 單點公式
- **WHEN** 可用子窗口尺寸 < 2 個（例如 N < 20）
- **THEN** 退回原本單點公式 `H = log(R/S) / log(n)`，其中 R 與 S 以全序列計算

#### Scenario: 累積偏差以全序列計算
- **WHEN** H 值計算完成
- **THEN** `cumDeviations` 欄位仍以全序列計算（Xₜ = Σ(rᵢ − μ)），供 HurstLineChart 視覺化

#### Scenario: H 值在合理範圍
- **WHEN** 輸入有效的報酬率序列
- **THEN** 計算出的 H 值介於 0 與 1 之間（迴歸結果若超出此範圍會 clip 到 [0, 1]）

### Requirement: HurstResult 介面包含 RSPoint 陣列
`HurstResult` 介面 SHALL 包含欄位 `points: RSPoint[]`，記錄迴歸所用的所有 (n, R/S) 點，供 UI 顯示計算過程。

#### Scenario: 多窗口模式回傳 points
- **WHEN** 使用多窗口 R/S 迴歸計算
- **THEN** `result.points` 為長度 ≥ 2 的陣列，每個元素為 `{ n: 子窗口尺寸, rs: 該尺寸下的平均 R/S, subWindowCount: 該尺寸切了幾個子窗口 }`

#### Scenario: Fallback 模式 points 為單點
- **WHEN** 退回單點公式
- **THEN** `result.points` 為長度 1 的陣列，僅包含 `{ n: N, rs: R/S, subWindowCount: 1 }`

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

### Requirement: 計算步驟 UI 顯示迴歸過程
個股分析頁的 Hurst 計算步驟區塊 SHALL 顯示多窗口 R/S 迴歸的所有資料點與迴歸結果。

#### Scenario: 多窗口模式的計算步驟
- **WHEN** 計算步驟區塊展開且使用多窗口 R/S 迴歸
- **THEN** 區塊顯示：每個 (n, R/S, 子窗口數) 一列、線性迴歸式 `log(R/S) = H × log(n) + c`、最終 H 值（小數 4 位）

#### Scenario: Fallback 模式的計算步驟
- **WHEN** 退回單點公式
- **THEN** 區塊顯示既有的 `μ / R / S / H = log(R/S)/log(n)` 格式並標注「樣本較小，使用單點公式」

### Requirement: Portfolio 模式支援
Hurst Calculator SHALL 支援「Portfolio 模式」，直接使用 Portfolio Analyzer 計算出的加權組合報酬率序列。

#### Scenario: 切換至 Portfolio 模式
- **WHEN** 使用者選擇「使用組合報酬率」選項（且 Portfolio 頁面已有計算結果）
- **THEN** Hurst 計算自動使用加權組合月報酬率，H 值即時更新
