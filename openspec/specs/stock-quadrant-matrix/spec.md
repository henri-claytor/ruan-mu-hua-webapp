# stock-quadrant-matrix Specification

## Purpose

定義績效分析頁中「個股賠率 vs 獲利因子矩陣表」UI 元件的結構、視覺化、互動（篩選與排序）與深度連結。

## Requirements

### Requirement: 個股賠率 vs 獲利因子矩陣表
系統 SHALL 提供 `StockQuadrantMatrix` 元件，輸入 StockStats 陣列，渲染表格形式的個股矩陣。表格結構對齊「投資績效分析報告」PDF 範本，採 7 欄結構。

#### Scenario: 表格欄位（7 欄結構）
- **WHEN** 矩陣表渲染且有資料
- **THEN** 每列顯示一檔個股，欄位依序為：(1) 個股（顯示為「`<stockName>` `<nTrades>`筆」，下方副標 stockId，可點擊深度連結）、(2) 分類（4 象限徽章 compact）、(3) 勝率（百分比 + 小數一位）、(4) 賠率（payoffRatio 含進度條）、(5) 獲利因子（profitFactor 含進度條）、(6) 總損益（紅漲綠跌 + `+/−` 號）、(7) 診斷摘要（由 `buildStockDiagSummary(stock)` 產生）

#### Scenario: 個股欄合併筆數
- **WHEN** 「個股」欄渲染
- **THEN** 顯示 `<stockName> <nTrades>筆` 格式（例如「台積電 21筆」），對齊 PDF 範本

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
- **THEN** 顯示 `buildStockDiagSummary(stock)` 的回傳文字，超出寬度以 ellipsis 截斷並提供 full text tooltip

### Requirement: 4 象限篩選
系統 SHALL 在矩陣表頂部提供 4 象限篩選 chips：「全部 / Q1 / Q2 / Q3 / Q4」。

#### Scenario: 預設顯示全部
- **WHEN** 矩陣表首次渲染
- **THEN** 「全部」chip 為 active，顯示所有個股

#### Scenario: 點擊象限 chip 篩選
- **WHEN** 使用者點擊「Q1」chip
- **THEN** 矩陣表僅顯示 quadrant 為 Q1 的個股，並顯示「N 檔（Q1: 打法好・結果好）」摘要

#### Scenario: 篩選後仍可排序
- **WHEN** 使用者已篩選 Q3，再點擊「總損益」欄位
- **THEN** 結果僅 Q3 個股，且依總損益排序

### Requirement: QuadrantBadge 簡短模式
`QuadrantBadge` SHALL 接受 `compact?: boolean` prop，true 時顯示簡短標籤。

#### Scenario: compact 模式對應簡短標籤
- **WHEN** `compact={true}` 且 quadrant 為 PerformanceQuadrant
- **THEN** 顯示對應簡短標籤：Q1 → 「Q1 雙優」、Q2 → 「Q2 隱藏風險」、Q3 → 「Q3 管理問題」、Q4 → 「Q4 待檢討」；hover 顯示完整標籤 tooltip

### Requirement: 深度連結至個股分析頁
系統 SHALL 在矩陣表每列的股票欄位提供深度連結至個股分析頁。

#### Scenario: 點擊股票導航
- **WHEN** 使用者點擊矩陣表中某列的股票名稱（如「2330 台積電」）
- **THEN** 路由導航至 `/individual?code=2330`

#### Scenario: 視覺提示為連結
- **WHEN** 股票名稱欄位渲染
- **THEN** 文字以藍色顯示，hover 時顯示 underline，提示為可點擊連結

### Requirement: 矩陣表支援外部傳入個股篩選
`StockQuadrantMatrix` SHALL 接受可選的 `filterStockId?: string` prop，當提供時自動將表格過濾為僅該股票，並可手動清除。

#### Scenario: filterStockId 預設過濾
- **WHEN** `<StockQuadrantMatrix stocks={...} filterStockId="2330" />`
- **THEN** 表格僅顯示 stockId 為 2330 的列；4 象限篩選 chips 仍可用，但與此 stockId 篩選同時生效（AND 關係）

#### Scenario: 過濾標籤顯示
- **WHEN** filterStockId 有值且能找到對應 stock
- **THEN** 矩陣表頂部顯示一個藍色標籤：「篩選：{stockId} {stockName} ✕」，✕ 為清除按鈕

#### Scenario: 清除過濾
- **WHEN** 使用者點擊清除按鈕（✕）
- **THEN** 元件內部狀態重設，顯示全部個股；外部傳入的 prop 不變（由父層決定是否同步 URL）

#### Scenario: 找不到對應 stockId 的處理
- **WHEN** filterStockId 在 stocks 陣列中不存在
- **THEN** 顯示空態「未找到 {stockId} 的交易紀錄」+ 「← 顯示全部」按鈕（清除過濾）

### Requirement: 矩陣表「診斷摘要」文字欄
系統 SHALL 將 `StockQuadrantMatrix` 既有「診斷」欄（emoji 計數）改為「診斷摘要」文字欄，每股顯示 1 句具體文字描述（取代既有 emoji 計數）。文字由 `buildStockDiagSummary(stats)` 產生，依優先順序回傳第一條符合的訊息（含具體數字）。

#### Scenario: 規則優先順序
- **WHEN** 多條規則同時符合
- **THEN** 依優先順序回傳第一條：全敗 ≥3 → 全敗 2 → 全勝 ≥5 → 全勝 <5 → 賠率偏低 → 資金管理 → 集中度 → 雙優 → 樣本不足 → 預設

#### Scenario: 全敗摘要含平均虧損
- **WHEN** 某股 nWins === 0 且 nLosses >= 3
- **THEN** 顯示「N 筆全敗，平均虧損 X.X%，停損紀律需改善」

#### Scenario: 全勝摘要含效率描述
- **WHEN** 某股 nLosses === 0 且 nWins >= 5
- **THEN** 顯示「N 筆全勝，均報酬 X.X%」+ 附加效率（avgWin < 10% → 薄利多筆型、> 25% → 高報酬選股精準、avgHoldingDays < 15 → 短週期高效率）

#### Scenario: 賠率偏低摘要
- **WHEN** 某股 payoffRatio 為有限值且 < 0.8
- **THEN** 顯示「賠率 X.XX 偏低，靠勝率撐場，結構脆弱」

#### Scenario: 資金管理摘要
- **WHEN** 某股 payoffRatio >= 1.5 且 profitFactor 為有限值且 < 1.0
- **THEN** 顯示「邏輯對（賠率 X.XX）但押注管理有問題（PF Y.YY）」

#### Scenario: 集中度摘要
- **WHEN** 某股 |pnlContribution| > 0.2
- **THEN** 顯示「貢獻整體 X.X%，集中度高」

#### Scenario: 雙優摘要
- **WHEN** 某股 payoffRatio >= 1.5 且 profitFactor >= 2.0（皆為有限值）
- **THEN** 顯示「打法與結果雙優（賠率 X.XX、PF Y.Y）」

#### Scenario: 樣本不足摘要
- **WHEN** 某股 nTrades < 5 且不符合前述任一條件
- **THEN** 顯示「N 筆，樣本少需更多紀錄」

#### Scenario: 預設摘要
- **WHEN** 不符合任何上述規則
- **THEN** 顯示「N 筆，勝率 X%，均報酬 Y%」

### Requirement: 單向紀錄個股的賠率與獲利因子顯示
矩陣表渲染「單向紀錄」分類的個股時 SHALL 在賠率與獲利因子欄顯示「—」，且不顯示對應進度條。

#### Scenario: 賠率欄顯示
- **WHEN** 某股 quadrant === '單向紀錄（全勝或全敗）'
- **THEN** 賠率欄顯示「—」（淡色 text-faint），不顯示 ∞ 或 0

#### Scenario: 獲利因子欄顯示
- **WHEN** 同上
- **THEN** 獲利因子欄顯示「—」，不顯示 ∞ 或 0

#### Scenario: 進度條不顯示
- **WHEN** 同上
- **THEN** 賠率與獲利因子欄都不顯示進度條

### Requirement: 4 象限篩選 chips 擴為 5 類 + 全部
矩陣表頂部的篩選 chips SHALL 擴為 6 個：全部 / Q1 / Q2 / Q3 / Q4 / 單向紀錄。

#### Scenario: 6 個 chips 顯示
- **WHEN** 篩選列渲染
- **THEN** 顯示 6 個 chips：「全部」「Q1 雙優」「Q2 隱藏風險」「Q3 管理問題」「Q4 待檢討」「單向紀錄」，每個 chip 旁顯示對應計數

#### Scenario: 點擊「單向紀錄」過濾
- **WHEN** 使用者點擊「單向紀錄」chip
- **THEN** 矩陣表僅顯示 quadrant 為「單向紀錄（全勝或全敗）」的個股
