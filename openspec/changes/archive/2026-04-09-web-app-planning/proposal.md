## Why

Google Sheet 原型已驗證核心計算邏輯（EV、VaR、蒙地卡羅、Hurst 指數），但使用者需要安裝 Apps Script、手動執行函數，且無法在行動裝置上流暢操作。將工具升級為 Web App，可讓學員直接在瀏覽器開啟使用，無需任何前置設定，同時支援更豐富的互動式圖表與即時計算回饋。

## What Changes

- 新增獨立 React + TypeScript Web App 專案（`web-app/`）
- 實作四大功能模組：Individual EV 計算、Portfolio 組合分析、Hurst 指數分析、圖表視覺化
- 所有計算邏輯從 Google Apps Script 移植為純 TypeScript（瀏覽器端執行，無後端）
- 部署至 Vercel / Netlify（免費方案，自動 HTTPS，URL 可直接分享給學員）
- Google Sheet 原版維持不變，Web App 為獨立平行產品

## Capabilities

### New Capabilities

- `individual-ev-calculator`：輸入 120 筆月報酬率，即時顯示勝率、敗率、Avg Gain/Loss、期望值（EV）、賠率、損益平衡賠率與象限判斷
- `portfolio-analyzer`：支援最多 10 支股票，輸入各自報酬率與比重，計算加權組合期望值、VaR 95%/99%、蒙地卡羅 1/3/5 年模擬（P5/P50/P95）
- `hurst-calculator`：對個股或組合報酬率序列執行 R/S Analysis，顯示 H 值與三區間判斷（趨勢延續 / 隨機遊走 / 均值回歸）
- `interactive-charts`：蒙地卡羅路徑扇形圖、VaR 分布長條圖、Hurst 累積偏差折線圖，使用 Recharts 或 Chart.js 實作

### Modified Capabilities

（無——Web App 為全新產品，不修改現有 Google Sheet 規格）

## Impact

- **新增**：`web-app/` 目錄（React + TypeScript + Vite 專案）
- **新增**：`web-app/src/lib/` 計算核心（EV、VaR、MonteCarlo、Hurst 純 TS 函數）
- **不影響**：`expected-value-calculator/setup_sheet.gs` 及所有 Google Sheet 相關檔案
- **依賴**：Node.js 18+、React 18、TypeScript 5、Vite、Recharts（或 Chart.js）、Tailwind CSS
- **部署**：Vercel CLI 或 GitHub 自動部署，無需後端伺服器
