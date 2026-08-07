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
