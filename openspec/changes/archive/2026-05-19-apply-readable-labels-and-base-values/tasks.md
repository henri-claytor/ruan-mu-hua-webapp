## 1. 命名集中表

- [x] 1.1 新增 `src/lib/labels.ts`：`METRIC_LABELS` const，含全套白話命名

## 2. EV 區塊（MultiScaleEVBlock）

- [x] 2.1 ScaleCard 結構改造：主標 18px、底層值新增（日/月平均報酬率）、評級 chip 保留
- [x] 2.2 標題「年化 EV」→「年化期望報酬率」
- [x] 2.3 副標「EV 期望值多尺度分析」→「期望報酬率多尺度分析」
- [x] 2.4 Hero 列「長期年化 EV」→「年化期望報酬率」(主結論 medium)；subtitle 「日/月 EV」→「日/月平均報酬率」
- [x] 2.5 計算步驟標題「EV」→「期望報酬率」
- [x] 2.6 stats row label「長期勝敗率與平均盈虧」→「勝敗率與平均盈虧」

## 3. VaR 區塊（IndividualPage 的 VarBlock）

- [x] 3.1 VaR 95% 標題改「95% 下行虧損」；保留小副標「VaR 95%」
- [x] 3.2 VaR 99% 同上
- [x] 3.3 新增底層值「N 筆日報酬第 K 百分位」

## 4. Monte Carlo 區塊（McBlock）

- [x] 4.1 P5 / P50 / P95 標題改「悲觀情境 / 中位情境 / 樂觀情境」
- [x] 4.2 新增底層值「μ=X% / σ=Y%」
- [x] 4.3 PortfolioPage 同步

## 5. Hurst 區塊（MultiScaleHurstBlock）

- [x] 5.1 ScaleCard 結構改造（主標 18px、底層值新增）
- [x] 5.2 標題「Hurst H」→「趨勢強度 H」
- [x] 5.3 底層值「R/S 迴歸斜率（M 點）」或單點公式 fallback
- [x] 5.4 計算步驟標題與表頭文字同步白話化

## 6. 走勢規律性 D 區塊（FractalDimensionBlock）

- [x] 6.1 ScaleDCard 新增底層值「H = X（D = 2 − H）」
- [x] 6.2 主標題 18px 放大
- [x] 6.3 計算步驟表保留現有結構

## 7. 績效卡（PortfolioPerformanceBlock 8 個 metric-card）

- [x] 7.1 「賠率」相關文字 → 「損益比」
- [x] 7.2 每張卡 MetricCard 新增 `base` prop（底層值副行）
- [x] 7.3 8 卡填入對應底層值：總投入 / 年化 / 勝場 vs 共 / 總獲利 vs 虧損 / 最長/最短 / 勝場筆數 / 敗場筆數 / Avg Gain/Loss

## 8. 訊息檔（diagnosis / recommendations）

- [x] 8.1 `diagnosis.ts`：所有「賠率」改「損益比」
- [x] 8.2 `recommendations.ts`：所有「賠率」改「損益比」
- [x] 8.3 更新 `diagnosis.test.ts` 與 `recommendations.test.ts` 文字斷言
- [x] 8.4 `buildStockDiagSummary` 同步

## 9. 比較頁 ComparePage（cmp-table）

- [x] 9.1 表頭命名替換：年化 EV → 年化期望報酬率、賠率 → 損益比、VaR → 下行虧損、Hurst → 趨勢強度

## 10. ActionGuide 與 QuadrantBadge

- [x] 10.1 ActionGuide 文案中「賠率」改「損益比」、「EV」改「期望報酬率」
- [x] 10.2 QuadrantBadge 4 個 EV quadrant 名稱：保留「高賠率正期望值（最佳）」等 4 個（因屬慣用語），但加 alias 顯示 → 暫不動命名，僅副標可補充
- [x] 10.3 QuadrantBadge large 模式副標已存在（最佳評級 / 勝率驅動 / 勝率不足 / 避免操作）— 不動

## 11. 匯出（utils/export.ts）

- [x] 11.1 摘要文字「EV」→「期望報酬率」、「賠率」→「損益比」、「VaR」→「下行虧損」、「P50」→「中位情境」

## 12. 驗證

- [x] 12.1 `npx tsc --noEmit` 通過
- [x] 12.2 `npx vitest run` 全部通過（含 diagnosis/recommendations 文字斷言更新）
- [x] 12.3 `npm run build` 通過
- [x] 12.4 瀏覽器確認 4 頁（個股 / 組合 / 績效 / 比較）：
  - 所有指標卡採新層級結構（含底層值）
  - 命名一致為白話化版本
  - PDF / Excel 匯出仍可運作
- [x] 12.5 部署 Vercel
