## MODIFIED Requirements

### Requirement: 個股賠率 vs 獲利因子矩陣表
系統 SHALL 提供 `StockQuadrantMatrix` 元件，輸入 StockStats 陣列，渲染表格形式的個股矩陣。表格結構對齊「投資績效分析報告」PDF 範本，採 7 欄結構。

#### Scenario: 表格欄位（7 欄結構）
- **WHEN** 矩陣表渲染且有資料
- **THEN** 每列顯示一檔個股，欄位依序為：(1) 個股（顯示為「`<stockName>` `<nTrades>`筆」，stockId 作為 tooltip 或副標）、(2) 分類（4 象限徽章 compact）、(3) 勝率（百分比 + 小數一位）、(4) 賠率（payoffRatio 含進度條）、(5) 獲利因子（profitFactor 含進度條）、(6) 總損益（紅漲綠跌 + `+/−` 號）、(7) 診斷摘要（由 `buildStockDiagSummary(stock)` 產生的單行文字）

#### Scenario: 個股欄合併筆數
- **WHEN** 「個股」欄渲染
- **THEN** 顯示 `<stockName> <nTrades>筆` 格式（例如「宜鼎 21筆」），對齊 PDF 範本

#### Scenario: 預設排序
- **WHEN** 矩陣表首次渲染
- **THEN** 依 `|totalPnl|` 降序

#### Scenario: 欄位點擊切換排序
- **WHEN** 使用者點擊欄位標題
- **THEN** 切換該欄位升冪 / 降冪排序；切換到不同欄位時預設降冪

#### Scenario: 賠率進度條視覺化
- **WHEN** 顯示某列的賠率欄位
- **THEN** 數字旁顯示進度條，填充比例為 `min(payoff / 3.0, 1.0)`；Infinity 時填滿；0 時不顯示填充

#### Scenario: 獲利因子進度條視覺化
- **WHEN** 顯示某列的獲利因子欄位
- **THEN** 數字旁顯示進度條，填充比例為 `min(profitFactor / 4.0, 1.0)`；Infinity 時填滿；0 時不顯示填充

#### Scenario: 單向紀錄樣態
- **WHEN** 個股的 nWins === 0 或 nLosses === 0（單向紀錄）
- **THEN** 賠率欄與獲利因子欄顯示「—」破折號（無法計算）

#### Scenario: 樣本不足提示
- **WHEN** 某列的 `nTrades < 5`
- **THEN** 該列的「個股」欄筆數以淡灰色顯示，並有 hover tooltip「樣本較小，統計可信度有限」

#### Scenario: 損益紅漲綠跌
- **WHEN** 顯示某列的 `totalPnl`
- **THEN** 正值用紅色 + `+` 號；負值用綠色 + `−` 號；使用 `fmtMoney` 格式化（千分位）

#### Scenario: 診斷摘要欄
- **WHEN** 顯示某列的「診斷摘要」欄
- **THEN** 顯示 `buildStockDiagSummary(stock)` 的回傳文字，最長 60 字以內，超出以 ellipsis 截斷並提供 full text tooltip
