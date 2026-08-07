## ADDED Requirements

### Requirement: ComparePage 採手動「開始比較」觸發

系統 SHALL 提供「開始比較」按鈕，使用者選好兩支股票後按下才計算與顯示結果。

#### Scenario: 任一股票尚未選好或資料不足

- **WHEN** `compareA.monthlyReturns.length < 10` 或 `compareB.monthlyReturns.length < 10`
- **THEN** 按鈕 disabled

#### Scenario: 兩股皆 ready + 未計算 → enabled「開始比較」

- **WHEN** 兩股都已 fetch 完成且 monthlyReturns ≥ 10
- **AND** `computed === false`
- **THEN** 按鈕 enabled，文字「開始比較」

#### Scenario: 已計算 → 「重新比較」

- **WHEN** `computed === true`
- **THEN** 按鈕文字「重新比較」

#### Scenario: 改動 stocks → reset

- **WHEN** compareA / compareB 任一改變（stockCode 或 returns）
- **THEN** `computed` reset 為 `false`

#### Scenario: 載入中

- **WHEN** loadingA || loadingB
- **THEN** 按鈕文字「載入中...」+ disabled

### Requirement: ComparePage 區塊順序（結論優先）

系統 SHALL 使 ComparePage 在按下「開始比較」後採以下區塊順序：

#### Scenario: 順序

- **WHEN** computed === true 且兩股都有完整結果
- **THEN** 結果區由上至下依序為：
  1. 操作建議（ActionGuide，金邊強化）
  2. 綜合勝出方（主判斷卡，金邊）
  3. 比較表（cmp-table 樣式）

### Requirement: 綜合勝出方主判斷卡

系統 SHALL 在比較表前提供「綜合勝出方」主判斷卡，統計兩股在 6 項指標的勝出次數。

#### Scenario: 統計指標

- **WHEN** 渲染綜合勝出方
- **THEN** 統計以下 6 項：期望報酬率、勝率、損益比、95% 下行虧損、99% 下行虧損、趨勢強度 H

#### Scenario: 勝出方計算

- **WHEN** 計算勝出方
- **THEN** A 勝項數 > B → 顯示 labelA、B 勝 > A → 顯示 labelB、相等 → 顯示「平手」

#### Scenario: 卡片樣式

- **WHEN** 卡片渲染
- **THEN** 金邊 2px + 「綜合勝出方」chip + 「整體推薦」標題 + 36px serif 大字勝出方名稱 + 「A 勝 N 項 / B 勝 M 項 / 平手 K 項」副值

### Requirement: 比較表 cmp-table 樣式統一

系統 SHALL 使比較表採用 `.cmp-table` class 與 `.win` 高亮，與績效頁、組合頁一致。

#### Scenario: 表格 class

- **WHEN** 比較表渲染
- **THEN** `<table className="cmp-table">`
- **AND** 表頭採 serif 11px + 金色 letter-spacing（既有 .cmp-table th 樣式）

#### Scenario: 勝出 cell 高亮

- **WHEN** 某指標 A 勝出
- **THEN** A 欄位該 cell 套 `.win` class（綠底 + 加粗）

#### Scenario: 數值 serif

- **WHEN** 數值 cell 渲染
- **THEN** 套 `.num` class（serif 14px + 紅綠）

### Requirement: ComparePage 命名與其他頁一致

#### Scenario: 期望值 → 期望報酬率

- **WHEN** 比較表「期望值（EV）」列渲染
- **THEN** 顯示「期望報酬率」

#### Scenario: 副標白話化

- **WHEN** 頁面副標渲染
- **THEN** 改為「選取兩支股票，並排比較期望報酬率、下行虧損與趨勢強度」（不含 EV / VaR / Hurst 英文）
