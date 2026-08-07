# Proposal: Multi-scale Hurst

## Why

目前 Hurst 指數使用全期資料（最多 400 筆日報酬或 120 筆月報酬）計算單一 H 值，反映的是該股票過去整段時間的「平均行為」。但市場行為會隨時間發生 regime change：一支前期趨勢強勁的股票可能正在轉入震盪；一支長期均值回歸的股票也可能短期動能轉強。單一 H 值會把這些變化平均掉，使用者看不到趨勢的演變。

## What Changes

- **新增 `calcMultiScaleHurst()` 函式**：對同一份報酬資料在三個窗口（短/中/長）各算一次 Hurst H，回傳三個獨立的 `HurstResult` 與一個 `divergence` 狀態
- **窗口大小**（固定，只支援日頻）：短 60 / 中 120 / 長 240（取最近 N 筆日報酬）
- **資料量需求**：日報酬必須 ≥ 240 筆；不足則不顯示 `MultiScaleHurstBlock`，改提示「日報酬資料不足 240 筆，需要約 1 年的交易紀錄才能計算多尺度 Hurst」
- **新增 `MultiScaleHurstBlock` 元件**：三張並列卡片顯示三個尺度的 H 值與解讀，附帶「狀態判讀橫幅」根據三者差異提示 stable / short-weakening / short-strengthening / mixed
- **取代 IndividualPage 的 `HurstBlock`**：從單尺度改為多尺度
- **PortfolioPage 暫不導入**：組合 Hurst 已較複雜，先在個股驗證 UX 後再評估

## Capabilities

### New Capabilities
- `multi-scale-hurst`：多尺度 Hurst 計算與呈現邏輯（包含窗口切片、divergence 判斷規則）

### Modified Capabilities
- `hurst-exponent-individual`：個股頁的 Hurst 顯示改為多尺度版本，原單尺度區塊由多尺度元件取代

## Impact

- `src/lib/hurst.ts`：新增 `calcMultiScaleHurst()` 與 `MultiScaleHurstResult` / `Divergence` 型別（既有 `calcHurst()` 保留不動）
- `src/lib/hurst.test.ts`：新增 divergence 判斷邏輯測試
- `src/components/charts/MultiScaleHurstBlock.tsx`：新增（三卡片 + 狀態橫幅 + 既有 HurstLineChart 顯示長期窗口）
- `src/pages/IndividualPage.tsx`：將原 `HurstBlock` 替換為 `MultiScaleHurstBlock`
- `src/components/ActionGuide.tsx`：`buildIndividualGuide` 接受新的 `hurstDivergence` 訊號，新增「短期偏離長期」的建議規則

無 API 異動、無 store 異動。
