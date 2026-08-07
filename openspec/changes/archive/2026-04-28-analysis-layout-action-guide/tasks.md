## 1. IndividualPage 分析區塊重排

- [x] 1.1 將 IndividualPage 的 `<McBlock>` 移至 `<VarBlock>` 之前（月報酬軌道：EV → MC；風險頻率軌道：VaR → Hurst）
- [x] 1.2 在兩軌道之間插入視覺分隔線，標示「風險頻率軌道」及使用的 `freqLabel`

## 2. ActionGuide 元件

- [x] 2.1 建立 `src/components/ActionGuide.tsx`，定義 `IndividualSignals`、`PortfolioSignals`、`CompareSignals` 型別
- [x] 2.2 實作 `buildIndividualGuide(signals)` → 建議訊息陣列（EV、varLevel、hurstH 三軸規則）
- [x] 2.3 實作 `buildPortfolioGuide(signals)` → 建議訊息陣列（EV、varLevel、stockCount、hurstH）
- [x] 2.4 實作 `buildCompareGuide(signals)` → 建議訊息陣列（雙股 EV、VaR、Hurst 比較）
- [x] 2.5 實作 `ActionGuide` React 元件，接受 `items: string[]` 渲染建議列表 + 免責聲明

## 3. 各頁面整合

- [x] 3.1 IndividualPage：計算 `varLevel`（以 `|var95|` 判斷 low/mid/high），呼叫 `buildIndividualGuide`，在 Hurst 區塊後渲染 `<ActionGuide>`
- [x] 3.2 PortfolioPage：計算 `varLevel` 與 `stockCount`，在 MC 結果後渲染 `<ActionGuide>`
- [x] 3.3 ComparePage：當兩股均有資料時，收集 evA/evB/varA/varB/hurstA/hurstB，渲染 `<ActionGuide>`
