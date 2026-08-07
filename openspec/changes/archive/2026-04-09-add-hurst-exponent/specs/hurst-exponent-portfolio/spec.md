## ADDED Requirements

### Requirement: Portfolio 分頁顯示加權組合赫斯特指數
Portfolio 分頁 SHALL 在 Section 5 蒙地卡羅模擬之後新增赫斯特指數（Hurst Exponent）區塊，計算 `portfolio_returns` 命名範圍的 H 值，並提供三區間解讀說明。

#### Scenario: 組合 H 值正確計算
- **WHEN** Portfolio 分頁已貼入至少 2 支股票的月報酬率且加權組合欄（L 欄）有數據
- **THEN** Portfolio 分頁的 Hurst Exponent 區塊顯示加權組合的 H 值

#### Scenario: 組合 H 值解讀說明正確
- **WHEN** H 值計算完成
- **THEN** 顯示對應判斷文字：H > 0.6「趨勢延續型」、0.4–0.6「隨機遊走型」、H < 0.4「均值回歸型」

#### Scenario: 比重調整後 H 值自動更新
- **WHEN** 使用者調整 Section 1 的股票比重
- **THEN** 加權組合 L 欄自動更新，Portfolio 的 H 值隨之重新計算

### Requirement: Portfolio Hurst 區塊使用純 Google Sheet 公式
Portfolio 分頁的 Hurst Exponent 計算 SHALL 完全使用 Google Sheet 公式實作，參照 `portfolio_returns` 命名範圍，不依賴 Apps Script 執行計算。

#### Scenario: 公式參照正確命名範圍
- **WHEN** rebuildPortfolio() 執行後
- **THEN** H 值公式參照 portfolio_returns（L20:L139），而非 Raw Data 的 returns
