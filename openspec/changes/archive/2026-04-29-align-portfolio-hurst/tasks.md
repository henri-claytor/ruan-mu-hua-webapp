## 1. PortfolioPage 簡化 Hurst 邏輯

- [x] 1.1 移除 `hurstSingle` 計算（`!hurstMulti && portForRisk.length >= 10 ? calcHurst(portForRisk) : null`）
- [x] 1.2 計算 `stocksLackingHurstDaily = stocks.filter(s => s.code && s.dailyReturns.length < 240).map(s => s.name || s.code)`
- [x] 1.3 Hurst 區塊 JSX 改為兩態：
  - hurstMulti 存在 → `<MultiScaleHurstBlock titleOverride="組合趨勢延續性偵測" />`
  - 否則 → 「資料不足」說明列（含缺少股票列表）
- [x] 1.4 ActionGuide 中 hurstH 改為 `hurstMulti?.short.h ?? null`（移除單尺度路徑）

## 2. 清理 PortfolioPage 不再使用的 import 與元件

- [x] 2.1 從 `import` 移除 `calcHurst`、`HurstResult` 型別（保留 `calcMultiScaleHurst`、`MultiScaleHurstResult`）
- [x] 2.2 移除 `import HurstLineChart from '../components/charts/HurstLineChart'`
- [x] 2.3 移除 `PortfolioHurstBlock` 函式定義（連同其 props 介面）
- [x] 2.4 移除 `colorForH` 輔助函式（僅供 PortfolioHurstBlock 使用）

## 3. 驗證

- [x] 3.1 `npx tsc --noEmit` 通過
- [x] 3.2 `npx vitest run` 全部通過（既有測試應仍綠燈）
- [x] 3.3 `npm run build` 通過
- [x] 3.4 在瀏覽器確認：
  - 所有股票日報酬 ≥ 240 → 顯示「組合趨勢延續性偵測」多尺度三卡片
  - 任一股票日報酬 < 240 → 顯示「資料不足」說明列，含缺少股票名稱
  - 不再看到單尺度 Hurst 區塊（PortfolioHurstBlock）
- [x] 3.5 部署到 Vercel
