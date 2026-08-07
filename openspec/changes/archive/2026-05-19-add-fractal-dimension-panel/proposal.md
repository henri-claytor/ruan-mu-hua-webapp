## Why

Hurst 指數已能呈現「趨勢延續性」，但**分形維度 D**（Fractal Dimension）是另一個常見的技術指標表達方式，使用者更直觀理解：
- D 介於 1（直線）到 2（隨機）
- D = 2 − H 是已知數學關係
- 不同社群偏好不同：學術派常用 Hurst，技術分析派常用 D

加上 D 值區塊可讓使用者用熟悉的指標來判讀，並與 Hurst 並列驗證。

## What Changes

- **新增技術指標 panel**：個股頁 Hurst 區塊之後加入「技術指標」panel
- **內容**：
  - 三尺度 D 值（短/中/長期），由現有 `MultiScaleHurstResult` 推算 D = 2 − H
  - 每個尺度顯示：D 值數字 + 狀態判讀文字（強趨勢 / 偏趨勢 / 接近隨機 / 偏均值回歸 / 強均值回歸）
  - 視覺：3 卡並排（短/中/長），cream 底 + serif 大數字，狀態以小 chip 呈現
- **lib 函式**：新增 `classifyFractalDimension(d: number)` 與 `hurstToFractalDimension(h: number)` 純函式
- **保留**：Hurst block 與既有計算邏輯完全不動

## Capabilities

### New Capabilities

- `fractal-dimension`：分形維度 D 值的計算（D = 2 − H）、狀態分類、UI panel

## Impact

- **影響檔案**：
  - 新增 `src/lib/fractalDimension.ts`：D = 2 − H 推算 + 狀態分類
  - 新增 `src/lib/fractalDimension.test.ts`
  - 新增 `src/components/charts/FractalDimensionBlock.tsx`：技術指標 panel UI
  - `src/pages/IndividualPage.tsx`：在 Hurst block 之後插入 FractalDimensionBlock
- **不影響**：所有既有計算、Hurst 區塊、組合頁、比較頁、績效頁
- **風險**：
  - 「強趨勢 / 偏趨勢 / 隨機」的門檻需與 Hurst panel 的判讀保持一致（用 D 值換算後等價）
  - 多語言詞彙（「分形維度」對部分使用者可能不熟），副標需稍作解釋
