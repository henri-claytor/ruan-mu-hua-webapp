# portfolio-performance-metrics Specification

## Purpose

對使用者的交易紀錄計算整體組合績效指標：勝率、賠率（payoff ratio）、獲利因子（profit factor）、期望值、最大回撤、年化報酬率、持有期間統計、5 象限分類等。為「績效分析」功能提供計算引擎。

## Requirements

### Requirement: 整體績效核心指標計算
系統 SHALL 提供 `calcPortfolioPerformance(trades)` 函式，輸入 Trade 陣列，輸出完整的整體組合績效指標 `PortfolioPerformance`。當 `trades.length === 0` 時回傳 `null`。

#### Scenario: 空陣列回傳 null
- **WHEN** `trades.length === 0`
- **THEN** 函式回傳 `null`

#### Scenario: 計數欄位
- **WHEN** 函式成功計算
- **THEN** 結果包含 `nTrades`（總筆數）、`nWins`（pnl > 0 筆數）、`nLosses`（pnl < 0 筆數）、`nFlat`（pnl === 0 筆數）

#### Scenario: 總損益與報酬
- **WHEN** 函式成功計算
- **THEN** `totalPnl = Σ(pnl)`、`totalInvested = Σ(buyAmount)`、`overallReturn = totalPnl / totalInvested`

#### Scenario: 年化報酬率
- **WHEN** 函式成功計算
- **THEN** 操作天數 = `max(sellDate) − min(buyDate) + 1`；`annualizedReturn = (1 + overallReturn)^(365 / 操作天數) − 1`

#### Scenario: 勝率
- **WHEN** 函式成功計算
- **THEN** `winRate = nWins / nTrades`

#### Scenario: 賠率（payoff ratio）
- **WHEN** 函式成功計算且有勝有敗
- **THEN** `avgWinReturnRate = mean(returnRate | pnl > 0)`、`avgLossReturnRate = mean(returnRate | pnl < 0)`（負值）、`payoffRatio = avgWinReturnRate / abs(avgLossReturnRate)`

#### Scenario: 全勝時 payoffRatio 為 Infinity
- **WHEN** 沒有任何虧損交易（nLosses === 0）
- **THEN** `payoffRatio = Infinity`，UI 顯示時改為「∞」或「全勝」

#### Scenario: 獲利因子（profit factor）
- **WHEN** 函式成功計算
- **THEN** `profitFactor = sum(pnl | pnl > 0) / abs(sum(pnl | pnl < 0))`

#### Scenario: 全勝時 profitFactor 為 Infinity
- **WHEN** 沒有任何虧損交易
- **THEN** `profitFactor = Infinity`

#### Scenario: 期望值
- **WHEN** 函式成功計算
- **THEN** `expectedValue = winRate × avgWinPnl + (nLosses / nTrades) × avgLossPnl`（其中 avgLossPnl 為負值）；同理 `expectedReturnRate` 用報酬率計算

#### Scenario: 最大回撤計算
- **WHEN** 函式成功計算
- **THEN** 將 trades 依 sellDate 升序排序，計算累積損益曲線（cumPnl）、滾動高點（runningMax）、回撤（drawdown = cumPnl − runningMax）；`maxDrawdown = min(drawdown)`（負值或 0）；`maxDrawdownPct = maxDrawdown / runningMax[idx]`，其中 idx 為 `argmin(drawdown)`

#### Scenario: 從未創高時 maxDrawdownPct
- **WHEN** runningMax[idx] 為 0 或負值
- **THEN** `maxDrawdownPct = 0`（避免除以 0）

#### Scenario: 持有期間統計
- **WHEN** 函式成功計算
- **THEN** 對每筆計算 `holdingDays = daysBetween(buyDate, sellDate)`；`avgHoldingDays = mean(...)`、`maxHoldingDays = max(...)`、`minHoldingDays = min(...)`

### Requirement: 5 象限分類（基於賠率 × 獲利因子 + 單向紀錄）
系統 SHALL 提供 `classifyPerformanceQuadrant(payoffRatio, profitFactor, nWins?, nLosses?)`，回傳 5 種分類之一（含「單向紀錄」邊界類別）。

#### Scenario: 單向紀錄（全勝）
- **WHEN** nWins > 0 且 nLosses === 0（提供 nWins / nLosses 參數時）
- **THEN** 回傳 `'單向紀錄（全勝或全敗）'`，不再判斷 payoff / profit factor 門檻

#### Scenario: 單向紀錄（全敗）
- **WHEN** nWins === 0 且 nLosses > 0（提供 nWins / nLosses 參數時）
- **THEN** 回傳 `'單向紀錄（全勝或全敗）'`

#### Scenario: Q1 打法好・結果好
- **WHEN** 有勝有敗且 `payoffRatio >= 1.5` 且 `profitFactor >= 2.0`
- **THEN** 回傳 `'Q1: 打法好・結果好'`

#### Scenario: Q2 打法差・結果好
- **WHEN** 有勝有敗且 `payoffRatio < 1.5` 且 `profitFactor >= 2.0`
- **THEN** 回傳 `'Q2: 打法差・結果好（靠重倉或勝率撐場）'`

#### Scenario: Q3 打法好・結果差
- **WHEN** 有勝有敗且 `payoffRatio >= 1.5` 且 `profitFactor < 2.0`
- **THEN** 回傳 `'Q3: 打法好・結果差（資金管理需改善）'`

#### Scenario: Q4 打法差・結果差
- **WHEN** 有勝有敗且 `payoffRatio < 1.5` 且 `profitFactor < 2.0`
- **THEN** 回傳 `'Q4: 打法差・結果差（全面檢討）'`

#### Scenario: 向後相容（無 nWins/nLosses 參數）
- **WHEN** 呼叫時未提供 nWins / nLosses
- **THEN** 沿用既有 4 象限規則（Infinity 視為高，全勝歸 Q1）

### Requirement: calcStockStats 與 calcPortfolioPerformance 傳入 nWins/nLosses
`calcStockStats` 與 `calcPortfolioPerformance` SHALL 在呼叫 `classifyPerformanceQuadrant` 時傳入 nWins 與 nLosses，使全勝/全敗自動歸入「單向紀錄」。

#### Scenario: 全勝個股 quadrant
- **WHEN** 某股 nWins === N（N > 0） 且 nLosses === 0
- **THEN** `stats.quadrant === '單向紀錄（全勝或全敗）'`（不再是 Q1）

#### Scenario: 全敗個股 quadrant
- **WHEN** 某股 nWins === 0 且 nLosses === N（N > 0）
- **THEN** `stats.quadrant === '單向紀錄（全勝或全敗）'`（不再是 Q4）
