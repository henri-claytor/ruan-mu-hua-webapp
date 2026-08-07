# Proposal: Analysis Layout & Action Guide

## Why

個股分析頁的四個分析區塊（EV、VaR、蒙地卡羅、Hurst）目前依「功能類型」排列，但 VaR 與 Hurst 共用同一套頻率資料（日報酬 or 月報酬 fallback），而蒙地卡羅與 EV 同樣基於月報酬，資料來源不同的區塊交錯排列，使用者難以理解計算邏輯關係。此外三個分析頁（個股、組合、比較）在呈現計算結果後缺乏行動導向說明，使用者看到數字後不知道該怎麼做。

## What Changes

- **重排 IndividualPage 分析區塊**：將同頻率的分析區塊相鄰放置：月報酬軌道（EV → 蒙地卡羅），風險頻率軌道（VaR → Hurst），並以視覺分隔線標示兩軌道
- **新增建議行動說明（ActionGuide）元件**：根據分析結果產生 2–4 條具體建議，顯示在各頁結果區塊底部
  - IndividualPage：基於 EV、VaR 等級、Hurst 解讀三軸綜合建議
  - PortfolioPage：基於組合 EV、VaR 等級、Hurst（若有）
  - ComparePage：比較兩股的優劣，提出優先考慮建議

## Capabilities

### New Capabilities
- `action-guide`：根據分析計算結果產生結構化建議行動清單（signal → message mapping），並以卡片形式呈現在各分析頁

### Modified Capabilities
- （無規格層級異動，分析計算邏輯不變）

## Impact

- `src/pages/IndividualPage.tsx`：重排 VarBlock / McBlock / HurstBlock 順序；新增頻率軌道標題分隔
- `src/pages/PortfolioPage.tsx`：新增 ActionGuide 元件
- `src/pages/ComparePage.tsx`：新增 ActionGuide 元件
- `src/components/ActionGuide.tsx`：新增元件（輸入各頁分析結果物件，輸出建議列表）
- 無 API 異動、無 store 異動、無第三方依賴
