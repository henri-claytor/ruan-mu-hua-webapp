## MODIFIED Requirements

### Requirement: 4 象限分類（基於賠率 × 獲利因子）
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
- **THEN** 沿用既有 4 象限規則（Infinity 視為高）

### Requirement: 個股績效統計計算（含單向紀錄判定）
`calcStockStats` 與 `calcPortfolioPerformance` SHALL 在呼叫 `classifyPerformanceQuadrant` 時傳入 nWins 與 nLosses，使全勝/全敗自動歸入「單向紀錄」。

#### Scenario: 全勝個股 quadrant
- **WHEN** 某股 nWins === N（N > 0） 且 nLosses === 0
- **THEN** `stats.quadrant === '單向紀錄（全勝或全敗）'`（不再是 Q1）

#### Scenario: 全敗個股 quadrant
- **WHEN** 某股 nWins === 0 且 nLosses === N（N > 0）
- **THEN** `stats.quadrant === '單向紀錄（全勝或全敗）'`（不再是 Q4）
