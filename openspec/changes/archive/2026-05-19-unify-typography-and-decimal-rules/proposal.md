## Why

目前全站視覺有 2 個一致性問題：

1. **字型混用**：標題、KPI 大數使用 Noto Serif TC（書卷感），內文用 Noto Sans TC。Serif 字體在數字密集區（KPI、表格）的可讀性略差，且兩種字型併用視覺干擾較大。
2. **小數位不一致**：全站百分比有 1 / 2 / 3 / 4 位；金額有時帶小數有時不帶；Hurst / D 值 有 2 / 3 / 4 位；勝率有時 60.0%、有時 60.00%。讀者需重新適應每個區塊的精度。

統一字型 + 分類化小數規則可提升整體閱讀流暢度。

## What Changes

- **字型**：全站改用 **Noto Sans TC**，移除 Noto Serif TC
  - 影響：頁面標題、panel title、KPI 大數、ResultCard、metric-card、cmp-table 等所有 `.font-serif` / `.num` 樣式
  - 字重保留：標題 700–900、KPI 700、內文 400/500
  - 移除 index.css 中 `--font-serif` 變數定義與 `@import` Noto Serif TC

- **小數位分類規則**（建立全站 utility）：
  | 類別 | 小數位 | 範例 |
  |-----|-------|-----|
  | 金額 | 0 位 | `+312,450 元`、`-12,500 元` |
  | 百分比 | 1 位 | `+12.3%`、`-4.5%` |
  | 勝率 / 敗率 | 0 位 | `60%`、`40%` |
  | 一般指標 (賠率、PF、Hurst、D、Sharpe) | 2 位 | `1.42`、`1.73`、`0.62`、`1.38` |
  | EV 月期值（特殊精度） | 4 位 | `+1.3253%`（既有設計，保留） |

- **utility 函式**（在 `src/utils/format.ts` 擴充或新增）：
  - `fmtMoney(n)` → 0 位、含千分位、無小數點
  - `fmtPct(n, digits = 1)` → 預設改為 1 位（既有預設 2 位）
  - `fmtWinRate(n)` → 0 位的百分比
  - `fmtRatio(n)` → 2 位（沿用既有命名或新增）
  - 既有 `fmtPct(n, 4)` 用法（EV 月期值）保留

- **影響檔案**：
  - `src/utils/format.ts`：擴充 utility
  - `src/index.css`：移除 Noto Serif TC + `--font-serif`
  - 所有元件：
    - 移除 `font-serif` className
    - 統一呼叫 `fmtPct` / `fmtMoney` / `fmtWinRate` / `fmtRatio` 取代 inline `toFixed(N)` / `(x*100).toFixed(N)` 等

- **保留**：
  - 既有色票、字級 token 不變
  - 紅漲綠跌不變
  - 計算公式不變

## Capabilities

### Modified Capabilities

- `design-system-tokens`：移除 Serif、字級 token 對應 sans only；小數規則納入

## Impact

- **影響檔案**：
  - `src/utils/format.ts`（+ `format.test.ts`）
  - `src/index.css`（移除 Serif 引用）
  - 全站元件中所有使用 `font-serif` className 與 inline `toFixed` 的位置（估 30+ 處）
- **不影響**：邏輯、tests（除 format.test.ts）、API、store
- **風險**：
  - 字型改 sans 後，KPI 大數視覺較「現代乾淨」但少了書卷質感
  - 既有 `fmtPct(n)` 預設 2 位 → 改 1 位，**會有 snapshot diff 或視覺差異**；需檢視測試與所有呼叫處
  - 統一呼叫 utility 後，inline `toFixed` 散落各處要全掃
