## 1. 專案初始化

- [x] 1.1 在 `web-app/` 目錄初始化 Vite + React + TypeScript 專案（`npm create vite@latest web-app -- --template react-ts`）
- [x] 1.2 安裝依賴：`tailwindcss`、`recharts`、`react-router-dom`
- [x] 1.3 設定 Tailwind CSS（`tailwind.config.ts` + `src/index.css`）
- [x] 1.4 設定 React Router：建立 `App.tsx` 路由結構（首頁、Individual、Portfolio、Hurst）
- [x] 1.5 建立目錄結構：`src/lib/`、`src/components/`、`src/pages/`

## 2. 計算核心 Library

- [x] 2.1 建立 `src/lib/utils.ts`：解析輸入文字為數字陣列（支援換行 / 逗號分隔、百分比自動轉換）
- [x] 2.2 建立 `src/lib/ev.ts`：實作 `calcEV(returns)` → `{ winRate, lossRate, avgGain, avgLoss, ev, actualOdds, breakEvenOdds, quadrant }`
- [x] 2.3 建立 `src/lib/var.ts`：實作 `calcVaR(returns)` → `{ var95, var99, sorted }`
- [x] 2.4 建立 `src/lib/montecarlo.ts`：實作 `runMonteCarlo(returns, paths, months)` → `{ p5, p50, p95, allPaths }`（對數常態分布，初始 100 萬）
- [x] 2.5 建立 `src/lib/hurst.ts`：實作 `calcHurst(returns)` → `{ h, r, s, n, cumDeviations, interpretation }`
- [x] 2.6 建立 `src/lib/portfolio.ts`：實作 `calcPortfolioReturns(stocks, weights)` → 加權組合月報酬率陣列

## 3. 計算核心單元測試

- [x] 3.1 安裝 Vitest：`npm install -D vitest`
- [x] 3.2 撰寫 `ev.test.ts`：用已知數據驗證 EV、勝率、賠率與 Google Sheet 版本一致
- [x] 3.3 撰寫 `var.test.ts`：驗證 VaR 95%/99% 排序邏輯正確
- [x] 3.4 撰寫 `hurst.test.ts`：驗證 H 值 = 0.50（使用 Sheet 版本相同的測試數據）
- [x] 3.5 執行 `npm run test`，確認所有測試通過

## 4. 共用 UI 元件

- [x] 4.1 建立 `src/components/DataInput.tsx`：多行文字輸入框，顯示已讀取筆數與錯誤提示
- [x] 4.2 建立 `src/components/ResultCard.tsx`：數字結果卡片（標題 + 數值 + 單位 + 顏色）
- [x] 4.3 建立 `src/components/QuadrantBadge.tsx`：象限判斷文字徽章（四種顏色對應四象限）
- [x] 4.4 建立 `src/components/NavBar.tsx`：頂部導覽列，連結至四個頁面

## 5. Individual EV 計算頁面

- [x] 5.1 建立 `src/pages/IndividualPage.tsx`：頂部顯示 EV、賠率、象限判斷
- [x] 5.2 整合 `DataInput` 元件，使用者貼入數據後即時觸發 `calcEV()`
- [x] 5.3 顯示基礎統計區塊：勝率、敗率、Avg Gain、Avg Loss
- [x] 5.4 顯示賠率計算步驟：實際賠率 vs 損益平衡賠率

## 6. Portfolio Analyzer 頁面

- [x] 6.1 建立 `src/pages/PortfolioPage.tsx`：支援動態新增 / 刪除股票（2–10 支）
- [x] 6.2 實作股票輸入組元件：名稱 + 報酬率 + 比重，比重合計即時驗證
- [x] 6.3 整合 `calcPortfolioReturns()` + `calcEV()`，頂部顯示加權組合 EV
- [x] 6.4 整合 `calcVaR()`，顯示 VaR 95%/99% 與解讀說明
- [x] 6.5 整合 `runMonteCarlo()`，顯示 1/3/5 年 P5/P50/P95（初始 100 萬元）
- [x] 6.6 顯示 μ、σ 參數與蒙地卡羅路徑明細區塊（置於 P5/P50/P95 下方）

## 7. Hurst Calculator 頁面

- [x] 7.1 建立 `src/pages/HurstPage.tsx`：提供「自訂數據」與「使用組合報酬率」兩種輸入模式
- [x] 7.2 整合 `calcHurst()`，顯示 H 值（小數兩位）與三區間判斷文字
- [x] 7.3 顯示 R、S、n 中間計算步驟，供使用者核對
- [x] 7.4 顯示累積偏差數值表（月份 + Xₜ）

## 8. 互動式圖表

- [x] 8.1 建立 `src/components/charts/FanChart.tsx`：蒙地卡羅 P5/P50/P95 扇形折線圖（Recharts LineChart + ReferenceArea）
- [x] 8.2 建立 `src/components/charts/VarHistogram.tsx`：報酬率分布長條圖，標示 VaR 95%/99% 垂直線
- [x] 8.3 建立 `src/components/charts/HurstLineChart.tsx`：累積偏差折線圖，標示 MAX/MIN 水平虛線
- [x] 8.4 整合 FanChart 至 Portfolio 蒙地卡羅區塊（結果旁）
- [x] 8.5 整合 VarHistogram 至 Portfolio VaR 區塊
- [x] 8.6 整合 HurstLineChart 至 Hurst Calculator 頁面
- [x] 8.7 確認所有圖表在行動裝置（375px 寬）正確響應

## 9. 首頁與收尾

- [x] 9.1 建立 `src/pages/HomePage.tsx`：工具介紹、四個功能入口卡片
- [x] 9.2 新增「範例數據」按鈕至 IndividualPage 與 HurstPage（預填測試數據）
- [x] 9.3 全站 RWD 測試：桌面（1440px）、平板（768px）、行動（375px）

## 10. 部署

- [x] 10.1 建立 `vercel.json`（或確認 Vite 預設設定符合 Vercel 需求）
- [x] 10.2 執行 `npm run build`，確認無 TypeScript 錯誤
- [x] 10.3 執行 `vercel deploy`，取得正式 URL
- [x] 10.4 開啟 URL 在手機與桌機各驗收一次所有功能
- [x] 10.5 將 URL 提供給作者（阮慕驊）進行最終驗收
