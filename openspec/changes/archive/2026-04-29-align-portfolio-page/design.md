# Design: 組合頁與個股頁功能對齊

## Context

個股頁已升級到完整的多尺度功能（multi-scale-ev、multi-scale-hurst、hurst-rs-regression、analysis-visual-hierarchy 等多個 changes），組合頁卻還停留在這些升級之前的單尺度版本。本 change 把組合頁全部對齊到個股頁。

## Goals / Non-Goals

**Goals:**
- 組合頁 4 個分析區塊與個股頁完全一致（除已決定不做的 MyTradeHistoryBlock）
- 重用既有元件（MultiScaleEVBlock / MultiScaleHurstBlock）而非各自實作
- 新增 `calcPortfolioMultiScaleEV` 計算函式（複用既有 `calcMultiScaleEV` 與 `calcPortfolioReturns`）
- Hurst 多尺度 + 單尺度雙模式（資料夠就多尺度，不足 fallback 單尺度）

**Non-Goals:**
- 不做反向跨頁連結（組合 vs 個別股票邏輯不對應）
- 不調整 4 象限門檻（沿用個股頁同一套）
- 不動個股頁、ComparePage

## Decisions

### D1 — 組合多尺度 EV 計算策略：重用 `calcMultiScaleEV`

**決策**：

```typescript
export function calcPortfolioMultiScaleEV(
  stockMonthlyArrays: number[][],
  stockDailyArrays: number[][],
  weights: number[],
): MultiScaleEVResult | null {
  // 1. 加權組合月報酬（用既有 calcPortfolioReturns）
  const weightedMonthly = calcPortfolioReturns(stockMonthlyArrays, weights)
  if (weightedMonthly.length < 60) return null  // 對齊既有 calcMultiScaleEV 邏輯

  // 2. 加權組合日報酬：只取所有股票都有 ≥ 60 日的尾段
  const allHaveSixtyDaily = stockDailyArrays.every((d) => d.length >= 60)
  const weightedDaily60 = allHaveSixtyDaily
    ? calcPortfolioReturns(stockDailyArrays.map((d) => d.slice(-60)), weights)
    : []

  // 3. 用既有 calcMultiScaleEV 計算（內部會處理 short=null when daily<60）
  return calcMultiScaleEV(weightedMonthly, weightedDaily60)
}
```

**理由**：
- 100% 重用既有 `calcMultiScaleEV` 邏輯，避免重複實作
- `calcPortfolioReturns` 已存在（既有組合月報酬計算），同樣方法用於日報酬
- weightedDaily60 只取尾 60 筆，因為個股頁的 short 也是用 daily.slice(-60)，等於提前對齊

**邊界**：
- weightedMonthly < 60 → 回傳 null（與個股一致）
- 任一股票日報酬 < 60 → weightedDaily60 為空 → 個股 calcMultiScaleEV 內部自動 short = null（用戶選擇 A）

### D2 — 組合多尺度 Hurst 與 Fallback 策略

**決策**：

```typescript
// 條件 A：所有股票日報酬 ≥ 240
const allHave240Daily = stocks.every((s) => s.dailyReturns.length >= 240)
const weightedDaily240 = allHave240Daily
  ? calcPortfolioReturns(stocks.map((s) => s.dailyReturns.slice(-240)), weights)
  : null

// 多尺度（資料夠時）
const hurstMulti = weightedDaily240 ? calcMultiScaleHurst(weightedDaily240) : null

// 單尺度 fallback（資料不夠時，沿用既有行為）
const hurstSingle = !hurstMulti && portForRisk.length >= 10
  ? calcHurst(portForRisk)
  : null
```

**UI 路由**：
- `hurstMulti` 存在 → 顯示 `<MultiScaleHurstBlock />`（含 title 前綴「組合」）
- 否則若 `hurstSingle` 存在 → 顯示既有 `<PortfolioHurstBlock />`（含 freq 標籤、stocksLackingDaily）
- 都沒有 → 不顯示 Hurst 區塊

**理由**：
- 多尺度需要至少 240 個交易日（約 1 年），組合所有股票都要有
- 不少組合會包含新上市股票或 ETF，無法都到 240 → fallback 單尺度才不會「資料不足就沒 Hurst」
- 既有單尺度仍支援月頻 fallback（如使用者組合包含日頻不足的股票），語意一致

### D3 — `MultiScaleEVBlock` 與 `MultiScaleHurstBlock` 增加 title/subtitle override

**決策**：兩個元件都加可選 props：

```typescript
interface Props {
  result: MultiScaleEVResult        // (or MultiScaleHurstResult)
  monthlyCount: number
  dailyCount: number
  // 新增：可選覆寫
  titleOverride?: string
  subtitlePrefixOverride?: string   // 接在頻率標注前
}
```

組合頁傳入：
- `titleOverride="組合期望報酬與賠率優勢"` / `"組合趨勢延續性偵測"`
- `subtitlePrefixOverride="EV 期望值多尺度分析"`（與個股原本一致），副標含「使用組合月報酬 N 筆 + 日報酬 N 筆」

**理由**：
- 不破壞個股既有用法（無 override 時行為不變）
- 比建立新元件 PortfolioMultiScaleEVBlock 簡單 50%

**替代方案考慮**：
- 完全 i18n 化（傳入所有文字）：過度設計，目前只需要 title 前綴
- 包一層 wrapper：仍要轉發其他 prop，沒比 override 簡單

### D4 — ActionGuide 訊號擴充

**決策**：`PortfolioSignals` 介面擴充：

```typescript
export interface PortfolioSignals {
  ev: number
  varLevel: VarLevel
  hurstH: number | null
  stockCount: number
  // 新增
  evDivergence?: EVDivergence
  hurstDivergence?: Divergence
}
```

`buildPortfolioGuide` 新增規則：

```typescript
if (s.evDivergence === 'short-deteriorating') {
  items.push('⚠ 組合短期年化 EV 顯著低於長期，近期表現轉弱')
}
if (s.evDivergence === 'short-improving') {
  items.push('⚠ 組合短期年化 EV 顯著高於長期，動能轉強')
}
if (s.hurstDivergence === 'short-weakening') {
  items.push('⚠ 組合短期 H 顯著低於長期，趨勢動能可能轉弱')
}
if (s.hurstDivergence === 'short-strengthening') {
  items.push('⚠ 組合短期 H 顯著高於長期，動能轉強')
}
```

**理由**：
- 與個股 `buildIndividualGuide` 對稱
- 訊息明確標示「組合」字樣，避免使用者誤以為是個股訊號

### D5 — 取代既有 `PortfolioEVBlock`

**決策**：直接刪除 `PortfolioEVBlock` 子元件，改用 `MultiScaleEVBlock` 並傳入 override。

```jsx
{evMulti ? (
  <MultiScaleEVBlock
    result={evMulti}
    monthlyCount={portMonthly.length}
    dailyCount={portDailyTotal}
    titleOverride="組合期望報酬與賠率優勢"
  />
) : (
  <div className="bg-elevated...">月報酬資料不足 60 筆，無法使用多尺度 EV</div>
)}
```

**Hero 列**：MultiScaleEVBlock 內部已有 Hero（長期年化 EV + 4 象限徽章 + 賠率優勢結論），組合自然繼承。

**基礎統計**：MultiScaleEVBlock 內部有「長期勝敗率與平均盈虧」inline 行 + 計算步驟摺疊，組合自然繼承（個股是「長期月頻」，組合也是「長期組合月頻」，語意一致）。

**dailyCount**：組合的「日報酬筆數」需要思考——個股是單一股票的日報酬數量，組合是「最短日報酬數」？決定為 `Math.min(...stocks.map((s) => s.dailyReturns.length))`，副標顯示「使用組合月報酬 N 筆 + 日報酬最少 M 筆」。

### D6 — MC μ 套用紅漲綠跌

**決策**：`PortfolioMcBlock` 中 μ 顯示改為與個股一致：

```jsx
μ（月均報酬）<span className={`font-semibold ${mcResult.mu > 0 ? 'text-red-700' : mcResult.mu < 0 ? 'text-green-700' : 'text-main'}`}>
  {fmtPct(mcResult.mu, 4)}
</span>
```

**理由**：紅漲綠跌慣例擴及 μ 此一報酬率欄位，與個股頁完全對齊。

## Risks / Trade-offs

- **`calcPortfolioMultiScaleEV` 中 weightedDaily60 是 60 元素**：傳給 `calcMultiScaleEV` 後 short 會用 `daily.slice(-60)` = 全部 60 筆。✓ 沒問題
- **組合的 dailyCount 副標如何顯示**：用「最少日報酬筆數」可能誤導（如某股 60 筆、其他 252 筆，副標寫「最少 60 筆」會讓人以為組合質量差） → 緩解：副標明確寫「使用組合月報酬 N 筆 + 日報酬（短期窗口取所有股票最近 60 日）」
- **多尺度 Hurst 需要所有股票 ≥ 240 才能用**：很多組合會 fallback → 接受。fallback 單尺度仍有 Hurst 解讀，比沒 Hurst 好
- **MultiScaleEVBlock title 寫死「期望報酬與賠率優勢」**：override 後變組合版，但既有「長期勝敗率與平均盈虧（月頻）」副區段也是寫死「月頻」，這在組合頁仍然合適（組合長期都是月頻）→ 不需特別處理
- **`PortfolioMultiScaleHurst` 需要新建嗎？**：不需要。直接用 MultiScaleHurstBlock + titleOverride。MultiScaleHurstBlock 內部「短/中/長」標籤、計算步驟邏輯都通用
- **資料不足 fallback 邏輯複雜化**：兩種模式同存（多尺度 + 單尺度）增加 PortfolioPage 的判斷分支 → 接受。每分支僅多 4–5 行，可讀性還可以
