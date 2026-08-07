## ADDED Requirements

### Requirement: 輸入 120 筆月報酬率
Individual EV Calculator 頁面 SHALL 提供文字區域，允許使用者貼入以換行或逗號分隔的 120 筆月報酬率數字（小數或百分比格式均接受）。

#### Scenario: 貼入換行分隔數據
- **WHEN** 使用者在輸入欄貼入 120 行數字（每行一個報酬率）
- **THEN** 系統解析並顯示已讀取筆數為 120

#### Scenario: 貼入逗號分隔數據
- **WHEN** 使用者貼入以逗號分隔的 120 個數字
- **THEN** 系統正確解析並顯示筆數為 120

#### Scenario: 數據不足時顯示提示
- **WHEN** 使用者輸入少於 10 筆數據
- **THEN** 系統顯示「請輸入至少 10 筆月報酬率」提示，不執行計算

### Requirement: 即時顯示 EV 計算結果
Individual EV Calculator SHALL 在數據輸入完成後即時（無需點擊按鈕）計算並顯示所有結果。

#### Scenario: 顯示基礎統計
- **WHEN** 使用者成功輸入有效數據
- **THEN** 頁面顯示：勝率（%）、敗率（%）、Avg Gain（%）、Avg Loss（%）

#### Scenario: 顯示期望值
- **WHEN** 有效數據輸入完成
- **THEN** 頁面頂部顯示期望值 EV（%），格式為小數兩位，正值顯示綠色、負值顯示紅色

#### Scenario: 顯示賠率指標
- **WHEN** 有效數據輸入完成
- **THEN** 頁面顯示：實際賠率（Avg Gain / Avg Loss）與損益平衡賠率（敗率 / 勝率）

### Requirement: 象限判斷文字
Individual EV Calculator SHALL 根據 EV 正負與賠率高低顯示四象限判斷。

#### Scenario: 高賠率正 EV（第一象限）
- **WHEN** EV > 0 且實際賠率 > 損益平衡賠率
- **THEN** 顯示「高賠率正期望值（最佳）」判斷文字

#### Scenario: 低賠率正 EV（第二象限）
- **WHEN** EV > 0 且實際賠率 ≤ 損益平衡賠率
- **THEN** 顯示「低賠率正期望值（勝率驅動）」判斷文字

#### Scenario: 高賠率負 EV（第三象限）
- **WHEN** EV < 0 且實際賠率 > 損益平衡賠率
- **THEN** 顯示「高賠率負期望值（賠率驅動但勝率不足）」判斷文字

#### Scenario: 低賠率負 EV（第四象限）
- **WHEN** EV < 0 且實際賠率 ≤ 損益平衡賠率
- **THEN** 顯示「低賠率負期望值（避免）」判斷文字

### Requirement: 計算公式與 Google Sheet 版本一致
Individual EV Calculator 的計算結果 SHALL 與 Google Sheet 版本數值相符（誤差 < 0.001%）。

#### Scenario: EV 公式一致性
- **WHEN** 輸入相同的 120 筆月報酬率
- **THEN** Web App 的 EV = 勝率 × Avg Gain − 敗率 × Avg Loss，與 Sheet 版本一致
