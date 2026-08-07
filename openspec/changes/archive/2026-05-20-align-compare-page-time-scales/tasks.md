## 1. calcResult 改用多尺度 EV

- [x] 1.1 import `calcMultiScaleEV` from '../lib/ev'
- [x] 1.2 `StockResult` 介面加 `evScaleLabel: string | null`
- [x] 1.3 改寫 `calcResult`：呼叫 `calcMultiScaleEV(monthly, daily)`
- [x] 1.4 取 `primary = multi?.medium ?? multi?.short ?? multi?.long`
- [x] 1.5 ev = primary?.ev、evScaleLabel = primary?.label

## 2. 比較表頂部資料尺度說明

- [x] 2.1 計算 `scaleLabelA / scaleLabelB`
- [x] 2.2 修改表頂部 banner 加第二行：「資料尺度 — 期望報酬率：{labelA} 或 雙標 · 下行虧損 / 趨勢強度：{freqLabel}」

## 3. 綜合勝出方副標

- [x] 3.1 「6 項指標統計」副標補充「基於 {scaleLabel} 表現」

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit` 通過
- [x] 4.2 `npx vitest run` 通過
- [x] 4.3 `npm run build` 通過
- [x] 4.4 瀏覽器確認 6274 vs 6472：
  - 期望報酬率變為 1 年尺度（數字會不同於原 5 年）
  - 表頂顯示「資料尺度 — 期望報酬率：最近 1 年...」
  - 綜合勝出方副標含「基於最近 1 年表現」
- [x] 4.5 部署 Vercel
