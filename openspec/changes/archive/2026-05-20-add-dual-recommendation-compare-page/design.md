# Design: 比較頁雙推薦架構

## Context

短期 K 線視覺與統計指標之間的落差，源於沒有「直接反映近期股價動能」的指標。需新增近期累積報酬，並把比較分為「近期 / 長期」雙視角，給予使用者交易風格依據。

## Goals / Non-Goals

**Goals:**
- 加「近期累積報酬」指標
- 比較表分兩段（近期動能 / 長期穩定）
- 雙推薦卡（短線主判斷 + 長線次要）

**Non-Goals:**
- 不改 calcMultiScaleEV / calcVaR 等 lib 邏輯
- 不引入「使用者自選權重」UI（保留為固定結構）

## Decisions

### D1 — 近期累積報酬計算

新 utility（直接放 ComparePage 內 inline 或 lib/utils）：

```typescript
/**
 * 累積報酬（複利）：(1+r1) × (1+r2) × ... − 1
 * @param returns 報酬率序列（最後 N 筆視窗）
 */
function calcCumulativeReturn(returns: number[]): number {
  if (returns.length === 0) return 0
  return returns.reduce((acc, r) => acc * (1 + r), 1) - 1
}
```

用法：

```typescript
const recent60 = dailyReturns.slice(-60)
const recentReturn = recent60.length >= 20 ? calcCumulativeReturn(recent60) : null
```

樣本不足（< 20 筆）時回 null，避免不可靠的近期推估。

### D2 — StockResult 加新欄位

```typescript
interface StockResult {
  // 原有
  ev: EVResult | null              // medium scale EV (年化 1 年)
  evScaleLabel: string | null
  var: VaRResult | null
  hurst: HurstResult | null
  freqLabel: string

  // 新增
  recentReturn: number | null       // 最近 60 日累積報酬
  recentWinRate: number | null      // short scale 勝率
  recentPayoff: number | null       // short scale 損益比
}
```

short scale 從 `calcMultiScaleEV(...).short.ev` 取得（同 1.6 提案的多尺度結果）。

### D3 — 比較表分段

```tsx
<table className="cmp-table">
  <thead>
    <tr><th>指標</th><th>{labelA}</th><th>{labelB}</th></tr>
  </thead>
  <tbody>
    {/* ─── 近期動能（最近 3 個月）─── */}
    <tr className="bg-elevated">
      <td colSpan={3} className="font-semibold text-main py-2">
        📈 近期動能（最近 3 個月 · 60 日）
      </td>
    </tr>
    <tr>
      <td className="metric">近期累積報酬</td>
      <td className={`num red ${recentReturnAdv.a ? 'win' : ''}`}>{...}</td>
      <td className={`num red ${recentReturnAdv.b ? 'win' : ''}`}>{...}</td>
    </tr>
    <tr>
      <td className="metric">近期勝率</td>
      ...
    </tr>
    <tr>
      <td className="metric">近期損益比</td>
      ...
    </tr>

    {/* ─── 長期穩定（最近 1 年）─── */}
    <tr className="bg-elevated">
      <td colSpan={3} className="font-semibold text-main py-2">
        📊 長期穩定（最近 1 年 / 400 日）
      </td>
    </tr>
    <tr>
      <td className="metric">年化期望報酬率</td>
      ...
    </tr>
    ...
  </tbody>
</table>
```

### D4 — 雙推薦卡

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* 短線推薦 — 主判斷金邊 */}
  <div className="relative bg-[#f4ead8] border-2 border-[#c9a84c] rounded-lg px-6 py-5">
    <div className="absolute top-2.5 right-3.5">
      <span className="text-[10.5px] bg-gold-dark text-white px-2 py-0.5 rounded-full font-semibold">🏆 主判斷</span>
    </div>
    <p className="text-[18px] font-bold text-main">短線推薦</p>
    <p className="text-[11px] text-dim mb-3">基於近期動能 3 項統計（最近 3 個月）</p>
    <p className={`font-serif text-[40px] font-bold leading-none ${shortHasVerdict ? 'text-red-700' : 'text-dim'}`}>
      {shortVerdictName}
    </p>
    <p className="text-[11.5px] text-dim mt-3">
      {labelA} 勝 {shortWinsA} / {labelB} 勝 {shortWinsB} / 平手 {shortTies}
    </p>
  </div>

  {/* 長線推薦 — 普通卡 */}
  <div className="bg-card2 border border-base rounded-lg px-6 py-5">
    <p className="text-[18px] font-bold text-main">長線推薦</p>
    <p className="text-[11px] text-dim mb-3">基於長期穩定 4 項統計（最近 1 年）</p>
    <p className={`font-serif text-[28px] font-bold leading-none ${longHasVerdict ? 'text-red-700' : 'text-dim'}`}>
      {longVerdictName}
    </p>
    <p className="text-[11.5px] text-dim mt-3">
      {labelA} 勝 {longWinsA} / {labelB} 勝 {longWinsB} / 平手 {longTies}
    </p>
  </div>
</div>
```

### D5 — 移除舊「綜合勝出方」單卡

舊版的 6 項加總綜合卡刪除，由雙推薦卡取代。

### D6 — Migration 順序

1. 加 `calcCumulativeReturn` utility
2. `calcResult` 加 `recentReturn` / `recentWinRate` / `recentPayoff`（從 `calcMultiScaleEV.short` 取）
3. 計算 7 個 advantage objects（3 短期 + 4 長期）
4. 雙推薦卡渲染
5. 比較表分段渲染
6. 移除舊綜合卡
7. 驗證 tsc/vitest/build/部署

## Risks / Trade-offs

- **60 日樣本小**：近期累積報酬可能因單一極端日而波動 — 加 disclaimer 在 section header
- **短線 vs 長線結論不同時**：使用者可能困惑 — chip「🏆 主判斷」明確標示短線為主
- **新指標解讀**：近期累積報酬可正可負，紅漲綠跌語意維持
