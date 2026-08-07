# per-stock-stats Specification

## Purpose

對使用者交易紀錄分組到「每一檔股票」層級計算績效指標：交易筆數、勝率、賠率、獲利因子、總損益、損益貢獻度、平均持有天數、4 象限分類。為績效分析頁的個股矩陣表提供資料源。

## Requirements

### Requirement: 個股績效統計計算
系統 SHALL 提供 `calcStockStats(trades, stockId, totalPortfolioPnl)` 與 `calcAllStockStats(trades)` 函式，對每一檔個股分別計算績效指標。

#### Scenario: StockStats 介面欄位完整
- **WHEN** 函式成功計算
- **THEN** 回傳 `StockStats` 包含：`stockId`、`stockName`、`nTrades`、`nWins`、`nLosses`、`winRate`、`avgWinReturnRate`、`avgLossReturnRate`、`payoffRatio`、`totalWinPnl`、`totalLossPnl`、`profitFactor`、`totalPnl`、`pnlContribution`、`avgHoldingDays`、`quadrant`

#### Scenario: 沒有該股票交易時回傳 null
- **WHEN** `calcStockStats(trades, stockId, ...)` 中 trades 過濾後為空
- **THEN** 回傳 `null`

#### Scenario: 全勝個股 payoff 與 profit factor 為 Infinity
- **WHEN** 該股票所有交易 pnl > 0
- **THEN** `payoffRatio = Infinity`、`profitFactor = Infinity`、`quadrant = 'Q1: 打法好・結果好'`

#### Scenario: 全敗個股
- **WHEN** 該股票所有交易 pnl < 0
- **THEN** `winRate = 0`、`payoffRatio = 0`、`profitFactor = 0`、`quadrant = 'Q4: 打法差・結果差（全面檢討）'`

#### Scenario: pnlContribution 計算
- **WHEN** `totalPortfolioPnl !== 0`
- **THEN** `pnlContribution = stockTotalPnl / totalPortfolioPnl`（可正可負，可大於 1 也可小於 -1，當組合層級損益小於個股時）

#### Scenario: pnlContribution 為 0 當組合損益為 0
- **WHEN** `totalPortfolioPnl === 0`
- **THEN** `pnlContribution = 0`（避免除以 0）

#### Scenario: stockName 由第一筆交易取得
- **WHEN** 計算某 stockId 的 stats
- **THEN** stockName 取該股票第一筆交易（依 sellDate 升序）的 stockName 欄位

### Requirement: calcAllStockStats 排序
`calcAllStockStats(trades)` SHALL 回傳所有有交易的個股的 StockStats 陣列，依 `|totalPnl|` 降序排列。

#### Scenario: 排序由絕對損益大至小
- **WHEN** 函式成功計算
- **THEN** 結果依 `Math.abs(totalPnl)` 降序排列（不分獲利或虧損，貢獻最大者在前）

#### Scenario: 唯一 stockId
- **WHEN** trades 中包含同一 stockId 多筆交易
- **THEN** 該 stockId 在結果中僅出現一筆 StockStats（多筆交易合併計算）

#### Scenario: 空陣列
- **WHEN** trades.length === 0
- **THEN** 回傳空陣列 `[]`
