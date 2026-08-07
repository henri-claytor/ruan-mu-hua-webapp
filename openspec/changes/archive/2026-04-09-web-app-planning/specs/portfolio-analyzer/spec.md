## ADDED Requirements

### Requirement: 多股票報酬率輸入與比重設定
Portfolio Analyzer SHALL 支援 2 至 10 支股票，每支股票提供：名稱欄位、120 筆月報酬率輸入欄、比重（%）輸入欄。

#### Scenario: 新增股票
- **WHEN** 使用者點擊「新增股票」按鈕
- **THEN** 出現新的股票輸入組（名稱 + 報酬率 + 比重），最多允許至 10 支

#### Scenario: 刪除股票
- **WHEN** 使用者點擊某股票旁的「刪除」按鈕（且目前股票數 > 2）
- **THEN** 該股票欄位移除，其他股票保持不變

#### Scenario: 比重合計驗證
- **WHEN** 所有股票比重加總不等於 100%
- **THEN** 顯示警示「比重合計須為 100%，目前為 XX%」，暫停計算

### Requirement: 加權組合期望值計算
Portfolio Analyzer SHALL 計算每支股票的 EV，並以使用者設定的比重計算加權組合 EV。

#### Scenario: 顯示各股票 EV
- **WHEN** 所有股票數據有效且比重合計為 100%
- **THEN** 顯示每支股票的個別 EV（%）

#### Scenario: 顯示加權組合 EV
- **WHEN** 所有股票數據有效且比重合計為 100%
- **THEN** 顯示加權組合 EV = Σ(股票 EV × 比重)，置於頁面頂部

### Requirement: 組合 VaR 計算
Portfolio Analyzer SHALL 計算加權組合月報酬率序列的 VaR 95% 與 VaR 99%。

#### Scenario: 顯示 VaR 數值
- **WHEN** 加權組合報酬率序列計算完成
- **THEN** 顯示 VaR 95%（第 6 小值）與 VaR 99%（第 2 小值），單位為 %

#### Scenario: VaR 解讀說明
- **WHEN** VaR 計算完成
- **THEN** 每個 VaR 數值旁顯示說明文字：「有 5% 機率單月虧損超過 XX%」

### Requirement: 組合蒙地卡羅模擬
Portfolio Analyzer SHALL 對加權組合執行蒙地卡羅模擬，顯示 1 年、3 年、5 年的 P5/P50/P95 終值（以初始 100 萬元計算）。

#### Scenario: 模擬結果置頂顯示
- **WHEN** 蒙地卡羅計算完成
- **THEN** P5/P50/P95 終值顯示在 Section 頂部，μ、σ 參數與路徑明細在下方

#### Scenario: 模擬路徑數量
- **WHEN** 執行蒙地卡羅模擬
- **THEN** 預設執行 100 條模擬路徑（與 Google Sheet 版本一致）

### Requirement: 蒙地卡羅計算公式與 Google Sheet 版本一致
Portfolio Analyzer 的蒙地卡羅結果 SHALL 使用相同的對數常態分布假設：終值 = 初始值 × exp(Σ(μ − σ²/2 + σ × Z))，其中 Z ~ N(0,1)。

#### Scenario: μ、σ 計算方式
- **WHEN** 加權組合報酬率序列確定後
- **THEN** μ = AVERAGE(portfolio_returns)，σ = STDEV(portfolio_returns)，與 Sheet 版本相同
