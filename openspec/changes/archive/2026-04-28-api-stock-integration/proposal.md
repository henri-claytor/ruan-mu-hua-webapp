## Why

目前工具需要使用者手動貼入報酬率數值，操作門檻高且容易出錯。現在有現成的 CMoney API 可直接提供台股清單與個股月/日報酬率，應改為 API 驅動的股票選擇器，讓使用者選股即可自動取得數據、立即開始分析。

## What Changes

- **BREAKING** 移除個股分析頁、投資組合頁的手動貼入 textarea 輸入方式，改為股票選擇器 + API 自動抓取
- 新增股票選擇器元件：搜尋股票代號或名稱，從 API 清單中選取
- 個股分析頁：選股後自動呼叫月報酬 API + 日報酬 API，分別取得數據
- 投資組合分析頁：每支股票各自透過 API 取得月報酬與日報酬
- 移除 `/hurst` 獨立頁面與導覽項目（**BREAKING**）
- 將 Hurst 指數整合至個股分析頁與投資組合分析頁的結果區
- 雙頻計算架構：月報酬 → EV + 蒙地卡羅；日報酬 → VaR + Hurst（日頻標注）
- 若日報酬 API 回傳失敗或筆數不足，自動降級使用月報酬計算 VaR + Hurst，並標注「月頻」
- NavBar 簡化為：首頁 / 個股分析 / 投資組合 / 比較分析

## Capabilities

### New Capabilities

- `stock-selector`: 股票選擇器元件，透過 CMoney API 取得台股清單（2000+ 支），支援代號/名稱搜尋，選取後回傳股票代號
- `cmoney-api-client`: CMoney API 整合層，封裝三支 API 呼叫（股票清單、月報酬、日報酬），處理回傳格式解析與錯誤處理
- `dual-frequency-analysis`: 雙頻計算架構，月報酬用於 EV + 蒙地卡羅，日報酬用於 VaR + Hurst，結果標注頻率來源

### Modified Capabilities

- `individual-ev-calculator`: 輸入方式從 textarea 改為股票選擇器 + API 抓取，新增 Hurst 結果區塊（整合自 hurst-calculator）
- `portfolio-analyzer`: 每支股票改為股票選擇器輸入，新增投資組合 Hurst 結果區塊
- `result-first-layout`: 個股頁結果順序更新為 EV → VaR（日頻）→ 蒙地卡羅 → Hurst（日頻）
- `interactive-charts`: Hurst 累積偏差折線圖從獨立頁移至個股與投資組合頁的結果區

## Impact

- **移除**：`src/pages/HurstPage.tsx`、`/hurst` route、NavBar 項目
- **新增**：`src/components/StockSelector.tsx`、`src/lib/api.ts`（CMoney API client）
- **大幅修改**：`IndividualPage.tsx`、`PortfolioPage.tsx`、`NavBar.tsx`、`App.tsx`
- **新依賴**：無（純 fetch API，無需新套件）
- **API 限制**：三支 API URL 結構固定，僅 `AssignID` 參數可變動
