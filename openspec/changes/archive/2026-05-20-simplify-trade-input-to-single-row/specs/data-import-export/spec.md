## ADDED Requirements

### Requirement: 手動輸入表單簡化為 6 欄

`TradeInputTable` SHALL 提供 6 欄輸入單列，所有衍生欄位自動推算。

#### Scenario: 6 個輸入欄位

- **WHEN** TradeInputTable 渲染
- **THEN** 顯示以下 6 個必填欄位：代號、買入日、賣出日、買入價、賣出價、股數

#### Scenario: 衍生欄位自動推算

- **WHEN** 提交表單
- **THEN** 系統自動計算：
  - `buyAmount = round(buyPrice × shares)`
  - `sellAmount = round(sellPrice × shares)`
  - `pnl = sellAmount − buyAmount`
  - `returnRate = pnl / buyAmount`（buyAmount > 0 時）

#### Scenario: stockName 留空時用 stockId

- **WHEN** 提交時無 stockName 輸入
- **THEN** Trade.stockName 設為 Trade.stockId

#### Scenario: 桌機 7 欄 grid

- **WHEN** 視窗寬度 ≥ md（≥ 768px）
- **THEN** 6 欄 + 1 按鈕排成單列（grid-cols-7）

#### Scenario: 手機 2 欄 grid

- **WHEN** 視窗寬度 < md
- **THEN** 自然 wrap 為 grid-cols-2

#### Scenario: 驗證規則

- **WHEN** 提交
- **THEN** 驗證：
  - 代號非空
  - 賣出日 ≥ 買入日
  - 買入價 / 賣出價 / 股數 為有效數字且 > 0

### Requirement: 進階修改透過 RawTradeTable

`TradeInputTable` 不再提供 buyAmount / sellAmount / pnl / returnRate / 備註等欄位的直接輸入。若使用者需要這些欄位的精確值（如含手續費），SHALL 透過 RawTradeTable 後續編輯。

#### Scenario: 後續編輯路徑

- **WHEN** 使用者已新增交易但需要修改 pnl / buyAmount / note
- **THEN** 透過頁面下方「原始交易表格」（RawTradeTable）編輯
