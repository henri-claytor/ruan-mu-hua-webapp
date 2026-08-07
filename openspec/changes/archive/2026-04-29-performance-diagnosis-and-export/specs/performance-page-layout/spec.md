## MODIFIED Requirements

### Requirement: 績效分析頁的整體版面結構
系統 SHALL 在 `/performance` 路由提供 `PerformancePage`，採用三層視覺層次（Hero / Normal / Muted），由上至下依序顯示：頁面標題、隱私 banner、資料輸入區（手動 / CSV）、整體績效 Dashboard、**自動診斷面板（DiagnosisPanel）**、個股矩陣表、績效視覺化（PerformanceCharts）、原始交易表格。

#### Scenario: 頁面標題與描述
- **WHEN** 頁面渲染
- **THEN** 頂部顯示「績效分析」h1 標題與副標「分析你過去交易的勝率、賠率、獲利因子，找出打法品質與資金管理問題」

#### Scenario: 隱私 banner 與匯出選單
- **WHEN** 頁面渲染
- **THEN** 標題下方顯示一行 banner：「💾 交易資料僅儲存於本機瀏覽器，不會上傳雲端」；右側為 ExportMenu 下拉（PDF / Excel / CSV）與「清除全部」按鈕

#### Scenario: 完整結果依序排列（含診斷）
- **WHEN** `trades.length > 0`
- **THEN** 由上至下顯示：頁面標題 → 隱私 banner（含 ExportMenu）→ 資料輸入區（可摺疊）→ 整體績效 Dashboard → **自動診斷面板（DiagnosisPanel，組合層級診斷）** → 個股矩陣表 → 績效視覺化 → 原始交易表格

## ADDED Requirements

### Requirement: 自動診斷面板（DiagnosisPanel）
系統 SHALL 提供 `DiagnosisPanel` 元件，顯示組合層級的所有診斷項目（不含 stock 範圍的診斷）。

#### Scenario: Panel 標題與摘要
- **WHEN** Panel 渲染且有任一 portfolio scope 診斷
- **THEN** 標題「自動診斷與建議」+ 摘要「找到 N 條觀察項目（M 警示 / X 提醒 / Y 資訊）」

#### Scenario: 沒有觸發任何診斷
- **WHEN** portfolio scope 診斷為空
- **THEN** Panel 顯示綠色 banner：「✓ 暫無需要關注的問題」

#### Scenario: 診斷項目排序顯示
- **WHEN** 有多條診斷
- **THEN** 依 level 嚴重度排序顯示（alert → warning → note → info），每條一列含 icon + title + message + advice

#### Scenario: 配色對應 level
- **WHEN** 渲染某條診斷
- **THEN** alert 用紅色、warning 用 amber、note 用藍色、info 用灰色（背景與文字色一致使用既有 Tailwind 色階）

#### Scenario: trades 為空時不顯示
- **WHEN** trades.length === 0
- **THEN** Panel 不渲染
