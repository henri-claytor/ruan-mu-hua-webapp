## ADDED Requirements

### Requirement: Individual 分頁顯示赫斯特指數
Individual 分頁 SHALL 在基礎統計與賠率步驟之後新增赫斯特指數（Hurst Exponent）區塊，計算 `returns` 命名範圍的 H 值，並提供三區間解讀說明。

#### Scenario: H 值正確計算
- **WHEN** Raw Data 分頁已貼入至少 10 筆月報酬率數據
- **THEN** Individual 分頁的 Hurst Exponent 區塊顯示以 R/S 分析法計算的 H 值（0 到 1 之間）

#### Scenario: H 值解讀說明正確
- **WHEN** H 值計算完成
- **THEN** 顯示對應的判斷文字：H > 0.6 顯示「趨勢延續型」、0.4–0.6 顯示「隨機遊走型」、H < 0.4 顯示「均值回歸型」

#### Scenario: H 值數字格式
- **WHEN** H 值顯示在 B 欄
- **THEN** 格式為小數兩位（如 0.62），字體加大且黃底標示，與期望值、賠率等主要結果一致

### Requirement: Individual Hurst 區塊使用純 Google Sheet 公式
Individual 分頁的 Hurst Exponent 計算 SHALL 完全使用 Google Sheet 公式實作，不依賴 Apps Script 執行計算。

#### Scenario: 公式隨數據自動更新
- **WHEN** 使用者在 Raw Data 更新月報酬率數據
- **THEN** Individual 分頁的 H 值自動重新計算，無需重新執行腳本
