## Why

目前每個分頁（Individual、VaR、MonteCarlo、Portfolio）的重點結果埋在大量計算步驟之下，使用者必須捲動才能看到期望值、VaR 數字、蒙地卡羅圖表等核心輸出。在課程教學情境下，阮慕驊或學員開啟 Sheet 時應立即看到結論，細節計算供驗算用即可。

## What Changes

- **Individual 分頁**：將期望值結果卡片（EV、象限判斷、賠率摘要）移至最上方，基礎統計與計算步驟移至下方
- **VaR 分頁**：將 VaR 95%/99% 結果與解讀文字移至最上方，排序數據表移至下方
- **MonteCarlo 分頁**：將 P5/P50/P95 統計結果與圖表移至最上方，基礎參數與路徑明細移至下方
- **Portfolio 分頁**：每個 Section 內部重新排序，結果優先、輸入與計算步驟其次；Section 1（比重輸入）維持最上方不動

## Capabilities

### New Capabilities
- `result-first-layout`：各分頁採用「結果優先」排版原則——重點數字與圖表置頂，計算過程與驗算數據置底

### Modified Capabilities

## Impact

- `setup_sheet.gs` 的四個 setup 函數（`setupIndividual`、`setupVaR`、`setupMonteCarlo`、`setupPortfolio`）需全部重寫列號配置
- 圖表的 `setPosition` 列號需隨之調整
- 命名範圍（`returns`、`portfolio_returns`）與各函數內的公式列號參照需同步更新
