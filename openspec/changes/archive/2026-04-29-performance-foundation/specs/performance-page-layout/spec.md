## ADDED Requirements

### Requirement: 績效分析頁的整體版面結構
系統 SHALL 在 `/performance` 路由提供 `PerformancePage`，採用三層視覺層次（Hero / Normal / Muted），由上至下依序顯示：頁面標題、隱私 banner、資料輸入區（手動 / CSV）、整體績效 Dashboard、原始交易表格。

#### Scenario: 頁面標題與描述
- **WHEN** 頁面渲染
- **THEN** 頂部顯示「績效分析」h1 標題與副標「分析你過去交易的勝率、賠率、獲利因子，找出打法品質與資金管理問題」

#### Scenario: 隱私 banner 與清除全部按鈕
- **WHEN** 頁面渲染
- **THEN** 標題下方顯示一行 banner：「💾 交易資料僅儲存於本機瀏覽器，不會上傳雲端」；右側為「清除全部」按鈕（紅色 underline 樣式）

#### Scenario: 資料輸入區位於 Dashboard 之上
- **WHEN** 頁面渲染且 `trades.length === 0`
- **THEN** 資料輸入區自動展開（手動 / CSV Tab 切換），下方顯示空態說明「立即新增第一筆交易」

#### Scenario: 有交易時資料輸入區可摺疊
- **WHEN** 頁面渲染且 `trades.length > 0`
- **THEN** 資料輸入區預設摺疊（按鈕「▶ 展開資料輸入 / ▼ 收折資料輸入」），讓 Dashboard 結果置頂

#### Scenario: 完整結果依序排列
- **WHEN** `trades.length > 0`
- **THEN** 由上至下顯示：頁面標題 → 隱私 banner → 資料輸入區（可摺疊）→ 整體績效 Dashboard（PortfolioPerformanceBlock）→ 原始交易表格（RawTradeTable）

### Requirement: 整體績效 Dashboard（PortfolioPerformanceBlock）
系統 SHALL 提供 `PortfolioPerformanceBlock` 元件，輸入 `PortfolioPerformance` 物件，輸出三層視覺層次的整體 Dashboard。

#### Scenario: Hero 列以總實現損益為主數字
- **WHEN** Block 渲染
- **THEN** Hero 列左欄顯示 `ResultCard emphasis="hero"`：標題「總實現損益」、值為 `±xxx,xxx 元` 格式（千分位、紅漲綠跌色）；右欄顯示 4 象限結論徽章（QuadrantBadge size="large"，依 PerformanceQuadrant）+ 「整體報酬率 ±X.XX% / 年化 ±X.XX%」副標

#### Scenario: 中層指標卡片
- **WHEN** Block 渲染
- **THEN** 顯示中層 grid 卡片（emphasis="normal"）：勝率、賠率（payoff）、獲利因子（profit factor）、期望值（每筆，元）、平均持有天數

#### Scenario: 弱化細節 inline 行
- **WHEN** Block 渲染
- **THEN** 底部顯示 inline 緊湊行（text-small + text-faint/dim）：總筆數、勝場數、敗場數、平均獲利金額、平均虧損金額、最大單筆獲利、最大單筆虧損、最大回撤金額 / 比例、最長持有天數、最短持有天數

#### Scenario: 4 象限與既有 EV 4 象限分開
- **WHEN** Block 渲染的徽章
- **THEN** 顯示 `PerformanceQuadrant` 標籤（如「Q1: 打法好・結果好」），不使用既有 EV 的「高賠率正期望值」標籤

#### Scenario: 計算依據摺疊
- **WHEN** Block 底部「▶ 展開計算依據」被點擊
- **THEN** 展開區塊顯示各指標的公式與所用筆數（如「賠率 = 平均獲利報酬率 1.85% ÷ 平均虧損報酬率 1.00% = 1.85」）

#### Scenario: 期間摘要顯示
- **WHEN** Block 標題下方副標
- **THEN** 顯示「期間 YYYY/MM/DD – YYYY/MM/DD · 共 N 筆交易」（min(buyDate) 與 max(sellDate)）

### Requirement: 報酬率與金額顯示套用台股慣例
系統 SHALL 在績效分析頁所有「報酬率」與「金額損益」欄位採用「紅漲綠跌」+ `+/−` 號顯示。

#### Scenario: 報酬率欄位
- **WHEN** 任何 returnRate 欄位顯示
- **THEN** 採用 `fmtPct(n)` 格式（`+X.XX%` / `−X.XX%` / `0.00%`）+ `colorByReturn(n)` 配色

#### Scenario: 金額損益欄位
- **WHEN** 任何 pnl 欄位顯示
- **THEN** 採用 `+X,XXX 元` / `−X,XXX 元` / `0 元` 格式（千分位 + 強制正負號），配色同 `colorByReturn`

#### Scenario: 非報酬率欄位不適用慣例
- **WHEN** 顯示欄位為勝率、敗率、平均持有天數、4 象限徽章
- **THEN** 沿用既有色彩語意（勝率紅、敗率綠不延續到此處——勝率/敗率改用 default 色）

### Requirement: 空態與引導
系統 SHALL 在無交易資料時顯示空態說明卡片，引導使用者開始輸入。

#### Scenario: 空態 UI
- **WHEN** `trades.length === 0`
- **THEN** Dashboard 與原始交易表格不渲染；改顯示空態卡片：「尚無交易資料，立即新增第一筆」+ 按鈕（觸發手動輸入區聚焦）+ 「下載範例 CSV」連結

#### Scenario: 範例 CSV 下載
- **WHEN** 使用者點擊「下載範例 CSV」
- **THEN** 系統下載 `example-trades.csv`，內含 3 筆示範交易（含完整 13 欄），格式正確
