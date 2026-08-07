## REMOVED Requirements

### Requirement: 輸入 120 筆月報酬率
**Reason**: 手動貼入方式改由 API 自動抓取，使用者不再需要手動輸入數據。
**Migration**: 使用股票選擇器選取股票，系統自動透過 CMoney API 取得月報酬率數據。

## ADDED Requirements

### Requirement: 透過股票選擇器取得個股數據

Individual EV Calculator 頁面 SHALL 以 `StockSelector` 元件取代 textarea，使用者選取股票後，系統自動並行呼叫月報酬 API（EV + 蒙地卡羅）與日報酬 API（VaR + Hurst）。

#### Scenario: 選股後自動載入月報酬與日報酬

- **WHEN** 使用者在個股分析頁選取 `2330 台積電`
- **THEN** 系統並行呼叫月報酬 API 與日報酬 API，取得數據後立即計算並顯示全部結果

#### Scenario: 月報酬不足時不顯示結果

- **WHEN** 月報酬 API 回傳筆數 < 60
- **THEN** 頁面顯示「{股票名稱} 月報酬數據不足，無法計算」，不顯示任何結果

### Requirement: 個股頁整合 Hurst 指數結果區

Individual EV Calculator 頁面 SHALL 在蒙地卡羅區塊之後顯示 Hurst 指數結果區，包含 H 值、解讀文字、累積偏差折線圖與計算步驟，頻率標注依雙頻計算架構規則顯示。

#### Scenario: Hurst 結果顯示於蒙地卡羅之後

- **WHEN** 個股頁完成全部計算
- **THEN** 頁面由上至下顯示：EV → VaR（含頻率標注）→ 蒙地卡羅 → Hurst（含頻率標注）

#### Scenario: Hurst 使用日頻數據

- **WHEN** 日報酬筆數 ≥ 252
- **THEN** Hurst 區塊副標題顯示「使用日報酬 N 筆」，H 值解讀正常顯示

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

### Requirement: 個股頁整合 VaR 與蒙地卡羅區塊

Individual EV Calculator 頁面 SHALL 在 EV 結果下方新增 VaR 與蒙地卡羅兩個可折疊區塊，使個股頁具備與投資組合頁對等的完整分析能力（詳細規格見 `individual-var-montecarlo` spec）。

#### Scenario: 完整三段結果顯示

- **WHEN** 使用者輸入至少 10 筆有效月報酬率
- **THEN** 頁面依序顯示：① EV 象限與指標、② VaR 95%/99% 直方圖、③ 蒙地卡羅 P5/P50/P95 扇形圖

#### Scenario: 資料不足時僅顯示 EV 空態

- **WHEN** 使用者輸入少於 10 筆資料
- **THEN** 所有結果區塊均隱藏，僅顯示輸入提示

### Requirement: 複製與下載按鈕整合於個股頁

Individual EV Calculator 頁面的結果區 SHALL 提供「複製摘要」與「下載 PNG」按鈕，涵蓋 EV + VaR + 蒙地卡羅的完整摘要（詳細規格見 `data-import-export` spec）。

#### Scenario: 複製摘要包含三段數值

- **WHEN** 使用者在個股頁點擊「複製摘要」
- **THEN** 剪貼簿文字同時包含 EV 指標、VaR 95%/99% 與蒙地卡羅 P50（1/3/5 年）數值
