## 1. utils/format.ts 擴充

- [x] 1.1 新增 `fmtMoney(n)`：0 位、千分位
- [x] 1.2 修改 `fmtPct(n, digits = 1)`：預設 1 位（既有預設 2 位）
- [x] 1.3 新增 `fmtWinRate(n)`：0 位、無號
- [x] 1.4 新增 `fmtRatio(n, digits = 2)`：2 位
- [x] 1.5 保留 / 統一 `fmtWan(n)` 行為（1 位）

## 2. format.test.ts 更新

- [x] 2.1 新增 `fmtMoney` 測試（含千分位、∞、負值）
- [x] 2.2 更新 `fmtPct` 預設 1 位斷言；保留顯式 4 位案例
- [x] 2.3 新增 `fmtWinRate` 測試
- [x] 2.4 新增 `fmtRatio` 測試（含 Infinity → '∞'）

## 3. index.css 字型統一

- [x] 3.1 移除 `@import` Noto Serif TC
- [x] 3.2 移除 `--font-serif` 變數定義（或改為 alias 指向 sans）
- [x] 3.3 `--font-num` 從 Noto Serif TC 改為 Noto Sans TC
- [x] 3.4 `.font-serif` 改為 sans alias（暫保留 className）
- [x] 3.5 `.num` 保留 tabular-nums + sans

## 4. 元件 inline 格式化清理

- [x] 4.1 `PortfolioPerformanceBlock`：勝率、賠率、PF 改 `fmtWinRate` / `fmtRatio`
- [x] 4.2 `MultiScaleEVBlock`：勝率/敗率改 `fmtWinRate`、Avg Gain/Loss 保留 `fmtPct`（1 位）
- [x] 4.3 `FractalDimensionBlock`：D 值 `toFixed(2)` 改 `fmtRatio(d)`、`toFixed(4)` 保留（H 與 D 計算步驟原值）
- [x] 4.4 `MultiScaleHurstBlock`：H 值 `toFixed(2)` 改 `fmtRatio(h)`、`toFixed(4)` 保留
- [x] 4.5 `RawTradeTable`：金額改 `fmtMoney`，報酬率改 `fmtPct`
- [x] 4.6 `StockQuadrantMatrix`：賠率、PF 改 `fmtRatio`，勝率改 `fmtWinRate`
- [x] 4.7 `StockVsPortfolioComparison`：報酬率 `fmtPct`、Hurst `fmtRatio`
- [x] 4.8 `McBlock`：金額 `fmtWan`，報酬率 `fmtPct`
- [x] 4.9 其餘 charts 元件抽查並替換

## 5. 驗證

- [x] 5.1 `npx tsc --noEmit` 通過
- [x] 5.2 `npx vitest run` 全部通過
- [x] 5.3 `npm run build` 通過
- [x] 5.4 瀏覽器確認：
  - 字型全 sans（無書卷感）
  - 金額：`312,450`（0 位）
  - 百分比：`+12.3%`（1 位）
  - 勝率：`60%`（0 位）
  - Hurst / D / 賠率 / PF：`1.42`（2 位）
- [x] 5.5 部署 Vercel
