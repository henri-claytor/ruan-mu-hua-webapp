## ADDED Requirements

### Requirement: 四象限定義說明區塊
系統 SHALL 在 `/performance` 頁面的個股矩陣表（`StockQuadrantMatrix`）之前，渲染獨立的 `QuadrantLegendBlock` 元件，以 2×2 grid 呈現 4 個個股分類象限的定義，作為個股表的判讀指引。

#### Scenario: 渲染條件
- **WHEN** `/performance` 頁面有交易資料（`trades.length > 0`）
- **THEN** `QuadrantLegendBlock` 在「二、個股賠率 vs 獲利因子分析」章節下、`StockQuadrantMatrix` 之上渲染

#### Scenario: 2×2 grid 結構
- **WHEN** `QuadrantLegendBlock` 渲染
- **THEN** 顯示 4 個彩色方塊排成 2 欄 2 列：左上「打法好・結果好」、右上「打法差・結果好」、左下「打法差・結果差」、右下「單向紀錄」

#### Scenario: 每個方塊的內容
- **WHEN** 任一方塊渲染
- **THEN** 含分類名稱（粗體標題）與一行說明文字（描述該象限的特徵）

#### Scenario: 色碼對應 QuadrantBadge
- **WHEN** 方塊渲染
- **THEN** 「打法好・結果好」用紅色系（bg-red-50 + text-red-700）；「打法差・結果好」用藍色系；「打法差・結果差」用紅色系或灰色（依設計選定）；「單向紀錄」用藍色系；與 `QuadrantBadge` 既有色碼一致

#### Scenario: 章節副標
- **WHEN** `QuadrantLegendBlock` 渲染
- **THEN** 區塊上方顯示一行副標說明：「賠率衡量打法品質（策略邏輯），獲利因子衡量實際結果（含部位大小影響）。兩者差距可揭示打法與執行之間的落差。」

#### Scenario: 空資料不渲染
- **WHEN** `trades.length === 0`
- **THEN** `QuadrantLegendBlock` 不渲染
