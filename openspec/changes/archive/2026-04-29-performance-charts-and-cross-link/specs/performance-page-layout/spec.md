## MODIFIED Requirements

### Requirement: 績效分析頁的整體版面結構
系統 SHALL 在 `/performance` 路由提供 `PerformancePage`，採用三層視覺層次（Hero / Normal / Muted），由上至下依序顯示：頁面標題、隱私 banner、資料輸入區（手動 / CSV）、整體績效 Dashboard、個股矩陣表、**績效視覺化（PerformanceCharts）**、原始交易表格。

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

#### Scenario: 完整結果依序排列（含圖表）
- **WHEN** `trades.length > 0`
- **THEN** 由上至下顯示：頁面標題 → 隱私 banner → 資料輸入區（可摺疊）→ 整體績效 Dashboard → 個股矩陣表（StockQuadrantMatrix）→ **績效視覺化（PerformanceCharts，可摺疊預設展開）** → 原始交易表格（RawTradeTable）

## ADDED Requirements

### Requirement: 績效分析頁支援 ?stock= query string 篩選
PerformancePage SHALL 支援透過 URL query string `?stock=` 自動將個股矩陣表預設篩選為指定股票。

#### Scenario: 透過 query string 篩選
- **WHEN** 使用者導航至 `/performance?stock=2330`
- **THEN** 個股矩陣表自動將 stockId 過濾為「2330」，僅顯示該股的列；矩陣表頂部顯示「篩選：2330（清除）」提示

#### Scenario: 清除過濾
- **WHEN** 使用者點擊「清除」過濾標籤
- **THEN** 矩陣表回到顯示全部個股的狀態（query string 不變）

#### Scenario: 自動捲動到矩陣表
- **WHEN** 頁面以 `?stock=` 進入
- **THEN** 載入完成後自動捲動到矩陣表位置（smooth scroll）

#### Scenario: 找不到該股票時的處理
- **WHEN** `?stock=0000` 但使用者沒有 0000 的交易紀錄
- **THEN** 矩陣表顯示空狀態「無此股票的交易紀錄」，並提供連結移除過濾
