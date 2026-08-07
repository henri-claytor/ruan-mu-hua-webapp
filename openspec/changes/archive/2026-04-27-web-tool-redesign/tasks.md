## 1. 設計系統 Token

- [x] 1.1 在 `src/index.css` 以 `:root {}` 定義所有語意顏色 CSS 變數（bg-app / bg-surface / bg-elevated / border-base / text-main / text-dim / text-faint）
- [x] 1.2 在 `tailwind.config.ts` 以 `extend.colors` 對應 utility class（bg-app / bg-surface / bg-elevated / border-base / text-main / text-dim / text-faint）
- [x] 1.3 定義字型大小 token（`--font-size-display` 至 `--font-size-caption`）並加入 Tailwind extend
- [x] 1.4 建立 `src/utils/chartStyle.ts`，匯出 `TOOLTIP_STYLE` / `AXIS_TICK_STYLE` / `CHART_COLORS`
- [x] 1.5 將 `FanChart.tsx` 改用 `chartStyle.ts` import，移除 inline style
- [x] 1.6 將 `VarHistogram.tsx` 改用 `chartStyle.ts` import，移除 inline style
- [x] 1.7 將 `HurstLineChart.tsx` 改用 `chartStyle.ts` import，移除 inline style
- [x] 1.8 將全站所有元件的 generic Tailwind gray class 替換為語意 token（bg-gray-50 → bg-app、bg-white → bg-surface、text-gray-900 → text-main 等）

## 2. 狀態管理與資料持久化

- [x] 2.1 安裝 `zustand`：`npm install zustand`
- [x] 2.2 建立 `src/store/useAppStore.ts`，定義 AppStore 介面與 persist middleware（key: `rmh-app-v2`）
- [x] 2.3 將 `IndividualPage` 的 rawText state 遷移至 Zustand store
- [x] 2.4 將 `HurstPage` 的 rawText state 遷移至 Zustand store
- [x] 2.5 將 `PortfolioPage` 的 stocks state 遷移至 Zustand store
- [x] 2.6 新增 compareA / compareB 欄位至 store（供比較頁使用）
- [x] 2.7 在各頁面新增「清除資料」按鈕，點擊後重置對應 store 欄位

## 3. 資料解析升級（parseReturns）

- [x] 3.1 在 `src/lib/utils.ts` 的 `parseReturns()` 新增百分比格式支援（`3.12%` → `0.0312`）
- [x] 3.2 新增 Tab 分隔符號解析（Excel 複製貼上）
- [x] 3.3 新增無效值過濾（空行、非數字、標頭列）
- [x] 3.4 更新 `utils.test.ts` 新增百分比與 Tab 格式的單元測試

## 4. NavBar 重設計

- [x] 4.1 重寫 `src/components/NavBar.tsx` 為側邊欄（桌機 md+ 時）+ 底部 tab bar（手機 <md 時）
- [x] 4.2 實作側邊欄 active 樣式：`border-l-[3px] border-blue-500 bg-blue-50 text-blue-700`
- [x] 4.3 實作底部 tab bar active 樣式：`border-t-[3px] border-blue-500 text-blue-600`
- [x] 4.4 在 `App.tsx` 調整版面佈局（sidebar 200px + 主內容區）
- [x] 4.5 新增「比較分析」（⚖️ /compare）導覽項目至 NavBar

## 5. 個股頁擴充（VaR + Monte Carlo）

- [x] 5.1 在 `IndividualPage.tsx` 的 EV 結果下方新增 VaR 區塊（使用現有 `calcVaR()`）
- [x] 5.2 在個股頁 VaR 區塊嵌入 `VarHistogram` 圖表
- [x] 5.3 在 `IndividualPage.tsx` 新增蒙地卡羅區塊（使用現有 `runMonteCarlo()`）
- [x] 5.4 在個股頁蒙地卡羅區塊嵌入 `FanChart` 圖表
- [x] 5.5 實作 VaR 與蒙地卡羅區塊的收折切換（accordion）
- [x] 5.6 新增個股頁空態 UI（資料未輸入時顯示引導說明）

## 6. FanChart 時間軸切換

- [x] 6.1 在 `FanChart.tsx` 新增 `activeRange` local state（預設 `5Y`）
- [x] 6.2 新增 1Y / 3Y / 5Y 切換按鈕，active 狀態以 `border-b-[3px] border-blue-500` 標示
- [x] 6.3 切換時依 range 篩選 allPathsMonthly 資料，更新圖表 X 軸

## 7. 比較頁（ComparePage）

- [x] 7.1 建立 `src/pages/ComparePage.tsx`
- [x] 7.2 在 `App.tsx` 新增 `/compare` route
- [x] 7.3 實作兩欄並排輸入區（名稱 + textarea），讀寫 Zustand compareA / compareB
- [x] 7.4 實作比較結果表格（EV / 勝率 / 實際賠率 / VaR 95% / VaR 99% / H 值）
- [x] 7.5 實作優勢方高亮邏輯（EV / 勝率 / 賠率 / VaR 各自比較，H 值僅顯示解讀）
- [x] 7.6 處理僅一股有資料的部分顯示狀態（另一欄顯示「－ 待輸入」）

## 8. 匯入匯出功能

- [x] 8.1 安裝 `html2canvas`：`npm install html2canvas`
- [x] 8.2 建立 `src/utils/export.ts`，實作 `copyTextSummary(result)` 與 `downloadPng(elementRef, filename)` 函式
- [x] 8.3 在 `IndividualPage.tsx` 結果區新增「複製摘要」與「下載 PNG」按鈕
- [x] 8.4 在 `PortfolioPage.tsx` 結果區新增「複製摘要」與「下載 PNG」按鈕
- [x] 8.5 在 `HurstPage.tsx` 結果區新增「複製摘要」按鈕
- [x] 8.6 實作按鈕 disabled 狀態（無結果時不可點擊）
- [x] 8.7 實作「已複製 ✓」暫時文字反饋（1.5 秒後恢復）

## 9. 驗證與部署

- [x] 9.1 執行 `npm run build`，確認無 TypeScript 錯誤
- [x] 9.2 執行 `npm test`，確認所有單元測試通過（含新增的 parseReturns 測試）
- [x] 9.3 在本地 `npm run dev` 驗證各頁面功能（個股 / 投資組合 / Hurst / 比較）
- [x] 9.4 驗證資料持久化：在各頁輸入資料後重新整理，確認資料保留
- [x] 9.5 驗證響應式：在手機寬度（375px）確認底部 tab bar 與全寬圖表正確顯示
- [x] 9.6 從 repo root（`D:/Claude/ruan-mu-hua/`）執行 `npx vercel --prod` 部署
- [x] 9.7 確認正式網址（https://ruan-mu-hua-webapp.vercel.app）各頁面功能正常
