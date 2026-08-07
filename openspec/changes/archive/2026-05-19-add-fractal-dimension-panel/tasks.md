## 1. lib/fractalDimension.ts — 純函式

- [x] 1.1 新增 `src/lib/fractalDimension.ts`
- [x] 1.2 `hurstToFractalDimension(h: number): number` — 回傳 `2 - h`，NaN 傳回 NaN
- [x] 1.3 `FractalRegime` type：5 級分類
- [x] 1.4 `classifyFractalDimension(d: number): FractalRegime`：依設計 D1 門檻分類，NaN → 'random'
- [x] 1.5 `fractalRegimeLabel(r)`：回傳中文標籤（強趨勢延續 / 偏趨勢 / 接近隨機 / 偏均值回歸 / 強均值回歸）

## 2. 測試

- [x] 2.1 新增 `src/lib/fractalDimension.test.ts`
- [x] 2.2 測試 `hurstToFractalDimension`：H=0.6→1.4、H=0.5→1.5、H=0.3→1.7、H=NaN→NaN
- [x] 2.3 測試 `classifyFractalDimension` 5 級邊界：D=1.39→strong-trend、1.4→mild-trend、1.47→mild-trend、1.5→random、1.52→random、1.53→mild-mean-revert、1.6→mild-mean-revert、1.61→strong-mean-revert
- [x] 2.4 測試 NaN 行為

## 3. FractalDimensionBlock 元件

- [x] 3.1 新增 `src/components/charts/FractalDimensionBlock.tsx`
- [x] 3.2 接受 `hurst: MultiScaleHurstResult` prop
- [x] 3.3 結構：`.panel` + 標題「技術指標」+ 副標解釋
- [x] 3.4 三卡 grid-cols-3：短/中/長期 D 值
- [x] 3.5 每卡含：尺度 label、窗口 note、「D 值」label、serif 24px 數字（3 位小數）、狀態 chip（依配色決策 D2）
- [x] 3.6 NaN 處理：顯示「資料不足」

## 4. IndividualPage 整合

- [x] 4.1 import FractalDimensionBlock
- [x] 4.2 在 MultiScaleHurstBlock 之後插入 `<FractalDimensionBlock hurst={results.hurst} />`（hurst 不為 null 時）

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 通過
- [x] 5.2 `npx vitest run` 全部通過（含新增 fractalDimension 測試）
- [x] 5.3 `npm run build` 通過
- [x] 5.4 瀏覽器確認：個股頁查詢後 Hurst 之後出現「技術指標」panel，3 張卡含 D 值 + 狀態
- [x] 5.5 部署 Vercel
