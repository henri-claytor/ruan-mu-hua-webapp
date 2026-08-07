## Why

使用者觀察到比較頁的結果與短期股價直覺有落差。深究發現：
- 比較頁的「期望報酬率」用 `calcEV(monthlyReturns)`，吃**全部月報酬**（5–10 年）
- 個股頁已升級為**多尺度 v2**，主判斷用 **medium = 最近 1 年（240 日報酬）**
- 兩頁的「期望報酬率」實質上是不同時間尺度的指標

結果：使用者切換頁面看到不同數字，或對近期股價變化的直覺與長期 EV 不符，產生疑慮。

需要：
1. **比較頁的期望報酬率與個股頁同尺度**（最近 1 年）
2. **明確標示資料時間尺度**，讓使用者知道每個指標的計算範圍

## What Changes

### A. 比較頁期望報酬率改用「最近 1 年」尺度

- `calcResult` 改為呼叫 `calcMultiScaleEV(monthly, daily)`
- 取 **medium**（最近 1 年，日報酬 240 筆）作為比較對象
- 若 daily < 240 但 ≥ 60 → fallback 到 short（最近 3 個月）
- 若 daily < 60 → fallback 到 long（最近 5 年月報酬，舊行為）

### B. 比較表加「資料尺度」標示

- 表頂部說明區加 dim 小字：「資料尺度 — 期望報酬率：最近 1 年（240 日）· 下行虧損：最近 ~1.6 年（400 日）· 趨勢強度：最近 ~1.6 年（400 日）」
- 「綜合勝出方」卡副標補充「基於最近 1 年表現」（或對應 fallback 尺度）
- 每個指標 row 不再額外加註（避免重複），但主說明位於頂部

## Capabilities

### Modified Capabilities

- `stock-comparison`：期望報酬率改為最近 1 年尺度 + 加資料尺度標示

## Impact

- **影響檔案**：
  - `src/pages/ComparePage.tsx`：
    - `calcResult` 改用 `calcMultiScaleEV`
    - `StockResult` 介面 `ev` 改為「來自 medium 的 EVResult」+ 加 `evScaleLabel`
    - 比較表頂部加資料尺度說明
    - 綜合勝出方副標補充
- **不影響**：邏輯函式（`calcMultiScaleEV` 已存在）、tests、API
- **風險**：
  - 數據可能比過去顯示**更近期**（過去用 5+ 年平均、現用 1 年）→ EV 數字可能比現在大或小
  - 短期樣本誤差較大（240 點）：需保留「樣本不足時降級」邏輯
