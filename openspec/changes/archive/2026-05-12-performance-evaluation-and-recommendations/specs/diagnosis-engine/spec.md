## MODIFIED Requirements

### Requirement: 診斷規則引擎主函式
系統 SHALL 提供 `diagnose(trades, performance, stocks)` 函式，輸入交易紀錄、整體績效、個股統計，輸出 `Diagnosis[]` 結構化診斷陣列。DiagnosisLevel 擴為 5 個值（含 `'advantage'`）。

#### Scenario: Diagnosis 介面欄位
- **WHEN** 函式回傳任一 Diagnosis 物件
- **THEN** 包含欄位：`id`、`level`（'advantage' | 'alert' | 'warning' | 'note' | 'info'）、`scope`、選填 `stockId`、`title`、`message`、`advice`

#### Scenario: 空交易資料
- **WHEN** trades.length === 0 或 performance 為 null
- **THEN** 函式回傳 `[]`

#### Scenario: 排序順序
- **WHEN** 函式有多條診斷
- **THEN** 結果依 level 排序：advantage → alert → warning → note → info；同 level 內 portfolio 先於 stock

## ADDED Requirements

### Requirement: 組合層級「優勢」規則（6 條）
診斷引擎 SHALL 提供 6 條組合層級「優勢」規則，所有 level 皆為 `'advantage'`，message 均含具體數字。

#### Scenario: 獲利因子非常強勢（adv-profit-factor-strong）
- **WHEN** profitFactor 為有限值且 > 4
- **THEN** 觸發 `adv-profit-factor-strong`，level=advantage；message 含 profitFactor 的兩位小數值

#### Scenario: 勝率與損益比均衡（adv-balanced-win-payoff）
- **WHEN** winRate ≥ 0.7 且 payoffRatio 為有限值且 ≥ 1.5
- **THEN** 觸發 `adv-balanced-win-payoff`，level=advantage；message 含勝率（%）與賠率值

#### Scenario: 勝率極高（adv-high-win-rate）
- **WHEN** winRate ≥ 0.8 且未觸發 `adv-balanced-win-payoff`
- **THEN** 觸發 `adv-high-win-rate`，level=advantage

#### Scenario: 賠率優勢明顯（adv-strong-payoff）
- **WHEN** payoffRatio 為有限值且 ≥ 2.5 且未觸發 `adv-balanced-win-payoff`
- **THEN** 觸發 `adv-strong-payoff`，level=advantage

#### Scenario: 期望值為正（adv-positive-ev）
- **WHEN** expectedValue > 0 且 nTrades ≥ 10 且未觸發前述 PF/balanced 規則
- **THEN** 觸發 `adv-positive-ev`，level=advantage；message 含期望值金額

#### Scenario: 最大回撤可控（adv-low-drawdown）
- **WHEN** maxDrawdownPct > −0.05（含 maxDrawdownPct === 0）
- **THEN** 觸發 `adv-low-drawdown`，level=advantage；message 含回撤百分比

#### Scenario: 優勢規則互斥處理
- **WHEN** `adv-balanced-win-payoff` 觸發
- **THEN** 不再觸發 `adv-high-win-rate` / `adv-strong-payoff` / `adv-positive-ev`（後三者是前者的退而求其次）

#### Scenario: `adv-profit-factor-strong` 不互斥於其他優勢
- **WHEN** profitFactor > 4 且同時 winRate ≥ 0.7、payoffRatio ≥ 1.5
- **THEN** 同時觸發 `adv-profit-factor-strong` 與 `adv-balanced-win-payoff`

### Requirement: 重點建議產生器（buildRecommendations）
系統 SHALL 提供 `buildRecommendations(diagnoses, stocks, performance): Recommendation[]` 函式，將 diagnoses 中具行動性的條目聚合為編號式重點建議。

#### Scenario: Recommendation 介面欄位
- **WHEN** 函式回傳任一 Recommendation
- **THEN** 包含欄位：`id`、`title`、`body`、`priority`、`scope`（'portfolio' | 'specific-stock'）、選填 `stockId`

#### Scenario: 聚合停損紀律問題
- **WHEN** 有 ≥ 1 條 `stock-all-loss-3plus` 或 `stop-loss-discipline` 診斷
- **THEN** 產生「強化停損紀律」建議（priority=1），body 含全敗標的名稱與固定停損線建議

#### Scenario: 個股賠率問題單獨成條
- **WHEN** 任一 `stock-low-payoff` 診斷
- **THEN** 為該股產生「改善 {stockName} 操作方式」建議（priority=2），body 含賠率數據與部位調整建議

#### Scenario: 個股資金管理問題單獨成條
- **WHEN** 任一 `stock-money-management` 診斷
- **THEN** 為該股產生「檢討 {stockName} 押注管理」建議（priority=3），body 含賠率與獲利因子數據

#### Scenario: 集中度問題
- **WHEN** 有 `concentration-risk` 診斷
- **THEN** 產生「降低組合集中度」建議（priority=4），body 含前 2 大標的名稱與貢獻百分比

#### Scenario: 固定條目「追蹤更多績效指標」
- **WHEN** trades.length > 0
- **THEN** 不論其他條件如何，固定產生「追蹤更多績效指標」建議（priority=9）

#### Scenario: 輸出排序
- **WHEN** 有多條 recommendation
- **THEN** 依 priority 升序排列（最重要的在前）

#### Scenario: 空交易資料
- **WHEN** trades.length === 0
- **THEN** 函式回傳 `[]`
