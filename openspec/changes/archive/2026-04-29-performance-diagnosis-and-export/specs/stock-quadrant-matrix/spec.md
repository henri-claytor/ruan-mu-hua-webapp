## ADDED Requirements

### Requirement: 矩陣表顯示個股診斷標記
`StockQuadrantMatrix` SHALL 為每一檔個股顯示其觸發的個股層級診斷數量，hover 時顯示完整診斷詳情。

#### Scenario: 診斷欄位顯示
- **WHEN** 矩陣表渲染且有 stock 層級診斷
- **THEN** 每列右側新增「診斷」欄位，顯示該股觸發的診斷數量摘要：「🔴 N」（alert 條數）+「🟡 M」（warning）+「⚪ X」（note）+「ℹ️ Y」（info）

#### Scenario: 沒有觸發任何診斷的個股
- **WHEN** 某股無任何 stock scope 診斷
- **THEN** 該欄顯示「—」或「✓」表示「無需關注」

#### Scenario: Hover tooltip 顯示完整詳情
- **WHEN** 使用者 hover 該欄位
- **THEN** 顯示 tooltip 列出該股所有診斷的 title 與 advice

#### Scenario: 互斥規則處理
- **WHEN** 個股觸發 `stock-all-loss-2` 與 `stock-all-loss-3plus` 兩條互斥規則
- **THEN** 顯示時僅取一條（依 nTrades 條件互斥，實際上不可能同時觸發；測試保證不重複）
