## REMOVED Requirements

### Requirement: 股票數據手動輸入
**Reason**: 手動 textarea 輸入方式改由股票選擇器 + API 自動抓取。
**Migration**: 每支股票改用 StockSelector 選取，系統自動取得各股月報酬與日報酬數據。

## ADDED Requirements

### Requirement: 投資組合以股票選擇器建立

Portfolio Analyzer 頁面 SHALL 讓使用者透過 `StockSelector` 選取每支股票（最多 10 支），選取後自動呼叫月報酬 + 日報酬 API，不再需要手動貼入數據。

#### Scenario: 新增股票至投資組合

- **WHEN** 使用者點擊「+ 新增股票」並從 StockSelector 選取股票
- **THEN** 系統自動抓取該股月報酬與日報酬，抓取完成後啟用比重輸入欄

#### Scenario: 移除股票

- **WHEN** 使用者點擊某支股票的「×」按鈕
- **THEN** 該股從組合中移除，組合結果即時重算

#### Scenario: 同一支股票不可重複加入

- **WHEN** 使用者嘗試選取組合中已存在的股票代號
- **THEN** StockSelector 顯示「{股票名稱} 已在組合中」，不重複加入

### Requirement: 投資組合整合 Hurst 指數結果區

Portfolio Analyzer 頁面 SHALL 在蒙地卡羅區塊之後顯示加權組合 Hurst 指數結果區，計算依據依雙頻計算架構規則（優先日頻，降級月頻）。

#### Scenario: 全部股票有日報酬時顯示日頻 Hurst

- **WHEN** 組合中所有股票日報酬筆數均 ≥ 252
- **THEN** 以加權日報酬計算組合 Hurst，標注「日頻」

#### Scenario: 部分股票缺日報酬時降級並說明

- **WHEN** 組合中有股票日報酬不足
- **THEN** Hurst 區塊標注「月頻」，並列出哪些股票因日頻不足而降級
