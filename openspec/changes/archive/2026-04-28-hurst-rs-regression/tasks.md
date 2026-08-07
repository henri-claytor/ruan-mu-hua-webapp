## 1. 核心演算法

- [x] 1.1 在 `src/lib/hurst.ts` 新增 `RSPoint` 介面：`{ n: number; rs: number; subWindowCount: number }`
- [x] 1.2 `HurstResult` 介面新增 `points: RSPoint[]` 欄位
- [x] 1.3 實作私有 `calcRSForWindow(returns: number[]): number`：計算單一窗口的 R/S 值（不取 log）
- [x] 1.4 實作私有 `linearRegressionSlope(xs: number[], ys: number[]): number`：最小平方法閉合解
- [x] 1.5 重寫 `calcHurst(returns)`：多窗口 R/S 迴歸 + Anis-Lloyd 小樣本偏差修正（新增 `lgamma` Lanczos 近似 + `expectedRS` 函式）

## 2. 既有測試對齊

- [x] 2.1 `hurst.test.ts` 既有「H 值公式」斷言改為「多窗口模式：log-log 迴歸斜率；fallback 模式：單點公式」
- [x] 2.2 確認既有測試（< 10 筆 / cumDeviations 長度 / R = MAX-MIN / 均值回歸解讀）仍通過
- [x] 2.3 新增測試「N=15 序列觸發 fallback 單點公式」
- [x] 2.4 新增測試「N=240 序列產出 ≥ 4 個 RSPoint」
- [x] 2.5 新增測試「H 值 clip 到 [0, 1]」

## 3. 診斷重跑

- [x] 3.1 重跑 `hurst.diagnostic.test.ts`：白噪音 0.516 / 強自相關 0.858 / 強反趨勢 0.114（接近理論值）
- [x] 3.2 收緊診斷斷言：白噪音 H ∈ [0.40, 0.60] / 強自相關 ≥ 0.65 / 強反趨勢 ≤ 0.30 全部通過
- [x] 3.3 升級 `scripts/diagnose-real-stocks.mjs` 為新版本，重跑 10 支實際個股對比舊新值

## 4. UI 連動

- [x] 4.1 `MultiScaleHurstBlock.tsx` 計算步驟改顯示 `points` 表格（n / 子窗口數 / 平均 R/S）+ 迴歸式 + 最終 H
- [x] 4.2 Fallback 模式（`points.length === 1`）顯示既有 `μ / R / S / H` 格式並標注「樣本較小，使用單點公式」
- [x] 4.3 確認 IndividualPage / PortfolioPage 不需改動（`result.h` 公開介面不變）

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 通過
- [x] 5.2 `npx vitest run` 通過（6 test files, 56 tests）
- [ ] 5.3 在瀏覽器確認：
  - 個股分析頁三尺度卡片正常顯示
  - 計算步驟區塊顯示新格式（4 個 RSPoint + 迴歸式）
  - 鴻海、中鋼等股票 H 值與舊版差異合理
- [x] 5.4 部署到 Vercel
