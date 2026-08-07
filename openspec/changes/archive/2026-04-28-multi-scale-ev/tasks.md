## 1. 計算邏輯

- [x] 1.1 在 `src/lib/ev.ts` 新增 `EVDivergence` 型別（`'stable' | 'short-improving' | 'short-deteriorating' | 'mixed'`）
- [x] 1.2 在 `src/lib/ev.ts` 新增 `ScaleEV` 介面（`{ ev: EVResult, evAnnual: number, windowSize: number, freq: 'daily' | 'monthly' }`）
- [x] 1.3 在 `src/lib/ev.ts` 新增 `MultiScaleEVResult` 介面（`{ short, medium, long, divergence }`）
- [x] 1.4 實作私有 `annualize(ev: number, periodsPerYear: number): number`：複利年化 `(1+ev)^N − 1`
- [x] 1.5 實作 `calcMultiScaleEV(monthly, daily): MultiScaleEVResult | null`：
  - `monthly.length < 60` → return null
  - 短期：`daily.slice(-60)` 算 EV → 年化 252（資料不足則 short = null）
  - 中期：`monthly.slice(-36)` 算 EV → 年化 12（資料不足則 medium = null）
  - 長期：全部 monthly 算 EV → 年化 12
- [x] 1.6 實作 `classifyEVDivergence(shortAnnual: number | null, longAnnual: number): EVDivergence`（0.05 門檻 + 0% 跨越邏輯）
- [x] 1.7 在 `src/lib/ev.test.ts` 新增測試：
  - 三尺度都有資料時回傳完整物件
  - monthly < 60 回傳 null
  - daily < 60 時 short = null
  - 各種 divergence 狀態判斷
  - annualize 公式正確（如月 1% → 年 ~12.68%）

## 2. UI 元件

- [x] 2.1 新增 `src/components/charts/MultiScaleEVBlock.tsx`：接受 `MultiScaleEVResult` 與 `monthlyCount` / `dailyCount` props
- [x] 2.2 實作狀態判讀橫幅：依 divergence 對應四種文案
  - `stable`：「三尺度一致，狀態穩定」（無警示色）
  - `short-deteriorating`：「⚠ 短期動能轉弱：短期年化 EV 顯著低於長期」（amber 警示）
  - `short-improving`：「⚠ 短期動能轉強：短期年化 EV 顯著高於長期」（green 強化）
  - `mixed`：「三尺度有差異，狀態觀察中」（一般資訊）
- [x] 2.3 實作三卡片並列 grid：年化 EV（小數 2 位 +%）、quadrant 解讀文字、樣本量；資料不足顯示「資料不足」
- [x] 2.4 短期卡片下方加「樣本較小，年化誤差較大」提示文字
- [x] 2.5 Hero 列：以「長期年化 EV」為主數字 emphasis="hero" + QuadrantBadge size="large"（依長期 quadrant）+ 賠率優勢結論（依長期 actualOdds vs breakEvenOdds）
- [x] 2.6 計算步驟摺疊區塊：使用 Disclosure，預設收合；展開後顯示三組「單期 EV → 年化轉換」公式

## 3. 整合

- [x] 3.1 IndividualPage：將 `import { calcEV }` 改為 `import { calcMultiScaleEV }`，`results` 型別中 `ev: EVResult` 改為 `evMulti: MultiScaleEVResult | null`
- [x] 3.2 IndividualPage：在 `handleSelect` 中呼叫 `calcMultiScaleEV(monthly, daily)` 取代 `calcEV(monthly)`
- [x] 3.3 IndividualPage：將原 `<EVBlock>` 替換為 `<MultiScaleEVBlock>`；`evMulti === null` 時改顯示「月報酬資料不足 5 年」說明列
- [x] 3.4 IndividualPage：移除原 `EVBlock` 函式（不再使用）
- [x] 3.5 ActionGuide：`IndividualSignals` 新增 `evDivergence?: EVDivergence`；`buildIndividualGuide` 新增 short-improving / short-deteriorating 兩條規則訊息
- [x] 3.6 IndividualPage：呼叫 `buildIndividualGuide` 時改用 `results.evMulti?.long.ev.ev ?? 0` 作為 ev 訊號，並傳入 `evDivergence: results.evMulti?.divergence`
- [x] 3.7 IndividualPage：複製摘要 `buildIndividualSummary` 改用長期 EV 結果（保留現有摘要格式不變）

## 4. 報酬率色彩與符號慣例

- [x] 4a.1 在 `src/lib/utils.ts`（或新增 `src/utils/format.ts`）新增 `fmtPct(n, digits=2): string`：永遠帶正負號（`+0.47%` / `−5.59%` / `0.00%`）
- [x] 4a.2 新增 `colorByReturn(n): 'red' | 'green' | 'default'`：正→紅、負→綠、0→default
- [x] 4a.3 IndividualPage：所有報酬率顯示位置改用 `fmtPct` + `colorByReturn`：
  - EV Hero（多尺度長期 / 中期 / 短期年化）
  - Avg Gain（紅）/ Avg Loss（顯示時補回負號 + 綠）
  - VaR 95% / VaR 99% Hero 與卡片
  - VaR Hero 的副標「有 X% 機率虧損超過 Y%」中 Y 為絕對值（不變）
- [x] 4a.4 PortfolioPage：同樣套用（組合 EV、組合 VaR）
- [x] 4a.5 ComparePage：報酬率欄位（EV、VaR）數值套用 `fmtPct`
- [x] 4a.6 MultiScaleEVBlock：三卡片年化 EV 套用 `fmtPct` + `colorByReturn`
- [x] 4a.7 確認非報酬率欄位（勝率、敗率、Hurst H、MC 金額、風險等級）色彩維持原樣

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 通過
- [x] 5.2 `npx vitest run` 全部通過（含新增 ev.test.ts + utils.test.ts）
- [x] 5.3 在瀏覽器確認：
  - 多數股票（月 ≥ 60 筆 + 日 ≥ 60 筆）顯示三卡片 + Hero 列
  - 月報酬不足 60 筆股票顯示降級說明
  - divergence 在不同股票上能切換出 short-deteriorating / short-improving / stable
  - 計算步驟展開能看到三組年化轉換
  - 正報酬顯示為 `+X.XX%` 紅色、負報酬顯示為 `−X.XX%` 綠色
  - 勝率/敗率/Hurst/MC 金額/風險等級色彩不變
- [x] 5.4 ActionGuide 在 short-deteriorating / short-improving 時顯示對應建議
- [x] 5.5 部署到 Vercel
