# Design: 字型統一 + 小數規則分類

## Context

字型混用與小數位不一致是兩個獨立但常一起修的視覺一致性問題。本 change 一次處理。

## Goals / Non-Goals

**Goals:**
- 全站字型統一為 Noto Sans TC
- 小數規則分類化：金額 / 百分比 / 勝率 / 指標 / EV 月期 各有預設精度
- format utility 提供一致 API，元件統一呼叫

**Non-Goals:**
- 不改色票、字級 token、layout
- 不改既有測試以外的邏輯
- 不改 PDF / Excel 匯出格式
- 不重新 design KPI 視覺

## Decisions

### D1 — 字型：純 Noto Sans TC

**決策**：

```css
/* index.css */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap');

@theme {
  --font-sans: 'Noto Sans TC', system-ui, -apple-system, sans-serif;
  --font-num:  'Noto Sans TC', system-ui, -apple-system, sans-serif;
  /* 移除 --font-serif */
}

body { font-family: var(--font-sans); }

/* 移除 .font-serif helper（或保留為 alias 但指向 sans，後續逐步清除）*/
.font-serif { font-family: var(--font-sans); }  /* 暫時 alias，避免大規模重編 */
.num {
  font-family: var(--font-sans);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
```

**理由**：
- 完全移除 Serif，全站 Sans
- `.font-serif` 暫保留為 sans alias（避免一次改太多 .tsx；後續 change 可清理）
- `.num` 保留 tabular-nums 讓數字對齊

**影響**：
- 標題、KPI 大數、ResultCard 數字、cmp-table、metric-card 等 — 全部 Sans 樣式

### D2 — 小數位分類規則

**決策**：

```typescript
// utils/format.ts

/** 金額：千分位、無小數、無正負號（由 color 表示），單位 by caller */
export function fmtMoney(n: number): string {
  if (!isFinite(n)) return '∞'
  const rounded = Math.round(n)
  return rounded.toLocaleString('en-US')
}

/** 百分比：預設 1 位小數、自動加 +/− 號（0 不加號）*/
export function fmtPct(n: number, digits = 1): string {
  if (!isFinite(n)) return '∞'
  const pct = n * 100
  if (pct === 0) return '0.0%'
  const sign = pct > 0 ? '+' : '−'
  return `${sign}${Math.abs(pct).toFixed(digits)}%`
}

/** 勝率：0 位小數、不加正負號 */
export function fmtWinRate(n: number): string {
  if (!isFinite(n)) return '—'
  return `${Math.round(n * 100)}%`
}

/** 一般指標：2 位小數、不加正負號 */
export function fmtRatio(n: number, digits = 2): string {
  if (!isFinite(n)) return '∞'
  return n.toFixed(digits)
}

/** 帶單位的金額顯示（萬元）*/
export function fmtWan(n: number): string {
  if (!isFinite(n)) return '∞'
  return `${(n / 10000).toFixed(1)} 萬`
}
```

**規則應用對照表**：

| 場景 | 函式 | 範例 |
|------|------|------|
| 總實現損益、平均盈虧（元）| `fmtMoney` | `+312,450` |
| 報酬率、EV、VaR | `fmtPct(n)` | `+12.3%` |
| 勝率、敗率 | `fmtWinRate(n)` | `60%` |
| 賠率、PF、Hurst、D | `fmtRatio(n)` | `1.42` / `0.62` |
| EV 月期值（特殊）| `fmtPct(n, 4)` | `+1.3253%` |
| MC 萬元（保留 1 位）| `fmtWan(n)` | `28.5 萬` |

### D3 — fmtPct 改預設 1 位的影響

**決策**：`fmtPct(n)` 預設從 2 位改為 1 位。

需處理：
- 所有顯式呼叫 `fmtPct(n, 2)` 改為 `fmtPct(n)`（隱式變 1 位）
- 顯式呼叫 `fmtPct(n, 4)` 保留（EV 月期值）
- 既有 `fmtPct(n)`（無第二參數）自動變 1 位 — 預期行為
- 測試：`format.test.ts` 更新

**snapshot 預期差異**：
- `+17.12%` → `+17.1%`
- `60.00%` → `60.0%`（但勝率改用 `fmtWinRate` → `60%`）

### D4 — 元件呼叫統一

**決策**：替換散落的 inline 格式化：

| 既有寫法 | 改為 |
|---------|------|
| `(p.winRate * 100).toFixed(2) + '%'` | `fmtWinRate(p.winRate)` |
| `(p.winRate * 100).toFixed(0) + '%'` | `fmtWinRate(p.winRate)` |
| `n.toFixed(2)` （指標）| `fmtRatio(n)` |
| `n.toFixed(3)` （Hurst/D）| `fmtRatio(n)`（強制 2 位）|
| `fmtPct(n, 2)` | `fmtPct(n)` |
| `(n / 10000).toFixed(1)` | `fmtWan(n)` |
| inline `Math.round` + `toLocaleString` | `fmtMoney(n)` |

**全文搜尋 + 替換策略**：
1. `font-serif` 在所有 .tsx — 不替換（CSS alias 處理）；但本 change 不主動清理（後續 change）
2. `.toFixed(` 在所有 .tsx — 列出後逐一檢視，替換為對應 utility
3. `(... * 100).toFixed` — 替換為 `fmtPct` / `fmtWinRate`
4. 重點檔案：`PortfolioPerformanceBlock`、`MultiScaleEVBlock`、`FractalDimensionBlock`、`MultiScaleHurstBlock`、`StockVsPortfolioComparison`、`RawTradeTable`、`StockQuadrantMatrix`、`McBlock`

### D5 — 測試策略

**決策**：
- `format.test.ts`：新增 `fmtWinRate`、`fmtRatio`、`fmtMoney` 測試；更新 `fmtPct` 預設 1 位的斷言
- 其他既有測試（diagnosis / recommendations / ev / ...）若有依賴 `fmtPct` 預設行為的，會在 `npm run test` 中暴露 — 修正

### D6 — Migration 順序

1. **Phase 1**：`utils/format.ts` 新增 utility + 更新測試
2. **Phase 2**：`index.css` 移除 Noto Serif TC + 改 `--font-serif` alias、移除 `.font-serif` 直接 serif 行為
3. **Phase 3**：逐檔替換 inline `toFixed` 為對應 utility
   - PortfolioPerformanceBlock / MultiScaleEVBlock / FractalDimensionBlock / MultiScaleHurstBlock
   - 其他次要檔案
4. **Phase 4**：跑 tsc / vitest / build / 瀏覽器確認
5. **Phase 5**：部署

## Risks / Trade-offs

- **視覺風格改變**：失去書卷感，但換來閱讀一致性。可接受
- **`fmtPct` 預設改 1 位 → snapshot 差異**：測試會抓出有依賴的地方
- **inline toFixed 散落**：30+ 處需逐檔檢視。可能漏改部分非關鍵位置 — 採「重點區塊優先 + tsc/build 兜底」策略
- **PDF / Excel 匯出**：匯出邏輯也用 `fmtPct` / `fmtMoney`，會跟著變。**這是預期的一致性**
