# Proposal: 績效圖表 + 雙向跨頁連結

## Why

Change 1 與 2 完成了**績效分析頁的核心結構**（資料、Dashboard、矩陣表、單向深度連結個股頁）。但目前還缺兩塊關鍵內容：

### 1. 視覺化深度

純表格與卡片無法呈現**時間序列**與**分佈**：
- 「我的損益隨時間怎麼演變？」→ 累積損益曲線
- 「最大回撤發生在哪個區間？」→ 曲線上標注
- 「哪些股票貢獻最大？」→ 個股長條圖比表格更直覺
- 「我喜歡長持還是短持？哪種獲利率高？」→ 持有天數分佈

### 2. 雙向跨頁連結（最關鍵的整合洞察）

Change 2 做了**績效→個股**的單向連結。但反向更有價值：

當使用者在**個股分析頁**看到「2330 台積電 EV +0.5%」時，他更想知道：
- 「我**實際**交易過這檔幾次？我自己賺賠如何？」
- 「市場給我的賠率 vs 我自己的賠率，哪個高？」

這個對比是**市場面 vs 個人面的差距分析**——是兩個功能整合後才能產出的獨家洞察，也是這個 app 與其他純前向分析或純後向分析工具的差異化價值。

## What Changes

### 績效分析頁新增 3 張圖表

在矩陣表之後、原始交易表格之前，新增「績效視覺化」區塊（可摺疊，預設展開）：

1. **累積損益曲線**（CumulativePnlChart）
   - X 軸：sellDate；Y 軸：累積損益（元）
   - 主曲線（藍）+ 滾動高點曲線（淺灰）
   - 最大回撤區段以紅色陰影標注，附文字「最大回撤 −X 元（−Y%）」
   - 使用 Recharts AreaChart + ReferenceArea

2. **個股損益貢獻長條圖**（StockContributionBar）
   - 水平長條，依總損益排序（高至低）
   - 正值紅、負值綠（台股慣例）
   - 標籤：股票代號 + 名稱 + 損益金額

3. **持有天數分佈直方圖**（HoldingDaysDistribution）
   - 分桶：0–7 / 8–14 / 15–30 / 31–60 / 61–90 / 90+ 天
   - 每桶疊加：勝場（紅）vs 敗場（綠）
   - 用途：找出「持有多久最賺 / 最賠」

### 個股分析頁底部新增「我交易過這檔」摘要

在 ActionGuide 之後新增 `MyTradeHistoryBlock`：

- 若使用者有此股的交易紀錄：顯示交易筆數、勝率、總損益、4 象限徽章
- 「市場月賠率 X.XX vs 我的交易賠率 Y.YY」對照（核心整合洞察）
- 「→ 查看 N 筆交易明細」按鈕，深度連結 `/performance?stock=2330`（過濾矩陣表）
- 若沒有交易紀錄：顯示「你尚未在績效分析中記錄這檔股票的交易」+ 引導連結

### 績效分析頁支援 `?stock=` query string 篩選

PerformancePage 接受 `?stock=2330` 參數，自動將矩陣表的篩選預設為「該股票」（非 4 象限篩選），並自動捲動到矩陣表位置。

### 範圍

- **本 change 完成**：3 張圖、雙向反向連結、市場 vs 我賠率對照
- **不在本 change**：完整診斷規則引擎（→ Change 4）、PDF / Excel 匯出（→ Change 4）

## Capabilities

### New Capabilities
- `performance-charts`：3 張視覺化圖表（累積損益、個股貢獻、持有天數分佈）
- `cross-page-trade-summary`：個股分析頁底部的「我交易過這檔」摘要 + 市場 vs 我賠率對照

### Modified Capabilities
- `performance-page-layout`：在矩陣表後插入「績效視覺化」區塊；支援 `?stock=` query string 篩選個股
- `result-first-layout`：個股分析頁支援 `?code=` 既有，新增反向連結至 `/performance?stock=`
- `stock-quadrant-matrix`：支援外部傳入 `filterStockId` prop 預設篩選特定個股

## Impact

- `src/components/charts/CumulativePnlChart.tsx`（新）：累積損益曲線
- `src/components/charts/StockContributionBar.tsx`（新）：個股貢獻長條圖
- `src/components/charts/HoldingDaysDistribution.tsx`（新）：持有天數分佈
- `src/components/trade/PerformanceCharts.tsx`（新）：3 張圖容器（可摺疊）
- `src/components/trade/MyTradeHistoryBlock.tsx`（新）：個股分析頁底部摘要
- `src/components/trade/StockQuadrantMatrix.tsx`：擴充 `filterStockId` prop
- `src/lib/trade.ts`：新增 `holdingDaysHistogram(trades): Bucket[]` utility
- `src/lib/trade.test.ts`：新增 histogram 測試
- `src/pages/PerformancePage.tsx`：插入 PerformanceCharts；支援 `?stock=` query string
- `src/pages/IndividualPage.tsx`：底部新增 `<MyTradeHistoryBlock>`，傳入 `useTradeStore` 過濾的交易
- 無 API 異動、無 store schema 異動

依賴：Recharts（已是現有依賴）。
