## ADDED Requirements

### Requirement: 矩陣表支援外部傳入個股篩選
`StockQuadrantMatrix` SHALL 接受可選的 `filterStockId?: string` prop，當提供時自動將表格過濾為僅該股票，並可手動清除。

#### Scenario: filterStockId 預設過濾
- **WHEN** `<StockQuadrantMatrix stocks={...} filterStockId="2330" />`
- **THEN** 表格僅顯示 stockId 為 2330 的列；4 象限篩選 chips 仍可用，但與此 stockId 篩選同時生效（AND 關係）

#### Scenario: 過濾標籤顯示
- **WHEN** filterStockId 有值
- **THEN** 矩陣表頂部顯示一個藍色標籤：「篩選：{stockId} {stockName} ✕」，✕ 為清除按鈕

#### Scenario: 清除過濾
- **WHEN** 使用者點擊清除按鈕（✕）
- **THEN** 元件內部狀態重設，顯示全部個股；外部傳入的 prop 不變（由父層決定是否同步 URL）

#### Scenario: 找不到對應 stockId 的處理
- **WHEN** filterStockId 在 stocks 陣列中不存在
- **THEN** 顯示空態「無此股票的交易紀錄」+ 「← 顯示全部」按鈕（清除過濾）
