## MODIFIED Requirements

### Requirement: 績效分析頁的整體版面結構
系統 SHALL 在 `/performance` 路由提供 `PerformancePage`，由上至下依序顯示：頁面標題、隱私 banner（含 ExportMenu）、資料輸入區、整體 Dashboard、**自動診斷面板（雙軸結構：優勢/風險）**、**重點建議（編號式，NEW）**、個股矩陣表（含對比區塊）、績效視覺化、原始交易表格。

#### Scenario: 頁面標題與描述
- **WHEN** 頁面渲染
- **THEN** 頂部顯示「績效分析」h1 標題與副標

#### Scenario: 完整結果順序
- **WHEN** `trades.length > 0`
- **THEN** 順序為：頁面標題 → 隱私 banner → 資料輸入區 → 整體 Dashboard → **DiagnosisPanel（雙軸）** → **RecommendationPanel（編號式）** → 個股矩陣表 → 績效視覺化 → 原始交易表格

### Requirement: 自動診斷面板（DiagnosisPanel）
系統 SHALL 提供 `DiagnosisPanel` 元件，以「優勢 / 風險」雙軸結構顯示組合層級的所有診斷項目。

#### Scenario: 雙軸結構顯示
- **WHEN** Panel 渲染且有任一 portfolio scope 診斷
- **THEN** 桌機並排兩欄（grid-cols-2，手機 stack）：左欄「優勢」（顯示所有 level === 'advantage' 條目）、右欄「風險與注意事項」（顯示 alert / warning / note / info 條目）

#### Scenario: Panel 摘要顯示計數
- **WHEN** Panel 標題下方
- **THEN** 顯示「找到 N 條觀察項目（M 優勢 / X 警示 / Y 注意 / Z 資訊）」

#### Scenario: 沒有任何優勢
- **WHEN** advantage 條目為 0
- **THEN** 左欄顯示「持續累積交易紀錄以建立優勢視角」說明

#### Scenario: 沒有任何風險
- **WHEN** 風險條目（含 alert / warning / note / info）為 0
- **THEN** 右欄顯示綠色 banner：「✓ 暫無需要關注的問題」

#### Scenario: 兩邊都空
- **WHEN** advantage 與風險條目都為 0
- **THEN** 整個 Panel 不渲染

#### Scenario: 配色對應 level
- **WHEN** 渲染某條診斷
- **THEN** advantage 用綠色、alert 紅色、warning amber、note 藍色、info 灰色

#### Scenario: trades 為空時不顯示
- **WHEN** trades.length === 0
- **THEN** Panel 不渲染

## ADDED Requirements

### Requirement: 重點建議面板（RecommendationPanel）
系統 SHALL 提供 `RecommendationPanel` 元件，編號式條列顯示重點建議。每條建議有「編號 + 標題 + 多行詳細描述」結構。

#### Scenario: 編號顯示
- **WHEN** Panel 渲染且有 ≥ 1 條 recommendation
- **THEN** 每條 recommendation 左側顯示圓形編號徽章（1, 2, 3...）

#### Scenario: 標題與描述
- **WHEN** 每條 recommendation 渲染
- **THEN** 編號右側顯示 `<h4>` 標題（如「強化停損紀律」「改善鴻海操作方式」）+ 多行 `<p>` 詳細描述

#### Scenario: 標題顯示
- **WHEN** Panel 渲染
- **THEN** 標題為「重點建議」+ 副標「自動產生的具體行動建議」

#### Scenario: trades 為空時不顯示
- **WHEN** trades.length === 0
- **THEN** Panel 不渲染

#### Scenario: 容器 id
- **WHEN** Panel 渲染外層 div
- **THEN** 外層 div 有 `id="performance-recommendations"` 以供 PDF 匯出截圖
