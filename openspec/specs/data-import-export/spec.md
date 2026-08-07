## ADDED Requirements

### Requirement: CSV 與百分比格式自動解析

系統 SHALL 在 `parseReturns()` 函式中支援以下輸入格式，並正確轉換為小數（float）：

| 格式 | 範例 | 解析結果 |
|-----|-----|---------|
| 小數（現有）| `0.0412` | `0.0412` |
| 百分比字串 | `3.12%` | `0.0312` |
| Tab 分隔 | `0.04\t-0.02\t...` | 各值分別解析 |
| 逗號分隔（現有） | `0.04,-0.02,...` | 各值分別解析 |
| 混合換行+逗號 | `0.04\n-0.02,0.05` | 正確解析 3 筆 |

#### Scenario: 貼入百分比格式

- **WHEN** 使用者貼入含 `%` 結尾的數字（如 `3.12%`）
- **THEN** 系統自動除以 100 解析為 `0.0312`，顯示筆數正確

#### Scenario: 貼入 Tab 分隔數據（來自 Excel）

- **WHEN** 使用者從 Excel 複製一行數據（Tab 分隔）並貼入
- **THEN** 系統正確解析每個欄位為獨立的報酬率值

#### Scenario: 無效值過濾

- **WHEN** 輸入中含有空行、非數字文字或標頭列
- **THEN** 系統過濾無效值後顯示有效筆數，不報錯中斷

### Requirement: 複製文字摘要

結果區 SHALL 提供「複製摘要」按鈕，點擊後將結構化文字摘要（含所有關鍵數值）複製至系統剪貼簿。

摘要格式（個股範例）：
```
【個股期望值分析】
EV: +2.34%  象限: 高賠率正期望值（最佳）
勝率: 56.67%  敗率: 43.33%
Avg Gain: 4.12%  Avg Loss: 2.31%
實際賠率: 1.78  損益平衡賠率: 0.77
VaR 95%: -3.21%  VaR 99%: -5.67%
```

#### Scenario: 點擊複製後出現確認

- **WHEN** 使用者點擊「複製摘要」按鈕
- **THEN** 按鈕文字暫時變為「已複製 ✓」（1.5 秒後恢復），剪貼簿內容為摘要文字

#### Scenario: 瀏覽器不支援 Clipboard API 時降級

- **WHEN** 瀏覽器不支援 `navigator.clipboard`
- **THEN** 系統顯示可手動選取的文字對話框

### Requirement: 下載結果 PNG

結果區 SHALL 提供「下載 PNG」按鈕，點擊後使用 `html2canvas` 截取結果區 DOM 並下載為 PNG 檔案，檔名格式為 `rmh-<頁面名稱>-<YYYY-MM-DD>.png`。

#### Scenario: 成功截圖並下載

- **WHEN** 使用者點擊「下載 PNG」且結果已計算
- **THEN** 瀏覽器下載一個 PNG 檔案，包含所有數字卡片與圖表

#### Scenario: 截圖前等待渲染

- **WHEN** 使用者點擊「下載 PNG」
- **THEN** 系統等待 500ms 後再截圖，確保 Recharts 動畫渲染完成

#### Scenario: 按鈕禁用於無結果時

- **WHEN** 尚未輸入資料或資料不足
- **THEN** 「下載 PNG」與「複製摘要」按鈕均呈 disabled 狀態，不可點擊

## ADDED Requirements (simplified single-row input)

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

## ADDED Requirements (manual input uses actual amounts)

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

## ADDED Requirements (simplified CSV with backward compat)

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
