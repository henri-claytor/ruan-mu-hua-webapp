## MODIFIED Requirements

### Requirement: 手動輸入欄位用「金額」而非「價格」

`TradeInputTable` 的 6 欄輸入 SHALL 採「買入金額 / 賣出金額」（含手續費 / 證交稅後）而非「買入價 / 賣出價」，以精確對應券商對帳單。

#### Scenario: 6 個輸入欄位

- **WHEN** TradeInputTable 渲染
- **THEN** 顯示以下 6 個必填欄位：代號、買入日、賣出日、**買入金額**、**賣出金額**、股數

#### Scenario: 衍生欄位自動推算（含平均價）

- **WHEN** 提交表單
- **THEN** 系統自動計算：
  - `pnl = sellAmount − buyAmount`（精確，已含費用）
  - `returnRate = pnl / buyAmount`
  - `buyPrice = buyAmount / shares`（平均成交價）
  - `sellPrice = sellAmount / shares`

#### Scenario: 提示文字

- **WHEN** 輸入區渲染
- **THEN** 下方顯示說明：「請填含手續費、證交稅後的實際金額（對應券商對帳單）」

#### Scenario: 驗證規則

- **WHEN** 提交
- **THEN** 驗證：
  - 代號非空
  - 賣出日 ≥ 買入日
  - 買入金額 > 0
  - 賣出金額 > 0（允許小於買入金額，代表虧損）
  - 股數 > 0
