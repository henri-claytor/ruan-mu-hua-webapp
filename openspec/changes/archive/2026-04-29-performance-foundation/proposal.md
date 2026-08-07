# Proposal: 績效分析頁基礎建設

## Why

目前 web-app 的 4 個分析頁面（個股 / 組合 / 比較）都屬於「**進場前評估**」——基於 CMoney 市場資料計算 EV、VaR、Hurst、MC 等預期指標，回答「這檔股票該不該買」的問題。

但投資是一個閉環：選股 → 進場 → 持有 → 出場 → 反思。目前缺少**「出場後反思」**這一段——使用者無法看到自己過去交易的成績單，無法知道：

- 我的勝率、賠率、獲利因子如何？
- 哪些股票打法有效、哪些是憑運氣？
- 我的最大回撤多大？停損紀律好不好？

這個 change 是**第一個績效分析頁**（Phase 1 of 4 changes），補完整個閉環，並建立後續 changes 的資料模型與基礎建設。

## What Changes

### 新增 `/performance` 頁面與導覽項目

- NavBar 新增第 5 個項目「績效分析」
- 新頁面 `src/pages/PerformancePage.tsx`

### 資料輸入：手動輸入 + CSV 上傳

- **手動輸入**：表格化新增 / 編輯 / 刪除每筆交易
- **CSV 上傳**：通用 CSV 格式（13 欄）一次匯入多筆
- 兩種模式可共存（先輸入幾筆 → 再上傳補齊）

### 資料模型與本機儲存

- `Trade` interface：13 個必要欄位（含 buy/sell 日期金額股數 P&L 等）
- `useTradeStore` zustand store + persist（**僅本機儲存，不上傳雲端**；明確 UI 提示）
- 後端持久化 API 留給未來 change

### 整體核心指標 Dashboard

依「進場前」頁面相同的視覺層次（Hero / Normal / Muted）呈現：

- **Hero 列**：總實現損益（金額）+ 整體報酬率 + 4 象限結論徽章（基於賠率 × 獲利因子）
- **中層卡片**：勝率、賠率（損益比）、獲利因子、期望值、平均持有天數
- **弱化細節 inline**：總交易筆數、勝場數、敗場數、平均獲利金額、平均虧損金額、最大單筆獲利、最大單筆虧損、最大回撤金額/比例

### 原始交易表格

- 顯示所有交易，預設依 sell_date 倒序
- 欄位：股票、買入日、賣出日、持有天數、買入價、賣出價、股數、損益、報酬率
- 可逐筆編輯與刪除

### 視覺與命名延續既有設計

- 重用 `ResultCard`、`QuadrantBadge`、`fmtPct`、`colorByReturn`、`Disclosure` 模式
- 報酬率欄位套用台股紅漲綠跌
- Hero 列以「結論優先」呈現

## Capabilities

### New Capabilities
- `trade-history`：交易紀錄資料模型、輸入、儲存、原始表格顯示
- `portfolio-performance-metrics`：整體組合績效核心指標計算（勝率、賠率、獲利因子、期望值、最大回撤、年化報酬率）
- `performance-page-layout`：績效分析頁的視覺結構與資訊架構

### Modified Capabilities
- `result-first-layout`：NavBar 新增「績效分析」項目，導覽結構由 4 項變 5 項

## Impact

- `src/components/NavBar.tsx`：新增第 5 個導覽項目「績效分析」
- `src/components/icons.tsx`：新增 ClipboardCheck（或類似）icon
- `src/App.tsx`：新增 `/performance` 路由
- `src/pages/PerformancePage.tsx`（新）：頁面主體
- `src/lib/trade.ts`（新）：`Trade` 介面、`PortfolioPerformance` 介面、核心指標計算函式
- `src/lib/trade.test.ts`（新）：單元測試（勝率、賠率、獲利因子、最大回撤、年化）
- `src/lib/csv.ts`（新）：CSV 解析 utility
- `src/store/useTradeStore.ts`（新）：trades 的 zustand store + persist
- `src/components/trade/TradeInputTable.tsx`（新）：手動輸入表格
- `src/components/trade/TradeFileUpload.tsx`（新）：CSV 上傳元件
- `src/components/trade/PortfolioPerformanceBlock.tsx`（新）：整體 Hero 列 + 指標卡片
- `src/components/trade/RawTradeTable.tsx`（新）：原始交易明細表格

無 API 異動、無外部依賴新增（CSV 解析自行實作）、無 build config 異動。
