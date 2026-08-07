# trade-history Specification

## Purpose

定義使用者實際完成交易（已實現損益）的資料模型、本機儲存策略、輸入介面（手動 + CSV 上傳）與原始交易表格顯示。為「績效分析」功能提供資料層基礎。

## Requirements

### Requirement: Trade 資料模型
系統 SHALL 提供 `Trade` 介面與其儲存基礎建設，定義一筆完整買賣交易所需的全部欄位。

#### Scenario: Trade 介面欄位完整
- **WHEN** 任何模組讀取或寫入 Trade 物件
- **THEN** 物件包含以下欄位：`id`（UUID 字串）、`stockId`、`stockName`、`buyDate` (YYYY-MM-DD)、`sellDate` (YYYY-MM-DD)、`buyPrice`、`sellPrice`、`shares`（整數）、`buyAmount`、`sellAmount`、`pnl`、`returnRate`（小數，如 0.0587）、選填 `note`

#### Scenario: 持有天數為衍生欄位
- **WHEN** 任何 UI 需要顯示持有天數
- **THEN** 持有天數透過 `daysBetween(buyDate, sellDate)` 即時計算，不存入 Trade 物件

### Requirement: 交易資料本機儲存
系統 SHALL 提供獨立的 `useTradeStore` zustand store，使用 persist middleware 將交易資料儲存於瀏覽器本機（localStorage），版本鍵 `rmh-trades-v1`，**不上傳雲端**。

#### Scenario: 新增交易
- **WHEN** 呼叫 `addTrade(trade)`
- **THEN** 該筆交易加入 `trades` 陣列，並立即寫入 localStorage

#### Scenario: 編輯交易
- **WHEN** 呼叫 `updateTrade(id, patch)`
- **THEN** 對應 id 的交易欄位以 patch 更新，並立即寫入 localStorage

#### Scenario: 刪除交易
- **WHEN** 呼叫 `removeTrade(id)`
- **THEN** 對應 id 的交易從 `trades` 陣列移除

#### Scenario: 批次匯入交易
- **WHEN** 呼叫 `importTrades(newTrades)`
- **THEN** 將 newTrades 加入既有 `trades` 陣列尾部

#### Scenario: 清除全部交易
- **WHEN** 呼叫 `clearAll()`
- **THEN** `trades` 陣列重設為空

#### Scenario: 隱私邊界 UI 提示
- **WHEN** 績效分析頁渲染
- **THEN** 頁面頂部顯示 banner：「💾 交易資料僅儲存於本機瀏覽器，不會上傳雲端」並附「清除全部」按鈕

### Requirement: 手動輸入介面
系統 SHALL 提供表格化手動輸入元件 `TradeInputTable`，使用者能直接在表格中新增、編輯、刪除單筆交易。

#### Scenario: 新增空白列
- **WHEN** 使用者點擊「+ 新增交易」
- **THEN** 表格底部新增一空白列，可填入欄位（部分欄位有預設值如今日 / 0）

#### Scenario: 即時驗證
- **WHEN** 使用者在欄位中輸入值並失焦
- **THEN** 系統即時驗證該欄位（如 `sellDate >= buyDate`、數值非負），錯誤以紅框標示並顯示錯誤訊息

#### Scenario: 自動推算金額與損益
- **WHEN** 使用者填入 buyPrice 與 shares
- **THEN** 自動推算 buyAmount = buyPrice × shares；同理 sellAmount；點擊「自動算損益」可由 buyAmount / sellAmount 推算 pnl 與 returnRate

#### Scenario: 確認後寫入 store
- **WHEN** 使用者填完一筆並點擊「儲存」
- **THEN** 該筆交易透過 `addTrade` 寫入 store，並從輸入區清除

### Requirement: CSV 上傳介面
系統 SHALL 提供 CSV 上傳元件 `TradeFileUpload`，支援拖放或選檔，預覽前 5 筆並要求確認後才匯入。

#### Scenario: CSV 格式定義
- **WHEN** 使用者上傳 CSV
- **THEN** 系統期望檔案首列為 header，包含 13 欄：`stock_id, stock_name, buy_date, sell_date, buy_price, sell_price, shares, buy_amount, sell_amount, pnl, return_rate, note`

#### Scenario: 日期格式驗證
- **WHEN** CSV 中 buy_date 或 sell_date 不符 `YYYY-MM-DD` 格式
- **THEN** 顯示錯誤「第 N 行 buy_date 格式錯誤，請使用 YYYY-MM-DD」並停止匯入

#### Scenario: 報酬率自動偵測
- **WHEN** CSV 的 return_rate 值絕對值大於 1（如 24.03）
- **THEN** 系統視為百分比格式，自動除以 100；絕對值 ≤ 1（如 0.2403）視為小數格式

#### Scenario: 預覽與確認
- **WHEN** CSV 解析成功
- **THEN** 顯示前 5 筆交易預覽 + 「將匯入 N 筆交易」摘要，使用者確認後才呼叫 `importTrades`

#### Scenario: 註解行與空白行跳過
- **WHEN** CSV 中某行以 `#` 開頭或全為空白
- **THEN** 該行不解析為交易，不計入錯誤

#### Scenario: 匯出 CSV 備份
- **WHEN** 使用者點擊「匯出 CSV」按鈕
- **THEN** 系統將目前 `trades` 陣列匯出為與輸入格式相同的 CSV 檔案下載

### Requirement: 原始交易表格顯示
系統 SHALL 在績效分析頁顯示 `RawTradeTable`，列出所有已輸入交易，預設依 sellDate 倒序。

#### Scenario: 表格欄位
- **WHEN** RawTradeTable 渲染且有交易資料
- **THEN** 表格欄位包含：股票（stockId + stockName）、買入日 → 賣出日、持有天數、買入 / 賣出價、股數、損益、報酬率、操作（編輯 / 刪除）

#### Scenario: 預設排序
- **WHEN** 表格首次渲染
- **THEN** 依 sellDate 倒序排列（最近的交易在最上方）

#### Scenario: 欄位點擊切換排序
- **WHEN** 使用者點擊欄位標題
- **THEN** 切換該欄位升冪 / 降冪排序

#### Scenario: 報酬率與損益的紅漲綠跌
- **WHEN** 顯示某筆交易的損益（pnl）或報酬率（returnRate）
- **THEN** 正值用紅色 + `+` 號、負值用綠色 + `−` 號、0 用中性色

#### Scenario: 編輯與刪除動作
- **WHEN** 使用者點擊某列的「✏️ 編輯」
- **THEN** 該列轉為可編輯模式（輸入欄位），點擊「儲存」呼叫 `updateTrade`

- **WHEN** 使用者點擊某列的「🗑 刪除」
- **THEN** 顯示確認對話框，確認後呼叫 `removeTrade`
