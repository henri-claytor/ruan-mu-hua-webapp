## 1. 對比計算邏輯

- [x] 1.1 新增 `src/lib/comparison.ts`，定義型別 `EVAlignment = 'aligned' | 'opposed' | 'na'`、`VaRComparison = 'higher-risk' | 'lower-risk' | 'similar' | 'na'`、`OverallVerdict = '一致' | '部分對立' | '全對立' | '資料不足'`
- [x] 1.2 實作 `compareEV(stockEV: number | null, portfolioEV: number): EVAlignment`（同號邏輯）
- [x] 1.3 實作 `compareVaR(stockVaR: number, portfolioVaR: number): VaRComparison`（1.1 / 0.9 倍門檻）
- [x] 1.4 實作 `compareHurstCategory(stockH: number | null, portfolioH: number): EVAlignment`（依類別 trending / random / mean-reverting）
- [x] 1.5 實作 `getOverallVerdict(alignments: EVAlignment[]): OverallVerdict`（依 ✓ 與 ⚠ 數量）
- [x] 1.6 新增 `src/lib/comparison.test.ts`：每個對比函式的觸發場景單元測試（同號/異號/邊界/na）

## 2. 對比子表元件

- [x] 2.1 新增 `src/components/trade/EVComparisonTable.tsx`：
  - 接收 `portfolioEV: MultiScaleEVResult` 與 `stockComparisons: { stockId, stockName, weight, ev: MultiScaleEVResult | null }[]`
  - 第一列「組合（基準）」高亮（bg-elevated）
  - 每股一列：三尺度年化 EV（紅漲綠跌數字）+ ✓/⚠/— 對比符號
  - 最右側 badge 顯示整體結論
- [x] 2.2 新增 `src/components/trade/VaRComparisonTable.tsx`：
  - 接收 portfolio 與每股的 VaR95 / VaR99
  - 對比符號 ⬆ / ⬇ / ≈
  - 整體結論：「拉高風險」/「降低風險」/「接近組合」/「混合」
- [x] 2.3 新增 `src/components/trade/HurstComparisonTable.tsx`：
  - 接收 portfolio 與每股的 MultiScaleHurstResult
  - 顯示三尺度 H 值 + 類別標籤（趨勢/隨機/回歸）+ ✓/⚠/— 對比符號
  - 整體結論

## 3. 主元件 + Tab 切換

- [x] 3.1 新增 `src/components/trade/StockVsPortfolioComparison.tsx`：
  - SectionBlock 標題「個股 vs 組合對比」+ 副標
  - 簡單 Tab 切換（EV / VaR / Hurst）
  - 預設選中 EV
- [x] 3.2 Tab 標籤旁顯示對比結論摘要計數（如「VaR：1 拉高 / 1 接近 / 1 降低」）

## 4. PortfolioPage 整合

- [x] 4.1 在 PortfolioPage 計算 `stockComparisons`：對每股 useMemo 計算 `calcMultiScaleEV` / `calcVaR` / `calcMultiScaleHurst`
- [x] 4.2 在 `<MultiScaleEVBlock>` 之後、VaR 區塊之前插入 `<StockVsPortfolioComparison ... />`
- [x] 4.3 顯示條件：`evMulti && varResult` 都存在時才渲染

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 通過
- [x] 5.2 `npx vitest run` 全部通過（含新增 comparison 測試）
- [x] 5.3 `npm run build` 通過
- [x] 5.4 在瀏覽器確認：
  - 對比區塊顯示在 EV 之後、VaR 之前
  - Tab 切換 EV / VaR / Hurst 正常
  - 組合列為高亮基準
  - 對比符號 ✓/⚠/—、⬆/⬇/≈ 顏色正確
  - 整體結論 badge 對應正確規則
  - 部分股票資料不足時 — 與「資料不足」標籤正確顯示
- [x] 5.5 部署到 Vercel
