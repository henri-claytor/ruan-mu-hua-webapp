## 1. 計算邏輯

- [x] 1.1 在 `src/lib/hurst.ts` 新增 `Divergence` 型別（`'stable' | 'short-weakening' | 'short-strengthening' | 'mixed'`）
- [x] 1.2 在 `src/lib/hurst.ts` 新增 `MultiScaleHurstResult` 型別：`{ short: HurstResult, medium: HurstResult, long: HurstResult, divergence: Divergence }`
- [x] 1.3 實作 `calcMultiScaleHurst(dailyReturns: number[]): MultiScaleHurstResult | null`，內部呼叫既有 `calcHurst()` 三次（窗口分別為 last 60 / 120 / 240）；若 `dailyReturns.length < 240` 直接回傳 `null`
- [x] 1.4 實作 `classifyDivergence(short: number, long: number): Divergence`（0.10 門檻 + 0.5 中性線跨越邏輯）
- [x] 1.5 在 `src/lib/hurst.test.ts` 新增 divergence 判斷單元測試（涵蓋四種狀態 stable / short-weakening / short-strengthening / mixed）
- [x] 1.6 在 `src/lib/hurst.test.ts` 新增「資料不足回傳 null」測試（239 筆 → null；240 筆 → 三尺度都成功）

## 2. UI 元件

- [x] 2.1 新增 `src/components/charts/MultiScaleHurstBlock.tsx`：接受 `MultiScaleHurstResult` props
- [x] 2.2 實作三卡片並列 grid：「短期 60日 / 中期 120日 / 長期 240日」，每張顯示 H 值、解讀（趨勢/中性/均值回歸）、配色
- [x] 2.3 短期卡片下方加「樣本較小，誤差較大」提示文字
- [x] 2.4 實作狀態判讀橫幅：依 divergence 對應四種文案
  - `stable`：「三尺度一致，狀態穩定」（無警示色）
  - `short-weakening`：「⚠ 短期偏離長期：趨勢可能正在減弱」（amber 警示）
  - `short-strengthening`：「⚠ 短期偏離長期：動能轉強」(amber 警示）
  - `mixed`：「三尺度有差異，狀態觀察中」（一般資訊）
- [x] 2.5 嵌入既有 `HurstLineChart`，僅以長期窗口（240日）的 `cumDeviations` 繪製，標題標注「長期窗口（240日）」
- [x] 2.6 嵌入計算步驟摺疊區塊，顯示長期窗口的 μ / R / S / H 公式（沿用既有 `HurstBlock` 內部結構）

## 3. 整合

- [x] 3.1 IndividualPage：將 `import { calcHurst }` 改為 `import { calcMultiScaleHurst }`，`results.hurst` 型別由 `HurstResult | null` 改為 `MultiScaleHurstResult | null`
- [x] 3.2 IndividualPage：將原 `<HurstBlock>` 替換為 `<MultiScaleHurstBlock>`；`results.hurst === null` 時改顯示「日報酬資料不足 240 筆」說明列
- [x] 3.3 IndividualPage：移除原 `HurstBlock` 函式（不再被使用）
- [x] 3.4 ActionGuide：`IndividualSignals` 新增 `hurstDivergence?: Divergence`；`buildIndividualGuide` 改用「短期 H」做 Hurst 解讀規則
- [x] 3.5 ActionGuide：`buildIndividualGuide` 新增 `short-weakening` / `short-strengthening` 兩條規則訊息
- [x] 3.6 IndividualPage：呼叫 `buildIndividualGuide` 時傳入 `hurstDivergence: results.hurst?.divergence` 與 `hurstH: results.hurst?.short.h ?? null`

## 4. 驗證

- [x] 4.1 `npx tsc --noEmit` 通過
- [x] 4.2 `npm test` 通過（5 test files, 48 tests）
- [ ] 4.3 在瀏覽器確認：
  - 日報酬 ≥ 240 筆股票：三卡片排版正確、狀態橫幅依 divergence 切換
  - 日報酬 < 240 筆股票：顯示「資料不足」說明列、不渲染元件
- [ ] 4.4 ActionGuide 在 short-weakening / short-strengthening 時顯示對應建議
