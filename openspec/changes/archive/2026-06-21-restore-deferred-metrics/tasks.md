## 1. 補 KpiCard base 副資訊

- [x] 1.1 `PortfolioPerformanceBlock.tsx` 的「總實現損益」KpiCard 加 `base` 副資訊：`最大回撤 ${fmtMoney(p.maxDrawdown)}（${fmtPct(p.maxDrawdownPct)}）`，若 `p.maxDrawdownPct === 0` 則 base 為「無回撤」
- [x] 1.2 `PortfolioPerformanceBlock.tsx` 的「整體報酬率」KpiCard 加 `base="年化 ${fmtPct(p.annualizedReturn)}"`

## 2. 驗證

- [x] 2.1 `npx tsc --noEmit` 通過
- [x] 2.2 `npx vitest run` 通過（223 passed）
- [x] 2.3 `npm run build` 通過
- [x] 2.4 瀏覽器 preview：
  - DOM「總實現損益」KpiCard base 顯示「無回撤」（合成數據觸發零回撤分支）✓
  - DOM「整體報酬率」KpiCard base 顯示「年化 +13.9%」✓
  - 紅綠跌色維持
- [x] 2.5 commit + push origin main
- [x] 2.6 `npx vercel --prod` 部署
- [x] 2.7 tasks.md 記錄 commit hash + deployment URL
  - Commit: `ca21d11`
  - Production: https://web-app-gamma-fawn.vercel.app
  - Deployment: `dpl_mw7UXMoT6V36XbAsnPQfSM1AHAdK`
