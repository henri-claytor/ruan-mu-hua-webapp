## ADDED Requirements

### Requirement: 個股分析頁支援深度連結
個股分析頁（`/individual`）SHALL 支援透過 URL query string `?code=` 自動載入指定股票，與既有手動選股流程共存。

#### Scenario: 透過 query string 載入股票
- **WHEN** 使用者導航至 `/individual?code=2330`
- **THEN** IndividualPage 在 mount 時讀取 `code=2330`，自動觸發 `handleSelect('2330', '')`，載入該股票的 EV / VaR / Hurst / MC 分析

#### Scenario: query string 為空或缺失
- **WHEN** 使用者導航至 `/individual` 沒有 `?code=` 參數
- **THEN** 頁面行為與既有相同（顯示空態，等待使用者用 StockSelector 選股）

#### Scenario: query string 與既有狀態衝突
- **WHEN** 使用者已在頁面上選了 2317，後切換至 `/individual?code=2330`
- **THEN** 以 query string 為主，自動載入 2330（覆寫既有狀態）

#### Scenario: 重複導航至相同 code
- **WHEN** 使用者已載入 2330，再點擊另一個指向 `/individual?code=2330` 的連結
- **THEN** 不重新觸發載入（避免不必要的 API 呼叫）

#### Scenario: 不存在的股票代碼
- **WHEN** `code=9999` 在 stockList 中不存在
- **THEN** 仍嘗試呼叫 API，失敗則顯示既有 error 訊息（沿用 fetchMonthlyReturns 的錯誤處理）
