## MODIFIED Requirements

### Requirement: 績效分析頁的整體版面結構
系統 SHALL 在 `/performance` 路由提供 `PerformancePage`，採用三層視覺層次（Hero / Normal / Muted），由上至下依序顯示：頁面標題、隱私 banner、資料輸入區（手動 / CSV）、整體績效 Dashboard、**個股矩陣表**、原始交易表格。

#### Scenario: 頁面標題與描述
- **WHEN** 頁面渲染
- **THEN** 頂部顯示「績效分析」h1 標題與副標「分析你過去交易的勝率、賠率、獲利因子，找出打法品質與資金管理問題」

#### Scenario: 隱私 banner 與清除全部按鈕
- **WHEN** 頁面渲染
- **THEN** 標題下方顯示一行 banner：「💾 交易資料僅儲存於本機瀏覽器，不會上傳雲端」；右側為「匯出 CSV 備份」與「清除全部」按鈕

#### Scenario: 資料輸入區位於 Dashboard 之上
- **WHEN** 頁面渲染且 `trades.length === 0`
- **THEN** 資料輸入區自動展開（手動 / CSV Tab 切換），下方顯示空態說明

#### Scenario: 有交易時資料輸入區可摺疊
- **WHEN** 頁面渲染且 `trades.length > 0`
- **THEN** 資料輸入區預設摺疊，讓 Dashboard 結果置頂

#### Scenario: 完整結果依序排列（含矩陣表）
- **WHEN** `trades.length > 0`
- **THEN** 由上至下顯示：頁面標題 → 隱私 banner → 資料輸入區（可摺疊）→ 整體績效 Dashboard → **個股矩陣表（StockQuadrantMatrix）** → 原始交易表格（RawTradeTable）
