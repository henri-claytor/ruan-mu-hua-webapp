## ADDED Requirements

### Requirement: PerformanceCharts 整合持有期間相關性散布圖
`PerformanceCharts` 元件 SHALL 在既有圖表之後，加入 `HoldingReturnScatter` 散布圖，呈現持有天數與報酬率的相關性分析。

#### Scenario: 散布圖位置
- **WHEN** `PerformanceCharts` 渲染且 `trades.length >= 5`
- **THEN** `HoldingReturnScatter` 渲染在 `PerformanceCharts` 內，位於既有圖表清單末尾

#### Scenario: 樣本不足時跳過
- **WHEN** `trades.length < 5`
- **THEN** `HoldingReturnScatter` 不渲染，其他圖表照常顯示
