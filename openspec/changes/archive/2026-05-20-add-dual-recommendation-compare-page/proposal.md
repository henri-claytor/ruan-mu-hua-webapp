## Why

剛把比較頁 EV 對齊到「最近 1 年」尺度，但使用者仍發現結論與短期 K 線視角不符。根本原因：

- 長期統計指標（EV / 損益比 / Hurst / VaR）反映**平均行為**，但使用者直覺看的是**最近 K 線動能**（漲多少 / 跌多少）
- 沒有指標**直接反映短期累積回報**
- 單一「綜合勝出方」混合長短期，使用者無法依交易風格（短線 vs 長線）做判讀

需要：
1. 加「近期累積報酬」指標，直接反映短期動能
2. 比較表分兩段（近期動能 / 長期穩定）
3. 雙推薦卡：短線推薦（主判斷）+ 長線推薦（次要）

## What Changes

### A. 加「近期累積報酬」指標

新指標：最近 60 日（≈3 個月）的累積報酬率
- 公式：`Π(1 + ri) − 1` for i in last 60 daily returns
- 用 `calcCumulativeReturn(dailyReturns.slice(-60))` 計算
- 直接反映近期 K 線觀察

### B. 比較表分兩段

**近期動能（最近 3 個月）— 3 項**
- 近期累積報酬（60 日複利）★ 新指標
- 近期勝率（short scale 60 日 EV winRate）
- 近期損益比（short scale actualOdds）

**長期穩定（最近 1 年 / 400 日）— 4 項**
- 年化期望報酬率（medium）
- 95% 下行虧損
- 99% 下行虧損
- 趨勢強度 H

每段有自己的 section header，每段獨立統計勝出方。

### C. 雙推薦卡（取代原「綜合勝出方」單卡）

並排 2 卡：
- **短線推薦** — 金邊主判斷 + 「🏆 主判斷」chip + 40px 大字 + 近期動能 3 項統計
- **長線推薦** — 普通樣式 + 28px 中字 + 長期穩定 4 項統計

短線為主判斷的理由：與使用者看 K 線的直覺對應，當作主要結論。

## Capabilities

### Modified Capabilities

- `stock-comparison`：加近期累積報酬指標 + 比較表分段 + 雙推薦卡

## Impact

- **影響檔案**：
  - `src/pages/ComparePage.tsx`：calcResult 加 `recentReturn` + `shortScale` 欄位、比較表分段、雙推薦卡
  - 新增 utility `calcCumulativeReturn(returns: number[]): number` 在 `src/lib/portfolio.ts` 或 inline
- **不影響**：邏輯、tests、API
- **風險**：
  - 60 日樣本小，近期累積報酬可能波動大
  - 「短線推薦」與「長線推薦」結果不同時，使用者可能困惑 — 用 chip 明確標示「主判斷 = 短線」做引導
