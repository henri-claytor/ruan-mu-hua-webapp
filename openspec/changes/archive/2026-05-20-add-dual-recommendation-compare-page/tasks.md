## 1. 近期累積報酬 utility

- [x] 1.1 加 `calcCumulativeReturn(returns: number[]): number` (inline ComparePage 或 utils/format)

## 2. StockResult 加新欄位

- [x] 2.1 介面加 `recentReturn` / `recentWinRate` / `recentPayoff` 三欄位
- [x] 2.2 `calcResult` 從 `calcMultiScaleEV.short.ev` 取 winRate / actualOdds
- [x] 2.3 `recentReturn = calcCumulativeReturn(dailyReturns.slice(-60))`
- [x] 2.4 樣本不足（dailyReturns < 20）→ recentReturn 設 null

## 3. Advantage 對照

- [x] 3.1 新增 `recentReturnAdv`、`recentWinAdv`、`recentPayoffAdv` 三個 advantage 物件
- [x] 3.2 統計 shortWinsA / shortWinsB / shortTies（3 項）
- [x] 3.3 longWinsA / longWinsB / longTies（4 項）

## 4. 雙推薦卡渲染

- [x] 4.1 移除舊「綜合勝出方」單卡
- [x] 4.2 新增「短線推薦」金邊主判斷卡（grid-cols-2 左側）
- [x] 4.3 新增「長線推薦」普通卡（grid-cols-2 右側）
- [x] 4.4 平手時顯示「平手」dim 色

## 5. 比較表分段

- [x] 5.1 加「📈 近期動能（最近 3 個月 · 60 日）」section header row
- [x] 5.2 近期動能 3 個 rows：近期累積報酬 / 近期勝率 / 近期損益比
- [x] 5.3 加「📊 長期穩定（最近 1 年 / 400 日）」section header row
- [x] 5.4 長期穩定 4 個 rows：年化期望報酬率 / 95% / 99% / 趨勢強度 H
- [x] 5.5 移除「象限評級」row（與雙推薦結論重疊）

## 6. 表頂部資料尺度說明保留

- [x] 6.1 沿用前次的「資料尺度」說明列（已存在）

## 7. 驗證

- [x] 7.1 `npx tsc --noEmit` 通過
- [x] 7.2 `npx vitest run` 通過
- [x] 7.3 `npm run build` 通過
- [x] 7.4 瀏覽器確認 6274 vs 6472：
  - 表頂出現雙推薦卡
  - 短線推薦金邊（依近期累積報酬等）
  - 比較表分兩段
- [x] 7.5 部署 Vercel
