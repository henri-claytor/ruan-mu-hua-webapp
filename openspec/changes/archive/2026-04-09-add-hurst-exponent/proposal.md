## Why

個股與組合的月報酬率序列是否具有趨勢延續性，是判斷策略可靠性的重要依據。目前工具僅提供期望值、VaR 與蒙地卡羅模擬，缺少衡量時間序列「記憶性」的指標。加入赫斯特指數（Hurst Exponent, H）可讓使用者快速判斷資產報酬是趨勢型、隨機型還是均值回歸型，直接對應課程中對市場行為的分類框架。

## What Changes

- 在 Individual 分頁新增 **Hurst Exponent 區塊**，計算個股月報酬率序列的 H 值，並提供解讀說明
- 在 Portfolio 分頁新增 **Hurst Exponent 區塊**，計算加權組合月報酬率序列的 H 值
- H 值使用 **R/S 分析法**（Rescaled Range Analysis）以 Google Sheet 公式實作，無需 Apps Script 計算
- 提供三區間判斷：H > 0.6（趨勢延續）、0.4–0.6（隨機遊走）、H < 0.4（均值回歸）

## Capabilities

### New Capabilities
- `hurst-exponent-individual`: Individual 分頁的赫斯特指數計算區塊（基於 `returns` 命名範圍）
- `hurst-exponent-portfolio`: Portfolio 分頁的赫斯特指數計算區塊（基於 `portfolio_returns` 命名範圍）

### Modified Capabilities
- `result-first-layout`: Individual 與 Portfolio 分頁新增 Hurst Exponent 區塊，須整合至現有結果置頂版面

## Impact

- `setup_sheet.gs`：`setupIndividual()` 與 `setupPortfolio()` 新增 Hurst Exponent 區塊
- 不影響現有命名範圍（`returns`、`portfolio_returns`）
- 不影響現有 VaR、MonteCarlo、期望值計算
- 新增 Google Sheet 中間計算欄位（R/S 分析的子計算步驟）
