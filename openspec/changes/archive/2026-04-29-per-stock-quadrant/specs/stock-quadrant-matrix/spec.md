## ADDED Requirements

### Requirement: 個股賠率 vs 獲利因子矩陣表
系統 SHALL 提供 `StockQuadrantMatrix` 元件，輸入 StockStats 陣列，渲染表格形式的個股矩陣。

#### Scenario: 表格欄位
- **WHEN** 矩陣表渲染且有資料
- **THEN** 每列顯示一檔個股，欄位包含：股票（stockId + stockName，可點擊深度連結）、4 象限徽章（compact 簡短版）、交易筆數、勝率、賠率（含進度條）、獲利因子（含進度條）、總損益（紅漲綠跌 + `+/−` 號）、損益貢獻度（百分比）

#### Scenario: 預設排序
- **WHEN** 矩陣表首次渲染
- **THEN** 依 `|totalPnl|` 降序（即 calcAllStockStats 預設排序）

#### Scenario: 欄位點擊切換排序
- **WHEN** 使用者點擊欄位標題
- **THEN** 切換該欄位升冪 / 降冪排序；切換到不同欄位時預設降冪

#### Scenario: 賠率進度條視覺化
- **WHEN** 顯示某列的賠率欄位
- **THEN** 數字旁顯示進度條，填充比例為 `min(payoff / 3.0, 1.0)`；Infinity 時填滿；0 時不顯示填充

#### Scenario: 獲利因子進度條視覺化
- **WHEN** 顯示某列的獲利因子欄位
- **THEN** 數字旁顯示進度條，填充比例為 `min(profitFactor / 4.0, 1.0)`；Infinity 時填滿；0 時不顯示填充

#### Scenario: 樣本不足提示
- **WHEN** 某列的交易筆數 < 5
- **THEN** 該列「筆數」欄以淡灰色顯示，並有 hover tooltip「樣本較小，統計可信度有限」

#### Scenario: 損益與貢獻度紅漲綠跌
- **WHEN** 顯示某列的 `totalPnl` 或 `pnlContribution`
- **THEN** 正值用紅色 + `+` 號；負值用綠色 + `−` 號；損益用 `fmtMoney`，貢獻度用百分比 + `+/−` 號

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
