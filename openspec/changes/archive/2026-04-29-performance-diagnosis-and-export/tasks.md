## 1. 安裝依賴

- [x] 1.1 `npm install jspdf xlsx` 安裝兩個新依賴
- [x] 1.2 確認 package.json 與 lock file 更新
- [x] 1.3 確認 build 仍能完成（dynamic import 確保 xlsx 不進初始 bundle）

## 2. 診斷規則引擎

- [x] 2.1 在 `src/lib/diagnosis.ts` 新增 `Diagnosis` 介面與 `DiagnosisLevel` 型別
- [x] 2.2 實作 `diagnose(trades, performance, stocks): Diagnosis[]` 主函式
- [x] 2.3 實作 6 條組合層級規則（concentration-risk / stop-loss-discipline / low-profit-factor / low-payoff / high-frequency / low-sample）
- [x] 2.4 實作 6 條個股層級規則（stock-all-loss-2 / stock-all-loss-3plus / stock-low-payoff / stock-money-management / stock-concentration / stock-low-sample）
- [x] 2.5 互斥處理：stock-all-loss-2 與 stock-all-loss-3plus 不同時觸發
- [x] 2.6 動態填值：訊息內含實際數字（避免 placeholder）
- [x] 2.7 排序：alert → warning → note → info；同 level portfolio 先於 stock
- [x] 2.8 在 `src/lib/diagnosis.test.ts` 新增測試：每條規則的觸發 / 不觸發場景；空陣列回傳 []；互斥規則只觸發一條

## 3. DiagnosisPanel 元件

- [x] 3.1 新增 `src/components/trade/DiagnosisPanel.tsx`：接受 `Diagnosis[]` props，過濾 scope='portfolio' 的條目
- [x] 3.2 標題 + 摘要列（找到 N 條 / M 警示 / X 提醒 / Y 資訊）
- [x] 3.3 每條診斷一列：icon + title + message + advice，依 level 配色
- [x] 3.4 空態：portfolio 診斷為空時顯示「✓ 暫無需要關注的問題」綠色 banner
- [x] 3.5 trades.length === 0 時不渲染（由父層控制）

## 4. 矩陣表診斷標記

- [x] 4.1 `StockQuadrantMatrix` 接受新 prop `diagnoses?: Diagnosis[]`（包含全部診斷）
- [x] 4.2 每列計算該股的 stock scope 診斷，顯示「🔴 N 🟡 M ⚪ X ℹ️ Y」摘要
- [x] 4.3 沒有診斷時顯示「—」或「✓」
- [x] 4.4 Hover tooltip 顯示該股所有診斷的 title + advice（使用 `title` 屬性簡單實作）

## 5. ExportMenu + 匯出實作

- [x] 5.1 新增 `src/components/trade/ExportMenu.tsx`：下拉選單（PDF / Excel / CSV），含載入中狀態
- [x] 5.2 新增 `src/lib/exportPdf.ts`：`exportPerformancePdf(elementIds, filename)`，用 html2canvas + jspdf 多頁組合
- [x] 5.3 新增 `src/lib/exportXlsx.ts`：`exportPerformanceXlsx(performance, stocks, trades, diagnoses, filename)`，用 dynamic import('xlsx') 載入後產生 4 sheets
- [x] 5.4 在 PerformancePage 為各區塊加 `id` 屬性（performance-banner / performance-dashboard / performance-diagnosis / performance-matrix / performance-charts / performance-trades）
- [x] 5.5 ExportMenu 取代既有「匯出 CSV」按鈕；CSV 行為保留（檔名與格式不變）

## 6. PerformancePage 整合

- [x] 6.1 在 PerformancePage 計算 `const diagnoses = useMemo(() => diagnose(trades, performance, stockStats), [...])`
- [x] 6.2 在 Dashboard 後、矩陣表前插入 `<DiagnosisPanel diagnoses={diagnoses} />`
- [x] 6.3 將 diagnoses 傳給 `<StockQuadrantMatrix diagnoses={diagnoses} />`
- [x] 6.4 Banner 中換上 `<ExportMenu trades={trades} performance={performance} stocks={stockStats} diagnoses={diagnoses} />`

## 7. 驗證

- [x] 7.1 `npx tsc --noEmit` 通過
- [x] 7.2 `npx vitest run` 全部通過（含新增 diagnosis 測試）
- [x] 7.3 `npm run build` 通過，xlsx dynamic import 正確 split
- [x] 7.4 在瀏覽器確認：
  - DiagnosisPanel 顯示在 Dashboard 後、矩陣表前
  - 各規則在對應條件下觸發（測幾種 case：全敗股、低賠率、集中度高）
  - 矩陣表診斷欄顯示 emoji 計數，hover 看到 tooltip
  - 匯出 PDF：產生 ~6 頁 A4 PDF，包含 Dashboard / 診斷 / 矩陣 / 圖表 / 交易明細
  - 匯出 Excel：產生 4 分頁 xlsx，欄位齊全
  - 匯出 CSV：與 Change 1 行為一致
  - 載入中狀態正常顯示，匯出失敗時錯誤訊息合理
- [x] 7.5 部署到 Vercel
