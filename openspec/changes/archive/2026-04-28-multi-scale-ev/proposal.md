# Proposal: Multi-scale EV（年化版）

## Why

目前個股 / 投資組合分析頁的 EV 區塊只用「全部月報酬」計算單一 EV 值，意義是「過去 5–10 年的月平均報酬期望」，偏長期。使用者可能想知道：

- 「**最近 3 個月**這檔股票的期望報酬如何？」（日頻 60 筆，捕捉短期動能）
- 「**最近 3 年**呢？」（月頻 36 筆，中期趨勢）
- 「**長期**呢？」（月頻全部，10 年基本盤）

當「短期年化 EV 顯著低於長期」時，往往暗示「動能正在轉弱」；反之則是「近期動能轉強」。這個訊號對交易決策很有幫助，類似 multi-scale Hurst 的 divergence 邏輯。

## What Changes

- **新增 `calcMultiScaleEV()` 函式**：對同一支股票的日報酬 + 月報酬，計算三個尺度的 **年化 EV**
  - 短期：近 60 個交易日（≈3 個月）日報酬 → 年化 `(1+EV)^252 − 1`
  - 中期：近 36 個月月報酬 → 年化 `(1+EV)^12 − 1`
  - 長期：全部月報酬（最少 60 筆）→ 年化 `(1+EV)^12 − 1`
- **新增 divergence 偵測**：四狀態 stable / short-improving / short-deteriorating / mixed
- **新增 `MultiScaleEVBlock` 元件**：Hero 列以「長期年化 EV」為主結論，並列三張卡片顯示三尺度 + 狀態判讀橫幅；計算步驟摺疊顯示三組原始月/日 EV 與年化轉換
- **取代 IndividualPage 的 EV 區塊**：從單尺度長期 EV 改為多尺度
- **PortfolioPage 暫不導入**：先在個股驗證 UX 後再評估

### 報酬率顯示色彩與符號慣例（台股「紅漲綠跌」）

- 新增 `fmtPct(n, digits)` utility：永遠帶正負號（`+0.47%` / `−5.59%` / `0.00%`）
- 新增 `colorByReturn(n)` utility：正報酬 → `red`、負報酬 → `green`、0 → `default`
- 所有「報酬率」顯示位置（EV、Avg Gain、Avg Loss、VaR95、VaR99、年化 EV）採用上述慣例
- **不影響**：勝率/敗率（機率）、Hurst H 值、MC 金額（萬）、風險等級徽章 low/mid/high（警示語意保留）、圖表填色

## Capabilities

### New Capabilities
- `multi-scale-ev`：多尺度年化 EV 計算與呈現（短期日頻 / 中期 + 長期月頻）

### Modified Capabilities
- `result-first-layout`：個股頁的 EV 區塊內容由「單尺度長期 EV」改為「多尺度年化 EV」呈現

## Impact

- `src/lib/ev.ts`：新增 `calcMultiScaleEV()`、`MultiScaleEVResult`、`EVDivergence` 型別；保留既有 `calcEV()` 不動（向後兼容）
- `src/lib/ev.test.ts`：新增多尺度 + divergence 測試
- `src/components/charts/MultiScaleEVBlock.tsx`：新增（三卡片 + 狀態橫幅 + 計算步驟摺疊）
- `src/pages/IndividualPage.tsx`：將原 `EVBlock` 替換為 `MultiScaleEVBlock`；ActionGuide 接受新訊號 `evDivergence?: EVDivergence`
- `src/components/ActionGuide.tsx`：`buildIndividualGuide` 新增 short-improving / short-deteriorating 規則訊息
- 無 API 異動（沿用既有月報酬與日報酬 API）、無 store 異動
