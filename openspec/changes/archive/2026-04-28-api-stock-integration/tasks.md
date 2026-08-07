## 1. CMoney API Client

- [x] 1.1 建立 `src/lib/api.ts`，定義三個 async function：`fetchStockList()`、`fetchMonthlyReturns(code)`、`fetchDailyReturns(code)`
- [x] 1.2 實作 `fetchStockList()`：呼叫 DtNo=133054167，解析 Data 陣列為 `{ code: string; name: string }[]`
- [x] 1.3 實作 `fetchMonthlyReturns(code)`：呼叫 DtNo=133066054，解析百分比字串為 number[]，取最新 120 筆
- [x] 1.4 實作 `fetchDailyReturns(code)`：呼叫 DtNo=133057193，解析百分比字串為 number[]
- [x] 1.5 在瀏覽器測試三支 API 的 CORS 狀況，確認是否可直接呼叫
- [x] 1.6 若有 CORS 問題，建立 `api/proxy.ts`（Vercel Edge Function），作為 proxy 轉發請求
- [x] 1.7 建立 `src/lib/api.test.ts`，新增解析邏輯的單元測試（百分比字串轉換、NaN 過濾）

## 2. Zustand Store 更新

- [x] 2.1 在 `useAppStore.ts` 新增 `stockList: { code: string; name: string }[]` 欄位與 `setStockList` setter
- [x] 2.2 將 `individualRawText` 改為 `individualStockCode: string`（存選取的股票代號）
- [x] 2.3 將 `hurstRawText` 移除（Hurst 整合進個股頁，不再獨立存儲）
- [x] 2.4 將 `stocks[]` 的 `rawText` 欄位改為 `monthlyReturns: number[]` + `dailyReturns: number[]`
- [x] 2.5 將 `compareA / compareB` 的 `rawText` 改為 `stockCode: string`

## 3. StockSelector 元件

- [x] 3.1 建立 `src/components/StockSelector.tsx`，props：`value: string`、`onChange: (code: string, name: string) => void`
- [x] 3.2 實作搜尋輸入框，即時過濾 Zustand stockList（代號或名稱包含關鍵字），顯示最多 10 筆
- [x] 3.3 實作下拉清單，點選後呼叫 `onChange` 並收起清單
- [x] 3.4 實作「載入中...」狀態（stockList 為空時禁用輸入）
- [x] 3.5 實作「找不到符合的股票」空態提示
- [x] 3.6 在 App 初始化時呼叫 `fetchStockList()` 並存入 store（`App.tsx` 的 `useEffect`）

## 4. 個股分析頁重構

- [x] 4.1 移除 `IndividualPage.tsx` 的 DataInput / textarea，改用 `StockSelector`
- [x] 4.2 選股後並行呼叫 `fetchMonthlyReturns` + `fetchDailyReturns`，顯示載入 Skeleton
- [x] 4.3 實作雙頻判斷：日報酬 ≥ 252 筆 → VaR + Hurst 用日頻；否則降級月頻並標注
- [x] 4.4 在蒙地卡羅區塊之後新增 Hurst 結果區（H 值 + 解讀 + HurstLineChart + 計算步驟）
- [x] 4.5 結果區塊標題加入頻率標注（副標題：「使用日報酬 N 筆」或「使用月報酬 N 筆（日頻數據不足）」）
- [x] 4.6 實作頁面標題顯示已選取的股票代號 + 名稱
- [x] 4.7 更新「清除資料」按鈕：清空 store 的 `individualStockCode`，重置所有結果

## 5. 投資組合頁重構

- [x] 5.1 將 `PortfolioPage.tsx` 每支股票的 textarea 改為 `StockSelector`
- [x] 5.2 選股後自動呼叫 `fetchMonthlyReturns` + `fetchDailyReturns`，存入該股的 store 欄位
- [x] 5.3 實作「同一支股票不可重複加入」驗證
- [x] 5.4 比重總和驗證維持不變（必須合計 100%）
- [x] 5.5 在蒙地卡羅區塊之後新增投資組合 Hurst 結果區
- [x] 5.6 實作雙頻判斷：全部股票日報酬 ≥ 252 → 日頻；否則月頻並標注哪支股票不足

## 6. 移除 Hurst 獨立頁面

- [x] 6.1 刪除 `src/pages/HurstPage.tsx`
- [x] 6.2 在 `App.tsx` 移除 `/hurst` route，新增 `/hurst` → 重導向至 `/`
- [x] 6.3 在 `NavBar.tsx` 移除「Hurst 指數」導覽項目

## 7. 比較頁更新

- [x] 7.1 將 `ComparePage.tsx` 的 compareA / compareB textarea 改為 `StockSelector`
- [x] 7.2 選股後自動抓取月報酬 + 日報酬，依雙頻規則計算各指標
- [x] 7.3 比較表新增 Hurst 列（已有），確認頻率標注正確顯示

## 8. 驗證與部署

- [x] 8.1 執行 `npm run build`，確認無 TypeScript 錯誤
- [x] 8.2 執行 `npm test`，確認所有單元測試通過
- [ ] 8.3 本地測試：選取台積電（2330），確認月/日報酬正確載入，EV/VaR/MC/Hurst 全部顯示
- [ ] 8.4 本地測試：投資組合選 2-3 支股票，確認加權計算與 Hurst 結果正確
- [ ] 8.5 本地測試：比較頁選兩支股票，確認並排結果含 Hurst 頻率標注
- [ ] 8.6 確認 `/hurst` 路徑重導向至首頁
- [x] 8.7 從 repo root（`D:/Claude/ruan-mu-hua/web-app/`）執行 `npx vercel --prod` 部署
- [ ] 8.8 確認正式網址各頁面功能正常
