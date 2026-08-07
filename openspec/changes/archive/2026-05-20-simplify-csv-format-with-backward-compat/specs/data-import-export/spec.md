## MODIFIED Requirements

### Requirement: CSV 必填欄位簡化為 6 欄

`parseTradesCSV` SHALL 將必填欄位降為 6 個，其餘欄位若未提供則自動推算。

#### Scenario: 必填欄位清單

- **WHEN** CSV 解析
- **THEN** 必填欄位為：`stock_id`, `buy_date`, `sell_date`, `buy_amount`, `sell_amount`, `shares`

#### Scenario: 衍生欄位自動推算

- **WHEN** CSV 缺以下欄位
- **THEN** 系統自動推算：
  - `stock_name` 預設 = `stock_id`
  - `buy_price` = `buy_amount / shares`
  - `sell_price` = `sell_amount / shares`
  - `pnl` = `sell_amount − buy_amount`
  - `return_rate` = `pnl / buy_amount`
  - `note` 預設 undefined

#### Scenario: 已提供值優先

- **WHEN** CSV 已提供 buy_price / pnl / return_rate / stock_name / note 等
- **THEN** 採用 CSV 提供值，不自動推算

#### Scenario: 報酬率自動偵測格式

- **WHEN** `return_rate` 絕對值 > 1
- **THEN** 視為百分比格式自動 / 100（既有邏輯保留）

#### Scenario: 缺必填欄位 → 報錯

- **WHEN** CSV header 缺任一必填欄位
- **THEN** 回傳 error「Header 缺少必要欄位「{欄位名}」」

### Requirement: 向下相容舊版 CSV

舊版 11/12 欄 CSV SHALL 仍可被 parseTradesCSV 解析，無需修改。

#### Scenario: 12 欄完整版

- **WHEN** 上傳含全部 12 欄（含 stock_name, buy_price, sell_price, pnl, return_rate, note）的 CSV
- **THEN** 全部欄位採用 CSV 提供值，不自動推算

#### Scenario: 11 欄無 note

- **WHEN** CSV 含 11 欄（缺 note）
- **THEN** 解析成功，note 為 undefined

### Requirement: 範例 CSV 改為簡化版

`EXAMPLE_CSV` 與 `public/example-trades.csv` SHALL 改為 6 欄簡化版本。

#### Scenario: 範例內容

- **WHEN** 範例 CSV 提供
- **THEN** Header 為 6 欄：`stock_id,buy_date,sell_date,buy_amount,sell_amount,shares`
- **AND** 內含至少 3 筆範例交易（如 2330 / 2317 / 0050）

### Requirement: 上傳區提示文字更新

`TradeFileUpload` SHALL 更新通用格式說明文字。

#### Scenario: 提示文字

- **WHEN** 上傳區渲染
- **THEN** 顯示：「通用格式 6 欄（stock_id, buy_date, sell_date, buy_amount, sell_amount, shares）· 進階可額外帶 stock_name / buy_price / sell_price / pnl / return_rate / note」
