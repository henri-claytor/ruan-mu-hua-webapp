## ADDED Requirements

### Requirement: 個股頁顯示 VaR 95% 與 VaR 99%

Individual EV Calculator 頁面 SHALL 在 EV 結果之後新增 VaR 區塊，顯示 VaR 95% 與 VaR 99%，計算方式與投資組合頁一致（使用 `calcVaR()` 函式）。

#### Scenario: VaR 數字卡片顯示

- **WHEN** 個股頁有效資料輸入完成
- **THEN** VaR 區塊顯示「VaR 95%: -X.XX%」與「VaR 99%: -X.XX%」兩張數字卡片

#### Scenario: VaR 直方圖顯示

- **WHEN** 個股頁 VaR 計算完成
- **THEN** `VarHistogram` 圖表顯示報酬率分布，橘色線標示 VaR 95%，紅色線標示 VaR 99%

#### Scenario: VaR 解讀文字

- **WHEN** VaR 結果顯示
- **THEN** 每個 VaR 卡片 subtitle 顯示「有 5% 機率單月虧損超過 X.XX%」等解讀說明

### Requirement: 個股頁顯示蒙地卡羅模擬

Individual EV Calculator 頁面 SHALL 在 VaR 區塊之後新增蒙地卡羅模擬區塊，初始資金 100 萬元，模擬 100 條路徑，計算 1/3/5 年的 P5/P50/P95，計算方式與投資組合頁一致（使用 `runMonteCarlo()` 函式）。

#### Scenario: P5/P50/P95 統計表格顯示

- **WHEN** 個股頁蒙地卡羅計算完成
- **THEN** 顯示 1 年、3 年、5 年三欄，每欄含 P5、P50、P95 終值（萬元）

#### Scenario: 扇形圖顯示

- **WHEN** 個股頁蒙地卡羅計算完成
- **THEN** `FanChart` 顯示 P5（紅線）、P50（藍線）、P95（綠線）60 個月路徑

#### Scenario: 模擬參數顯示

- **WHEN** 個股頁蒙地卡羅計算完成
- **THEN** 顯示 μ（月均報酬）、σ（月報酬標準差）、路徑數（100 條）、筆數

### Requirement: VaR 與蒙地卡羅區塊可折疊

VaR 區塊與蒙地卡羅區塊 SHALL 預設展開，並提供收折切換按鈕，讓使用者在只需 EV 時可收起下方區塊。

#### Scenario: 預設展開

- **WHEN** 個股頁完成計算後頁面渲染
- **THEN** EV、VaR、蒙地卡羅三個區塊均展開顯示

#### Scenario: 點擊收折 VaR 區塊

- **WHEN** 使用者點擊 VaR 區塊右上角的「▼ 收折」按鈕
- **THEN** VaR 直方圖與卡片隱藏，只顯示區塊標題列
