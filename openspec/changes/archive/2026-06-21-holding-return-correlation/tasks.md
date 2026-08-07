## 1. 計算邏輯

- [x] 1.1 新增 `src/lib/correlation.ts` — `calcPearsonCorrelation(xs, ys): number`、`interpretCorrelation(r): string`
- [x] 1.2 新增 `src/lib/correlation.test.ts` — 13 個測試案例（正/負/無/分母 0/長度不等/邊界 + 解讀分級）

## 2. 散布圖元件

- [x] 2.1 新增 `src/components/trade/HoldingReturnScatter.tsx`，輸入 Trade[]，使用 Recharts ScatterChart
- [x] 2.2 點配色紅綠跌（returnRate > 0 紅、< 0 綠、= 0 灰）
- [x] 2.3 樣本不足（< 5）顯示提示訊息，不渲染圖
- [x] 2.4 圖上方顯示「相關係數 r = X.XX | <解讀文字>」
- [x] 2.5 Tooltip 樣式沿用 `TOOLTIP_STYLE`

## 3. 整合到 PerformanceCharts

- [x] 3.1 `PerformanceCharts.tsx` import `HoldingReturnScatter` 並加入既有圖表清單末尾

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit` 通過
- [x] 4.2 `npx vitest run` 通過（223 → 236 passed，新增 13 個 correlation 測試）
- [x] 4.3 `npm run build` 通過（中途修了一個 Tooltip TypeScript formatter 型別錯誤）
- [x] 4.4 瀏覽器 preview：注入 8 筆合成 trades →
  - DOM 含「持有天數 vs 報酬率」+「相關係數」✓
  - r 值 +0.93 + 解讀「強正相關：持有越久報酬越高」✓
  - 散布圖 recharts-scatter 渲染、紅綠色碼正確
- [x] 4.5 commit + push origin main
- [x] 4.6 `npx vercel --prod` 部署
- [x] 4.7 tasks.md 記錄 commit hash + deployment URL
  - Commit: `dae51e9`
  - Production: https://web-app-gamma-fawn.vercel.app
  - Deployment: `dpl_J9G6gETqy5T4NZ4U1TCfzqQr5hE3`
