## 1. Diagnosis 引擎擴充

- [x] 1.1 `src/lib/diagnosis.ts`：`DiagnosisLevel` 加 `'advantage'`
- [x] 1.2 在 `LEVEL_ORDER` 中將 advantage 設為 0（最前）
- [x] 1.3 新增 `diagnoseAdvantages(performance): Diagnosis[]`，涵蓋 6 條規則：
  - `adv-profit-factor-strong`：profitFactor > 4
  - `adv-balanced-win-payoff`：winRate ≥ 0.7 且 payoffRatio ≥ 1.5
  - `adv-high-win-rate`：winRate ≥ 0.8（且未觸發 balanced）
  - `adv-strong-payoff`：payoffRatio ≥ 2.5（且未觸發 balanced）
  - `adv-positive-ev`：expectedValue > 0 且 nTrades ≥ 10（且未觸發 PF/balanced）
  - `adv-low-drawdown`：maxDrawdownPct > −0.05
- [x] 1.4 `diagnose()` 主函式中先呼叫 `diagnoseAdvantages` 再 push 既有負面規則
- [x] 1.5 在 `src/lib/diagnosis.test.ts` 新增 6 條優勢規則測試 + 互斥邏輯測試

## 2. RecommendationPanel 邏輯

- [x] 2.1 新增 `src/lib/recommendations.ts`：定義 `Recommendation` 介面與 `buildRecommendations(diagnoses, stocks, performance): Recommendation[]`
- [x] 2.2 實作聚合規則：
  - 停損紀律問題（聚合 `stock-all-loss-3plus` + `stop-loss-discipline`，priority 1）
  - 個股賠率問題（每股一條，priority 2）
  - 個股資金管理（每股一條，priority 3）
  - 集中度（priority 4）
  - 固定條目「追蹤更多績效指標」（priority 9）
- [x] 2.3 訊息含具體個股名稱、賠率、PF、貢獻百分比等數據
- [x] 2.4 結果依 priority 升序排列
- [x] 2.5 新增 `src/lib/recommendations.test.ts`：每條規則的觸發場景測試

## 3. DiagnosisPanel 雙軸改造

- [x] 3.1 `src/components/trade/DiagnosisPanel.tsx`：拆分為兩欄
  - 左欄 `<div>`：advantage 條目（綠色基調）
  - 右欄 `<div>`：alert / warning / note / info（既有配色）
- [x] 3.2 桌機 `grid-cols-2`，手機 `grid-cols-1`（左欄在上）
- [x] 3.3 標題下方摘要含「N 優勢 / X 警示 / Y 注意 / Z 資訊」
- [x] 3.4 沒有任何 advantage → 左欄顯示「持續累積交易紀錄以建立優勢視角」
- [x] 3.5 沒有任何 risk → 右欄綠色 banner「✓ 暫無需要關注的問題」
- [x] 3.6 兩邊都空 → 整個 Panel 不渲染

## 4. RecommendationPanel 元件

- [x] 4.1 新增 `src/components/trade/RecommendationPanel.tsx`：
  - SectionBlock 標題「重點建議」+ 副標
  - 條列：每條左側圓形編號徽章（藍底白字）+ 右側 `<h4>` 標題 + `<p>` body
  - 外層 div 含 `id="performance-recommendations"` 供 PDF 匯出
- [x] 4.2 trades.length === 0 時不渲染

## 5. PerformancePage 整合

- [x] 5.1 在 PerformancePage 計算 `const recommendations = useMemo(() => buildRecommendations(diagnoses, stockStats, performance), [...])`
- [x] 5.2 在 DiagnosisPanel 之後、StockQuadrantMatrix 之前插入 `<RecommendationPanel recommendations={recommendations} />`
- [x] 5.3 確認 `<DiagnosisPanel>` 改造後仍正常渲染

## 6. PDF 匯出整合

- [x] 6.1 `PerformancePage` 的 `PDF_SECTION_IDS` 加入 `'performance-recommendations'`
- [x] 6.2 順序：banner / dashboard / diagnosis / **recommendations** / matrix / charts / trades

## 7. 驗證

- [x] 7.1 `npx tsc --noEmit` 通過
- [x] 7.2 `npx vitest run` 全部通過（含新增優勢規則 + recommendation 測試）
- [x] 7.3 `npm run build` 通過
- [x] 7.4 在瀏覽器確認：
  - DiagnosisPanel 顯示雙軸結構（優勢綠色 / 風險其他色）
  - 觸發各條優勢規則時都顯示在左欄
  - RecommendationPanel 編號式顯示，含特定個股建議
  - PDF 匯出包含 RecommendationPanel
- [x] 7.5 部署到 Vercel
