# hurst-exponent-individual Specification

## Requirements

### Requirement: Individual 分頁顯示赫斯特指數
Individual 分頁 SHALL 顯示 Hurst 指數區塊，使用多尺度（短/中/長三個固定窗口：60 / 120 / 240 日）呈現方式取代單一 H 值，並在三尺度差異達門檻時顯示狀態判讀橫幅。多尺度 Hurst 僅支援日頻資料，且需要日報酬 ≥ 240 筆。

#### Scenario: 多尺度 H 值正確計算
- **WHEN** 已選取股票且日報酬 ≥ 240 筆
- **THEN** Hurst 區塊顯示三個尺度的 H 值（短 60 日 / 中 120 日 / 長 240 日），每個 H 介於 0 到 1 之間，使用對應窗口大小的 R/S 分析法計算

#### Scenario: 日報酬不足 240 筆的降級提示
- **WHEN** 已選取股票但日報酬 < 240 筆
- **THEN** 不顯示多尺度 Hurst 區塊，改顯示「日報酬資料不足 240 筆，需要約 1 年的交易紀錄才能計算多尺度 Hurst」說明

#### Scenario: H 值解讀說明正確
- **WHEN** 任一尺度的 H 值計算完成
- **THEN** 該卡片顯示對應的判斷文字：H > 0.6 顯示「趨勢延續型」、0.4–0.6 顯示「隨機遊走型」、H < 0.4 顯示「均值回歸型」

#### Scenario: H 值數字格式
- **WHEN** H 值顯示在卡片中
- **THEN** 格式為小數兩位（如 0.62），數字使用 `.num` class 套用等寬字型

#### Scenario: 累積偏差圖以長期窗口為基準
- **WHEN** 多尺度區塊渲染
- **THEN** 區塊內僅顯示一張 HurstLineChart，繪製長期窗口（240 日）的 `cumDeviations`，並標注「長期窗口（240日）」字樣
