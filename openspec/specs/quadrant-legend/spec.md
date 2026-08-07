# quadrant-legend Specification

## Purpose

定義 `/performance` 頁面「二、個股賠率 vs 獲利因子分析」章節下、個股矩陣表（`StockQuadrantMatrix`）之前的四象限定義說明區塊（`QuadrantLegendBlock`），作為個股表的判讀指引，對齊「投資績效分析報告」PDF 範本。

## Requirements

### Requirement: 四象限定義說明區塊
系統 SHALL 提供 `QuadrantLegendBlock` 元件，在 `/performance` 頁面的個股矩陣表（`StockQuadrantMatrix`）之前渲染，以 2×2 grid 呈現 4 個個股分類象限的定義。

#### Scenario: 渲染條件
- **WHEN** `/performance` 頁面有交易資料（`trades.length > 0`）
- **THEN** `QuadrantLegendBlock` 在「二、個股賠率 vs 獲利因子分析」章節下、`StockQuadrantMatrix` 之上渲染

#### Scenario: 章節標題與副標
- **WHEN** `QuadrantLegendBlock` 渲染
- **THEN** 區塊上方顯示 h2 標題「二、個股賠率 vs 獲利因子分析」與一行副標：「賠率衡量打法品質（策略邏輯），獲利因子衡量實際結果（含部位大小影響）。兩者差距可揭示打法與執行之間的落差。」

#### Scenario: 2×2 grid 結構
- **WHEN** `QuadrantLegendBlock` 渲染
- **THEN** 顯示 4 個彩色方塊排成 2 欄 2 列：左上「打法好・結果好」、右上「打法差・結果好」、左下「打法差・結果差」、右下「單向紀錄」

#### Scenario: 每個方塊的內容
- **WHEN** 任一方塊渲染
- **THEN** 含分類名稱（粗體標題）與一行說明文字（描述該象限的特徵）

#### Scenario: 色碼對應 QuadrantBadge
- **WHEN** 方塊渲染
- **THEN** 「打法好・結果好」用綠色系（bg-green-50 + text-green-700）；「打法差・結果好」用藍色系；「打法差・結果差」用紅色系；「單向紀錄」用 slate 灰色系；與 `QuadrantBadge` 既有色碼一致

#### Scenario: 空資料不渲染
- **WHEN** `trades.length === 0`
- **THEN** `QuadrantLegendBlock` 不渲染
