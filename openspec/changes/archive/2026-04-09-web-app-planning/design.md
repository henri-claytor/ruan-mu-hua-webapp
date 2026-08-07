## Context

現有工具為 Google Sheets + Apps Script 實作，學員需透過分享連結開啟 Sheet，手動貼入數據並執行 Apps Script 函數。計算邏輯（EV、VaR、蒙地卡羅、Hurst R/S Analysis）已在 `setup_sheet.gs` 中完整驗證，數學正確性已確認。

Web App 目標是讓學員在任何裝置的瀏覽器直接使用，無需 Google 帳號或任何設定。所有計算在前端 TypeScript 執行，無需後端服務。

## Goals / Non-Goals

**Goals:**
- 將四大計算模組移植為純 TypeScript library（可單獨測試）
- React + TypeScript + Vite SPA，支援桌面與行動裝置
- 部署至 Vercel（一個指令完成，免費方案）
- 計算結果與 Google Sheet 版本數值一致
- 互動式圖表（Recharts）取代靜態 Sheet 圖表

**Non-Goals:**
- 後端 API、資料庫或用戶帳號系統
- 多語言（繁體中文為唯一語言）
- 即時市場數據串接
- 修改或取代現有 Google Sheet

## Decisions

### 1. 純前端，無後端
**選擇**：所有計算在瀏覽器執行，Vercel 部署靜態資產  
**理由**：計算量輕（120 筆 × 100 路徑蒙地卡羅 < 50ms）；無需維護伺服器；部署成本為零  
**替代方案**：Next.js API Routes → 增加複雜度但無實質益處

### 2. React + TypeScript + Vite
**選擇**：React 18 + TypeScript 5 + Vite 5  
**理由**：元件化利於四個功能模組分割；TypeScript 確保計算函數型別安全；Vite 開發啟動 < 1s  
**替代方案**：Vue 3（學習曲線較平，但生態相對較小）；純 HTML/JS（不易維護）

### 3. Recharts 作為圖表庫
**選擇**：Recharts（基於 React + D3）  
**理由**：React 原生元件，不需手動管理 DOM；聲明式 API 易於維護；支援動畫與 tooltip  
**替代方案**：Chart.js + react-chartjs-2（命令式，需 ref 管理）；D3 直接操作（過度複雜）

### 4. 計算核心獨立為 `src/lib/`
**選擇**：`src/lib/ev.ts`、`src/lib/var.ts`、`src/lib/montecarlo.ts`、`src/lib/hurst.ts`  
**理由**：純函數，無 React 依賴，可獨立撰寫單元測試（Vitest）；邏輯與 UI 分離  
**替代方案**：直接寫在 React hooks 內 → 難以測試與複用

### 5. Tailwind CSS 樣式
**選擇**：Tailwind CSS v3  
**理由**：utility-first 快速建立一致 UI；無需自訂 CSS 文件；與 Vite 整合簡單  
**替代方案**：shadcn/ui（建立在 Tailwind 上，可引入作為元件庫）

### 6. 專案目錄結構
```
web-app/
├── src/
│   ├── lib/           # 純計算函數（ev, var, montecarlo, hurst）
│   ├── components/    # 共用 UI 元件（DataInput, ResultCard, Chart）
│   ├── pages/         # 四個功能頁面
│   │   ├── IndividualPage.tsx
│   │   ├── PortfolioPage.tsx
│   │   ├── HurstPage.tsx
│   │   └── HomePage.tsx
│   └── App.tsx        # React Router 路由設定
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

## Risks / Trade-offs

| 風險 | 緩解措施 |
|------|----------|
| 蒙地卡羅 1000 條路徑 × 60 個月可能阻塞 UI | 預設 100 條路徑（與 Sheet 版本一致）；如需更多，改用 Web Worker |
| 行動裝置輸入 120 筆數據體驗差 | 支援貼上（CSV/換行分隔）批次輸入，減少逐格輸入需求 |
| Recharts bundle 較大（~300KB gzipped） | Vite 自動 code-splitting；首頁不載入圖表模組 |
| 計算結果與 Sheet 版本不一致 | 建立對照測試：用已知數據比對兩版本輸出 |

## Migration Plan

1. 建立 `web-app/` 目錄，初始化 Vite + React + TypeScript 專案
2. 移植計算核心（`src/lib/`），撰寫單元測試確認與 Sheet 版本一致
3. 建立四個功能頁面 UI（先靜態，再接計算邏輯）
4. 整合圖表元件
5. 本機測試完成後，執行 `vercel deploy` 部署
6. 將 URL 分享給作者（阮慕驊）驗收

**Rollback**：Web App 為全新獨立專案，不影響現有 Google Sheet，無需 rollback 計畫。

## Open Questions

- 是否需要「範例數據」預填功能，讓初次使用的學員可以直接看到計算結果？
- Portfolio 最多支援幾支股票？（建議 2–10 支，與 Sheet 版本對齊）
- 是否需要「匯出 PDF 報告」功能？（可列為 Phase 3）
