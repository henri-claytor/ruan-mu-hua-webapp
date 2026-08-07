## MODIFIED Requirements

### Requirement: 個股頁手動查詢觸發

系統 SHALL 在 IndividualPage 提供「查詢」按鈕，由使用者按下後才觸發 API 取資料與計算；StockSelector 選股本身不再自動 fetch。

#### Scenario: 選股後不自動查詢

- **WHEN** 使用者在 StockSelector 選擇一支股票
- **THEN** 該股票進入「待查詢」狀態（`pendingCode`），不發 API
- **AND** 結果區仍維持上一次查詢結果（或空態，若尚未查過）

#### Scenario: 按查詢按鈕觸發 API

- **WHEN** 使用者按「查詢」按鈕（`.btn-solid`）
- **THEN** 系統呼叫 `fetchMonthlyReturns` + `fetchDailyReturns`
- **AND** 計算 EV / VaR / Hurst / Monte Carlo，更新 `queriedCode` 與結果

#### Scenario: 查詢按鈕狀態

- **WHEN** 尚未選股（pendingCode 為空）
- **THEN** 查詢按鈕 disabled

- **WHEN** 已選股但未查（pendingCode !== queriedCode）
- **THEN** 查詢按鈕 enabled，文字「查詢」

- **WHEN** 已查過且 pendingCode === queriedCode
- **THEN** 按鈕文字「重新查詢」（仍 enabled，可手動再查）

- **WHEN** API 載入中
- **THEN** 按鈕顯示載入態（文字「查詢中...」+ disabled）

#### Scenario: URL `?code=` 仍生效

- **WHEN** URL 帶 `?code=2330`
- **THEN** 載入時自動將 2330 設為 pendingCode 並立即觸發查詢（保留 deep link 行為）

### Requirement: StockSelector 下拉清單可滾動

`StockSelector` 的搜尋下拉清單 SHALL 在候選項目超過視窗高度時顯示 scroll bar，並支援滑鼠滾輪 / 觸控板捲動。

#### Scenario: 下拉清單高度限制

- **WHEN** 搜尋下拉清單渲染
- **THEN** 容器設定 `max-h-[300px] overflow-y-auto`
- **AND** 候選項目超過容器高度時，使用者可滾動瀏覽全部候選

#### Scenario: Scroll bar 可見

- **WHEN** 候選清單長度超過容器
- **THEN** 右側顯示瀏覽器原生 scroll bar（或 styled scroll bar），不隱藏
