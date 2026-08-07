## ADDED Requirements

### Requirement: 個股分析頁底部「我交易過這檔」摘要
個股分析頁（IndividualPage）SHALL 在 ActionGuide 之後新增 `MyTradeHistoryBlock` 元件，顯示使用者在該股票的交易紀錄摘要。

#### Scenario: 有交易紀錄時顯示完整摘要
- **WHEN** `useTradeStore` 的 trades 中包含目前 stockCode 的交易
- **THEN** 顯示：標題「我在這檔的交易紀錄」+ Q1–Q4 徽章（依 calcStockStats 結果）+ 摘要列「共交易 N 次 · 勝率 X% · 總損益 ±X 元」+ 市場 vs 我賠率對照 + 「→ 查看完整交易明細」連結（指向 `/performance?stock={stockCode}`）

#### Scenario: 無交易紀錄時顯示空態
- **WHEN** trades 中沒有此股票的交易
- **THEN** 顯示：標題「我在這檔的交易紀錄」+ 空態文字「你尚未在績效分析中記錄這檔股票的交易」+ 「→ 前往績效分析」連結（指向 `/performance`）

#### Scenario: 區塊位置
- **WHEN** 個股分析頁完整渲染
- **THEN** 區塊位於 ActionGuide 之下，作為頁面最後一個區塊

### Requirement: 市場 vs 我的賠率對照
`MyTradeHistoryBlock` SHALL 在有交易紀錄時顯示「市場長期月賠率 vs 我的交易賠率」對照，並依差距產生解讀文字。

#### Scenario: 兩個賠率並列顯示
- **WHEN** 有交易紀錄且 evMulti.long 存在
- **THEN** 顯示兩數值並列：「市場月賠率：X.XX」（來自 evMulti.long.ev.actualOdds）與「你的交易賠率：Y.YY」（來自 calcStockStats 的 payoffRatio）

#### Scenario: 差距 < 0.2 顯示中性解讀
- **WHEN** `|mine − market| < 0.2`
- **THEN** 顯示「市場面與你的執行相當，無顯著差距。」

#### Scenario: 我的賠率明顯高於市場
- **WHEN** `mine > market + 0.2`
- **THEN** 顯示「你比市場給的更好——進出場時機掌握優於平均。」

#### Scenario: 我的賠率明顯低於市場
- **WHEN** `mine < market − 0.2`
- **THEN** 顯示「市場機會夠好，但你的進出場時機可能要改善。」

#### Scenario: 市場資料不足
- **WHEN** evMulti 為 null（月報酬 < 60 筆）
- **THEN** 不顯示對照欄，改顯示「市場長期資料不足，無法對照」一行說明
