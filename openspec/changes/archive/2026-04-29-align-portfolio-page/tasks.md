## 1. 計算邏輯

- [x] 1.1 在 `src/lib/ev.ts` 新增 `calcPortfolioMultiScaleEV(stockMonthlyArrays, stockDailyArrays, weights): MultiScaleEVResult | null`
- [x] 1.2 內部用 `calcPortfolioReturns` + `calcMultiScaleEV` 組合（不重新實作）
- [x] 1.3 處理邊界：weightedMonthly < 60 → null；任一股票日報酬 < 60 → weightedDaily60 為空 → short=null
- [x] 1.4 在 `src/lib/ev.test.ts` 新增測試：
  - 月報酬 < 60 → null
  - 部分股票日報酬不足 → short = null
  - 所有資料充足 → 三尺度都有結果
  - 加權報酬計算正確（用簡單可驗證的兩股 50/50 case）

## 2. 共用元件擴充

- [x] 2.1 `MultiScaleEVBlock`：新增 `titleOverride?: string` 可選 prop；其他渲染邏輯不變
- [x] 2.2 `MultiScaleHurstBlock`：新增 `titleOverride?: string` 可選 prop

## 3. ActionGuide 訊號擴充

- [x] 3.1 `PortfolioSignals` 介面新增 `evDivergence?: EVDivergence` 與 `hurstDivergence?: Divergence`
- [x] 3.2 `buildPortfolioGuide` 新增 4 條規則訊息（短期動能轉弱 / 轉強 + Hurst 短期偏弱 / 轉強）
- [x] 3.3 訊息明確標示「組合」字樣

## 4. PortfolioPage 整合

- [x] 4.1 移除既有 `PortfolioEVBlock` 子元件（不再需要）
- [x] 4.2 計算 `evMulti = calcPortfolioMultiScaleEV(stockMonthly, stockDaily, weights)`
- [x] 4.3 計算 `dailyCount = Math.min(...stocks.map(s => s.dailyReturns.length))` 用於 MultiScaleEVBlock dailyCount prop
- [x] 4.4 EV 區塊：evMulti 存在 → `<MultiScaleEVBlock titleOverride="組合期望報酬與賠率優勢" />`；不存在 → 顯示「組合月報酬資料不足 5 年」說明
- [x] 4.5 計算 `allHave240Daily` 與 `weightedDaily240`
- [x] 4.6 計算 `hurstMulti = calcMultiScaleHurst(weightedDaily240)` 或 null
- [x] 4.7 Hurst 區塊：hurstMulti 存在 → `<MultiScaleHurstBlock titleOverride="組合趨勢延續性偵測" />`；否則 hurstSingle 存在 → 既有 `<PortfolioHurstBlock />`；都無 → 不渲染
- [x] 4.8 ActionGuide 傳入 evDivergence 與 hurstDivergence（從 evMulti.divergence、hurstMulti?.divergence 取）
- [x] 4.9 MC μ 顯示套用 `fmtPct + colorByReturn`（與個股一致）

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 通過
- [x] 5.2 `npx vitest run` 全部通過（含新增 calcPortfolioMultiScaleEV 測試）
- [x] 5.3 `npm run build` 通過
- [x] 5.4 在瀏覽器確認：
  - 組合頁 EV 區塊顯示「組合期望報酬與賠率優勢」標題 + Hero + 4 象限徽章 + 賠率優勢結論
  - 三尺度卡片正常顯示（短/中/長）
  - 計算步驟可摺疊
  - Hurst 區塊：兩種情境（資料夠 → 多尺度；資料不夠 → 單尺度）切換正常
  - ActionGuide 在不同 divergence 觸發時顯示對應訊息
  - MC μ 顯示為紅漲綠跌
- [x] 5.5 部署到 Vercel
