## Context

`PerformanceCharts.tsx` 目前已含多個 Recharts 圖表。新增散布圖到此區塊最自然，避免新增獨立章節破壞 Phase 1 對齊 PDF 範本的結構。

Pearson 相關係數計算為純函式，獨立檔便於 vitest 單元測試。

## Goals / Non-Goals

**Goals:**
- 計算 Pearson 相關係數 r ∈ [−1, +1]
- 散布圖視覺化每筆 trade（紅綠跌色碼）
- 解讀文字（強/中/無關聯 × 正/負）
- 樣本不足時優雅降級（不渲染圖、顯示提示）

**Non-Goals:**
- 不算其他相關係數（Spearman / Kendall）
- 不算迴歸線斜率（純散布 + r 值即可）
- 不畫信賴區間
- 不在 PDF 顯示（PDF 截圖清單不變）
- 不動既有計算函式

## Decisions

### 1. 用 Pearson 而非 Spearman
**決定**：Pearson 相關係數。

**理由**：
- 線性關係解讀直觀（持有越久 → 報酬越高 = 正相關）
- 計算簡單，可直接從 covariance / std 推
- 學員容易理解的指標

**替代**：Spearman 抗離群值但解讀較複雜；本次先做 Pearson，需要時再加。

### 2. 樣本不足閾值 n < 5
**決定**：trades 數 < 5 時不渲染圖表，顯示「樣本不足無法計算相關性（需要至少 5 筆）」。

**理由**：
- < 5 筆統計上沒有意義（一筆極值就主導 r 值）
- 與既有 `buildStockDiagSummary` 的「樣本不足」閾值一致

### 3. 解讀分級
**決定**：
- |r| < 0.3 → 無顯著關聯
- 0.3 ≤ |r| < 0.7 → 中度（正 / 負）相關
- |r| ≥ 0.7 → 強（正 / 負）相關

**理由**：學術慣用區間，與既有 hurst 分級邏輯類似。

### 4. 散布圖點配色
**決定**：紅綠跌台股慣例
- `returnRate > 0` → `text-red-700` 紅
- `returnRate < 0` → `text-green-700` 綠
- `returnRate === 0` → 中性灰

### 5. 整合進 PerformanceCharts 而非新區塊
**決定**：放進 `PerformanceCharts.tsx`，與既有圖表並列。

**理由**：
- Phase 1 章節結構（一二三）已穩定，不應加章節四
- `PerformanceCharts` 本來就是視覺化集合
- 不影響 PDF 截圖清單（PerformanceCharts 已不在 PDF）

### 6. 邊界處理
- 分母為 0（所有 x 或 y 相同）→ r = 0（無相關）
- NaN / Infinity → r = 0
- xs.length !== ys.length → throw（呼叫端錯誤）

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| 散布圖點數多（>100 trades）渲染慢 | Recharts ScatterChart 對 100~500 筆無壓力；超過再考慮抽樣 |
| 離群值主導 r 值 | 在解讀文字中註明「Pearson 對離群值敏感」（簡單註腳即可）|
| 中文「相關係數」可能讓非技術使用者困惑 | 解讀文字用口語化（「持有越久報酬越高」）而非「正相關」單獨呈現 |
| 樣本剛好 5~9 時 r 值不穩 | 解讀文字加附註「樣本 N 筆，結論僅供參考」|
