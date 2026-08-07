# Design: 比較頁時間尺度對齊個股頁

## Context

比較頁與個股頁的「期望報酬率」實質為不同時間尺度的計算。使用者切換頁面或對照短期股價會有落差。需對齊時間尺度並明確標示。

## Goals / Non-Goals

**Goals:**
- 比較頁期望報酬率與個股頁 medium scale 一致（最近 1 年）
- 表格頂部明確標示資料時間尺度
- 綜合勝出方說明基於哪個時間尺度

**Non-Goals:**
- 不改 calcMultiScaleEV / calcVaR / calcHurst 邏輯
- 不引入「多尺度比較」（避免比較表變太複雜）
- 不改個股頁

## Decisions

### D1 — 期望報酬率取「medium > short > long」fallback

```typescript
function calcResult(stock: CompareStock): StockResult {
  const { monthlyReturns, dailyReturns } = stock
  if (monthlyReturns.length < 10) return { ev: null, ... }

  // 多尺度 EV（與個股頁 v2 一致）
  const multi = calcMultiScaleEV(monthlyReturns, dailyReturns)
  const primary = multi?.medium ?? multi?.short ?? multi?.long ?? null

  const useDaily = dailyReturns.length >= 252
  const returnsForRisk = useDaily ? dailyReturns : monthlyReturns

  return {
    ev: primary?.ev ?? null,  // EVResult
    evScaleLabel: primary?.label ?? null,  // '最近 1 年' / '最近 3 個月' / '最近 5 年'
    var: calcVaR(returnsForRisk),
    hurst: calcHurst(returnsForRisk),
    freqLabel: useDaily ? `日頻 ${dailyReturns.length} 筆` : `月頻 ${monthlyReturns.length} 筆`,
  }
}
```

**邏輯**：
- 優先 medium（最近 1 年）
- daily 60–239 → fallback short（最近 3 個月，但因樣本小需註記）
- daily < 60 → fallback long（最近 5 年月報酬，舊行為）

### D2 — 比較表頂部資料尺度說明

```tsx
<div className="px-4 py-3 border-b border-base bg-elevated text-small text-dim space-y-1">
  <p>🟢 綠色背景 = 該項目較佳</p>
  <p>
    <span className="font-semibold text-main">資料尺度</span> · 
    期望報酬率：{primaryScaleLabel} · 
    下行虧損 / 趨勢強度：{freqLabel}
  </p>
</div>
```

當 A / B 不同尺度時取較寬鬆方表示（或顯示「A: X / B: Y」）— 簡化：取 A 的 scale label 即可（使用者已知兩股對等比較）。

### D3 — 綜合勝出方副標

```tsx
<p className="text-[11px] text-dim mb-3">
  6 項指標統計 · 基於 <span className="font-semibold">{primaryScaleLabel}</span> 表現
</p>
```

例如「基於最近 1 年表現」/「基於最近 3 個月表現」。

### D4 — 與舊行為的差異說明

| 指標 | 改前 | 改後 |
|------|------|------|
| 期望報酬率 | 全部月報酬（5–10 年平均） | 最近 1 年（日報酬 240 筆） |
| 勝率 | 同上 | 同上（從 EVResult.winRate 來） |
| 實際損益比 | 同上 | 同上 |
| 95% / 99% 下行虧損 | 400 日 | **不變** |
| 趨勢強度 | 400 日 | **不變** |

**注意**：勝率、損益比都從同一 EVResult 來，所以三者同步切到「最近 1 年」。

### D5 — Migration 順序

1. 改 `calcResult` 用 `calcMultiScaleEV` + fallback
2. `StockResult` 加 `evScaleLabel` 欄位
3. 比較表頂部說明加資料尺度
4. 綜合勝出方副標補充
5. 確認 fmt 不變、驗證 tsc/vitest/build

## Risks / Trade-offs

- **數字會變**：使用者習慣的「+5%」可能變「+3%」或「+7%」，因尺度變短
- **240 筆樣本小**：年化誤差較大；用 `calcMultiScaleEV` 內建的 annualize 邏輯處理
- **不同股票可能 fallback 到不同尺度**：例如 A 用 medium、B 用 short — 在合理範圍（雙方都至少 short 以上）就允許比較
