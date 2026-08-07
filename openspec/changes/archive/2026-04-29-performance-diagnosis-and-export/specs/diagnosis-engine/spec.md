## ADDED Requirements

### Requirement: 診斷規則引擎主函式
系統 SHALL 提供 `diagnose(trades, performance, stocks)` 函式，輸入交易紀錄、整體績效、個股統計，輸出 `Diagnosis[]` 結構化診斷陣列。

#### Scenario: Diagnosis 介面欄位
- **WHEN** 函式回傳任一 Diagnosis 物件
- **THEN** 包含欄位：`id`（規則識別碼）、`level`（'alert' | 'warning' | 'note' | 'info'）、`scope`（'portfolio' | 'stock'）、選填 `stockId`（scope='stock' 時必填）、`title`（規則標題）、`message`（觀察事實）、`advice`（建議行動）

#### Scenario: 空交易資料
- **WHEN** trades.length === 0
- **THEN** 函式回傳 `[]`（空陣列）

#### Scenario: 排序順序
- **WHEN** 函式有多條診斷
- **THEN** 結果依 level 嚴重度排序：alert → warning → note → info；同 level 內 portfolio 先於 stock

### Requirement: 組合層級診斷規則（6 條）

#### Scenario: 集中度風險（concentration-risk）
- **WHEN** 前 2 大個股 `|pnlContribution|` 之和 > 0.4
- **THEN** 觸發 `concentration-risk`，level=warning，message 包含「前 2 大標的合計貢獻 X.X%」

#### Scenario: 停損紀律不足（stop-loss-discipline）
- **WHEN** 全敗標的數（winRate === 0）≥ 3 且這些標的合計虧損 / `|totalPnl|` > 0.1（若 totalPnl ≠ 0）
- **THEN** 觸發 `stop-loss-discipline`，level=alert

#### Scenario: 獲利因子偏低（low-profit-factor）
- **WHEN** profitFactor 為有限值且 < 2.0
- **THEN** 觸發 `low-profit-factor`，level=note

#### Scenario: 賠率偏低（low-payoff）
- **WHEN** payoffRatio 為有限值且 < 1.2
- **THEN** 觸發 `low-payoff`，level=note

#### Scenario: 交易頻率過高（high-frequency）
- **WHEN** 年均交易筆數（nTrades / 操作年數，年數至少為 1）> 100
- **THEN** 觸發 `high-frequency`，level=note

#### Scenario: 樣本不足（low-sample）
- **WHEN** nTrades < 30
- **THEN** 觸發 `low-sample`，level=info

### Requirement: 個股層級診斷規則（6 條）

#### Scenario: 全敗 2 筆停損問題（stock-all-loss-2）
- **WHEN** 個股 winRate === 0 且 nTrades === 2
- **THEN** 觸發 `stock-all-loss-2`，level=alert

#### Scenario: 全敗 3 筆以上選股邏輯問題（stock-all-loss-3plus）
- **WHEN** 個股 winRate === 0 且 nTrades >= 3
- **THEN** 觸發 `stock-all-loss-3plus`，level=alert（與 stock-all-loss-2 互斥，nTrades===2 時走前者）

#### Scenario: 個股賠率警示（stock-low-payoff）
- **WHEN** 個股 payoffRatio 為有限值且 < 0.8
- **THEN** 觸發 `stock-low-payoff`，level=warning

#### Scenario: 個股資金管理警示（stock-money-management）
- **WHEN** 個股 payoffRatio >= 1.5（含 Infinity）且 profitFactor < 1.0（且非 Infinity）
- **THEN** 觸發 `stock-money-management`，level=warning

#### Scenario: 個股集中度警示（stock-concentration）
- **WHEN** 個股 `|pnlContribution|` > 0.2
- **THEN** 觸發 `stock-concentration`，level=note

#### Scenario: 個股樣本不足（stock-low-sample）
- **WHEN** 個股 nTrades < 5
- **THEN** 觸發 `stock-low-sample`，level=info

### Requirement: 規則訊息文字本地化
所有診斷的 title、message、advice SHALL 為繁體中文。

#### Scenario: 訊息內動態填值
- **WHEN** 規則包含可變數字（如貢獻度、賠率值）
- **THEN** 訊息中以動態填值方式呈現實際數字（如「前 2 大標的合計貢獻 52.3%」），不出現未替換的 placeholder
