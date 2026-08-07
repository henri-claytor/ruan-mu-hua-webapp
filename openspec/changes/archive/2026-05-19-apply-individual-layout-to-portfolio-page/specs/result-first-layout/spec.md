## ADDED Requirements

### Requirement: PortfolioPage 採手動「計算組合」觸發

系統 SHALL 提供「計算組合」按鈕，使用者設定股票與權重後按下才計算與顯示結果。

#### Scenario: 未準備好時按鈕 disabled

- **WHEN** 任何條件不滿足：股票 < 2、權重總和 ≠ 100、任何股票 monthlyReturns < 10、API 載入中
- **THEN** 按鈕 disabled

#### Scenario: 準備好 + 未計算 → enabled「計算組合」

- **WHEN** `ready === true` 且 `computed === false`
- **THEN** 按鈕 enabled，文字「計算組合」

#### Scenario: 已計算後改動 → 重置

- **WHEN** 改變股票、權重或重新 fetch 數據
- **THEN** `computed` reset 為 `false`，結果區塊不渲染（直到再次按下）

#### Scenario: 已計算狀態

- **WHEN** `computed === true` 且 stocks / weights 未變
- **THEN** 按鈕文字「重新計算」（仍 enabled）

#### Scenario: 載入中

- **WHEN** API 載入中
- **THEN** 按鈕文字「載入中...」+ disabled

### Requirement: PortfolioPage 區塊順序（結論優先）

系統 SHALL 使 PortfolioPage 在計算完成後，採與 IndividualPage 一致的「結論優先」區塊順序。

#### Scenario: 區塊由上至下順序

- **WHEN** PortfolioPage 計算完成
- **THEN** 結果區塊由上至下依序為：
  1. Action buttons（複製摘要 / 下載 PNG）
  2. **操作建議**（ActionGuide）
  3. 期望報酬與損益比優勢（MultiScaleEVBlock）
  4. 個股 vs 組合對比（StockVsPortfolioComparison）
  5. 下行風險（PortfolioVarBlock）
  6. 趨勢延續性偵測（MultiScaleHurstBlock）
  7. 走勢規律性偵測（FractalDimensionBlock）
  8. 未來資產淨值模擬（PortfolioMcBlock）

### Requirement: PortfolioVarBlock 採主判斷金邊結構

`PortfolioVarBlock` SHALL 與個股 VarBlock 結構一致：
- 95% 下行虧損為主判斷（金邊 + 主判斷 chip + 風險等級徽章 + 40px 大數字）
- 99% 下行虧損為橫向參考列
- Histogram 在區塊底部

#### Scenario: 95% 主卡渲染

- **WHEN** 計算完成
- **THEN** 顯示主卡「組合 95% 下行虧損」+ 金色 2px 邊框 + 右上「主判斷」chip + 風險等級徽章 + 40px serif 數字 + 底層「N 筆樣本第 5 百分位」

#### Scenario: 99% 橫向參考列

- **WHEN** 主卡之後
- **THEN** 顯示橫向參考列：「99% 下行虧損」+ 「第 1 百分位」+ 20px 數字 + 「有 1% 機率虧損超過 X%」

### Requirement: PortfolioMcBlock 採 3 卡並排結構

`PortfolioMcBlock` SHALL 與個股 McBlock 結構一致：1 年 / 3 年 / 5 年三卡並排，5 年為主判斷。

#### Scenario: 3 卡並排

- **WHEN** 計算完成
- **THEN** 顯示 grid-cols-3：1 年 / 3 年 / 5 年
- **AND** 5 年卡採主判斷樣式（金邊 + 主判斷 chip + 40px + μ/σ 底層）
- **AND** 1 年、3 年卡採普通樣式（cream + 36px）

### Requirement: PortfolioPage 含走勢規律性 D 區塊

系統 SHALL 在 PortfolioPage 的 Hurst 區塊之後加入 FractalDimensionBlock（走勢規律性偵測），與個股頁一致。

#### Scenario: D 區塊渲染條件

- **WHEN** `hurstMulti !== null`
- **THEN** 在 MultiScaleHurstBlock 之後渲染 `<FractalDimensionBlock hurst={hurstMulti} />`

### Requirement: PortfolioPage 命名一致

PortfolioPage 內所有使用者面對的字串 SHALL 與個股頁命名一致：「VaR」→「下行虧損」、「賠率」→「損益比」。

#### Scenario: VarBlock 標題與副標

- **WHEN** PortfolioVarBlock 渲染
- **THEN** 標題為「下行風險：最壞情境虧損」
- **AND** 副標包含「95% / 99% 下行虧損 · 使用 {freqLabel}」（不含 VaR 字眼）
