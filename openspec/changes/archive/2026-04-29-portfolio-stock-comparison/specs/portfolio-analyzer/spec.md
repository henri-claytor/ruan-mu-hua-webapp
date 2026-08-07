## ADDED Requirements

### Requirement: 組合頁版面新增「個股 vs 組合對比」區塊
組合分析頁 SHALL 在 `<MultiScaleEVBlock>` 之後、`<PortfolioVarBlock>` 之前插入 `<StockVsPortfolioComparison>` 區塊。

#### Scenario: 完整版面順序（含對比區塊）
- **WHEN** Portfolio 頁面結果區渲染且 ready === true
- **THEN** 區塊由上至下順序為：組合期望報酬與賠率優勢 → **個股 vs 組合對比** → 組合下行風險 → 組合趨勢延續性偵測 → 組合未來淨值模擬 → 建議行動參考

#### Scenario: 對比區塊條件性顯示
- **WHEN** 組合 evMulti 或 varResult 任一為 null
- **THEN** 不渲染對比區塊（既有區塊順序不受影響）
