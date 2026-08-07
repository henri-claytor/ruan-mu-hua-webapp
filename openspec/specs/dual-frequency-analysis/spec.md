## ADDED Requirements

### Requirement: 雙頻計算架構

系統 SHALL 依數據頻率分配計算任務：月報酬用於 EV + 蒙地卡羅，日報酬用於 VaR + Hurst；每個結果區塊標注數據頻率來源。

| 計算 | 主要數據源 | 最低筆數 |
|------|---------|---------|
| EV 期望值 | 月報酬 | 60 筆 |
| 蒙地卡羅 | 月報酬 | 60 筆 |
| VaR 95%/99% | 日報酬（降級→月報酬）| 252 筆（日）/ 60 筆（月）|
| Hurst 指數 | 日報酬（降級→月報酬）| 252 筆（日）/ 60 筆（月）|

#### Scenario: 日報酬充足時使用日頻

- **WHEN** 日報酬筆數 ≥ 252
- **THEN** VaR 結果標題顯示「風險值（VaR）— 日頻」，Hurst 標題顯示「Hurst 指數 — 日頻」

#### Scenario: 日報酬不足時降級月頻

- **WHEN** 日報酬筆數 < 252 或日報酬 API 失敗
- **THEN** VaR 與 Hurst 改用月報酬計算，標題標注「— 月頻」

#### Scenario: 月報酬取最新 120 筆

- **WHEN** 月報酬 API 回傳 488 筆歷史數據
- **THEN** 系統預設取最新 120 筆（最近 10 年）供 EV + 蒙地卡羅計算

### Requirement: 頻率標注顯示

每個計算結果區塊的標題列 SHALL 標注數據頻率，讓使用者清楚知道計算依據。

#### Scenario: 標注日頻

- **WHEN** VaR 使用日報酬計算
- **THEN** 區塊標題為「風險值（VaR）」，副標題顯示「使用日報酬 N 筆」

#### Scenario: 標注月頻降級

- **WHEN** VaR 因日報酬不足而改用月報酬
- **THEN** 區塊標題為「風險值（VaR）」，副標題顯示「使用月報酬 N 筆（日頻數據不足）」

### Requirement: 投資組合日頻條件

投資組合分析 SHALL 在全部股票均有 ≥ 252 筆日報酬時，以加權日報酬計算 VaR + Hurst；否則以加權月報酬計算並標注降級原因。

#### Scenario: 全部股票有日報酬

- **WHEN** 投資組合所有股票日報酬筆數均 ≥ 252
- **THEN** 計算加權日報酬序列，以日頻執行 VaR + Hurst

#### Scenario: 部分股票缺日報酬

- **WHEN** 投資組合中有任一股票日報酬筆數 < 252
- **THEN** 以加權月報酬計算 VaR + Hurst，並顯示「{股票名稱} 日頻數據不足，改用月頻計算」

## ADDED Requirements (individual page query trigger)

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
