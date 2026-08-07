# Design: 個股頁手動查詢 + 多尺度 EV 重做

## Context

個股頁 3 項調整，皆與「使用者操作流」與「資訊優先級」相關：
- 自動取資料 → 手動查詢：給予使用者確認的機會
- 下拉清單滾動：解決可用性問題
- 多尺度 EV：把抽象的「短/中/長」改為具體時段、區分主要 vs 參考

## Goals / Non-Goals

**Goals:**
- 個股頁查詢手動觸發（StockSelector 選股 → 按「查詢」才執行）
- StockSelector 下拉清單可滾動（max-h + overflow-y-auto）
- 多尺度 EV 改為「3 個月 / 1 年 / 5 年」三段，前兩段為主要判斷、第三段為參考
- 視覺權重在前兩段與第三段之間明顯區分

**Non-Goals:**
- 不動 VaR / Hurst / 蒙地卡羅
- 不動組合頁的多尺度 EV（後續另一 change）
- 不改紅漲綠跌、不改公式
- 不改 API 端點

## Decisions

### D1 — 多尺度 EV 計算窗口重定義

**決策**：

| 順序 | 期間（標題） | 計算窗口 | 頻率 | 角色 |
|------|------------|---------|-----|------|
| 1 | 最近 3 個月 | 60 | 日報酬 | 主要判斷 |
| 2 | 最近 1 年 | 240 | 日報酬 | 主要判斷 |
| 3 | 最近 5 年（參考） | 60 | 月報酬 | 參考用 |

**`ScaleEV` 介面擴充**：

```typescript
interface ScaleEV {
  ev: EVResult
  evAnnual: number
  windowSize: number
  freq: 'daily' | 'monthly'
  /** 「主要判斷」或「參考」— 用於 UI 視覺權重 */
  tier: 'primary' | 'reference'
  /** 顯示用標題（如「最近 3 個月」）*/
  label: string
}
```

**`calcMultiScaleEV()` 行為**：

```typescript
function calcMultiScaleEV(monthly, daily): MultiScaleEVResult {
  const m3 = daily.length >= 60
    ? buildScale(daily.slice(-60), 'daily', 252, 'primary', '最近 3 個月')
    : null
  const y1 = daily.length >= 240
    ? buildScale(daily.slice(-240), 'daily', 252, 'primary', '最近 1 年')
    : null
  const y5 = monthly.length >= 60
    ? buildScale(monthly.slice(-60), 'monthly', 12, 'reference', '最近 5 年')
    : null
  return { short: m3, medium: y1, long: y5, divergence: ... }
}
```

**理由**：
- key 名稱 `short / medium / long` 維持向後相容（PortfolioPage 也用），只是內部窗口與標籤改了
- 年化期數（periods）：日 → 252、月 → 12（不變）

### D2 — Divergence 判讀只看前兩個尺度

**決策**：

```typescript
function judgeDivergence(short: ScaleEV | null, medium: ScaleEV | null): EVDivergence {
  // 只看主要判斷（最近 3 個月、最近 1 年），長期 5 年僅供參考
  if (!short || !medium) return 'stable'  // 資料不足直接回 stable

  const evAnnualShort = short.evAnnual
  const evAnnualMedium = medium.evAnnual

  // 同號 + 偏離 < 30% → stable
  const sameSign = (evAnnualShort > 0 && evAnnualMedium > 0) || (evAnnualShort < 0 && evAnnualMedium < 0)
  const denom = Math.max(Math.abs(evAnnualShort), Math.abs(evAnnualMedium))
  const gap = denom > 0 ? Math.abs(evAnnualShort - evAnnualMedium) / denom : 0

  if (sameSign && gap < 0.3) return 'stable'

  // 近期顯著低於中期 → short-deteriorating
  if (evAnnualShort < evAnnualMedium && gap > 0.3) return 'short-deteriorating'
  if (evAnnualShort > evAnnualMedium && gap > 0.3) return 'short-improving'
  return 'mixed'
}
```

**Banner 文字微調**：

| divergence | 新文字 |
|-----------|-------|
| stable | 「近 3 個月與近 1 年趨勢一致」 |
| mixed | 「近 3 個月與近 1 年趨勢有差異」 |
| short-improving | 「⚠ 短期動能轉強：近 3 個月年化 EV 顯著高於近 1 年」 |
| short-deteriorating | 「⚠ 短期動能轉弱：近 3 個月年化 EV 顯著低於近 1 年」 |

### D3 — 三卡視覺權重區分

**決策**：

```
┌────────────────────────────┐  ┌────────────────────────────┐
│ 最近 3 個月（主要）         │  │ 最近 1 年（主要）           │
│ 年化 EV                    │  │ 年化 EV                    │
│ +86.91% （serif 24px 紅）  │  │ +9.13% （serif 24px 紅）    │
│ 高賠率正期望值（最佳）       │  │ 高賠率正期望值（最佳）        │
└────────────────────────────┘  └────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ 最近 5 年｜參考用（弱化）                                    │
│ 年化 EV +17.12% （serif 18px dim 色）                       │
│ 高賠率正期望值（最佳）                                       │
└────────────────────────────────────────────────────────────┘
```

**樣式**：
- 前 2 卡：`bg-card2` (#ede0c4) + border `border-base` + 金色 hover、serif 24px
- 第 3 卡：`bg-elevated` (#f4ead8) + border 較淡、serif 20px、整體 `text-dim`、加 inline tag「參考用」（金棕色 chip 樣式）
- Layout：前 2 卡並排 grid-cols-2，第 3 卡單獨整行 full-width（視覺次階）

### D4 — 手動查詢機制

**決策**：

```tsx
// IndividualPage 狀態
const [pendingCode, setPendingCode] = useState<string>('')   // StockSelector 已選但未查
const [queriedCode, setQueriedCode] = useState<string>('')   // 已查詢的代碼
const [results, setResults] = useState<EVResults | null>(null)
const [loading, setLoading] = useState(false)

async function handleQuery() {
  if (!pendingCode) return
  setLoading(true)
  try {
    const [monthly, daily] = await Promise.all([
      fetchMonthlyReturns(pendingCode),
      fetchDailyReturns(pendingCode).catch(() => [] as number[]),
    ])
    // ... 計算 evMulti / var / hurst / mc
    setQueriedCode(pendingCode)
    setResults(...)
  } finally {
    setLoading(false)
  }
}
```

**按鈕狀態**：
- 沒選股 → disabled
- 已選但未查（pending !== queried）→ active「查詢」
- 已查且 code 相同 → 顯示「已查詢」灰底 disabled，或顯示「重新查詢」

**StockSelector** props 改為 `onSelect: (code, name) => void`（不直接觸發 fetch）。

### D5 — StockSelector 下拉清單滾動

**決策**：

```tsx
<ul className="absolute z-10 w-full mt-1 bg-surface border border-base rounded-lg
               max-h-[300px] overflow-y-auto shadow-lg">
  {options.map(...)}
</ul>
```

關鍵：`max-h-[300px] overflow-y-auto`，並用 Tailwind `scrollbar-thin` plugin 或 default browser scrollbar。

### D6 — 資料不足降級

**決策**：

- `daily.length < 60` → 最近 3 個月卡顯示「資料不足（需 ≥60 筆日報酬）」
- `daily.length < 240` → 最近 1 年卡顯示「資料不足（需 ≥240 筆日報酬）」
- `monthly.length < 60` → 最近 5 年卡顯示「資料不足（需 ≥60 筆月報酬）」
- 至少要有 1 個卡有資料才渲染整個 panel；否則整個 EV panel 顯示「資料不足」

### D7 — PortfolioPage 影響範圍

**決策**：本 change **不動 PortfolioPage 與 `calcPortfolioMultiScaleEV`**。

組合頁目前用 `calcPortfolioMultiScaleEV(monthlyList, dailyList, weights)` 的 short/medium/long 仍維持舊定義。MultiScaleEVBlock 同時被組合頁使用 — 需要透過 prop 控制標題與 tier：

```tsx
// MultiScaleEVBlock 加 prop
labelOverrides?: { short?: string; medium?: string; long?: string }
tierOverrides?: { short?: 'primary' | 'reference'; medium?: 'primary' | 'reference'; long?: 'primary' | 'reference' }
```

或者：lib/ev.ts 把 label / tier **內建在 ScaleEV** 結構裡（D1 的決定），MultiScaleEVBlock 直接讀。**採此方案**——更乾淨。組合頁的 `calcPortfolioMultiScaleEV` 也須回傳含 tier/label 的 ScaleEV，但**先保留舊標籤「短期 / 中期 / 長期」** + tier 全 'primary'（行為與既有相同）。

## Risks / Trade-offs

- **PortfolioPage 視覺差異**：個股頁與組合頁的多尺度卡片標題會不一致。可接受，後續再對齊
- **使用者習慣**：自動查詢改手動可能讓首次使用者困惑，但有「查詢」按鈕視覺引導應可
- **資料筆數降級**：許多新股票或 ETF 可能日報酬不足 240 筆，需明確顯示降級訊息
- **divergence 文字改動**：既有測試 `mixed` 案例需更新斷言文字
