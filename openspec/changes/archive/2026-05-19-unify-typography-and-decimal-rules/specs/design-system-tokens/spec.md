## ADDED Requirements

### Requirement: 全站採 Noto Sans TC 單一字型

系統 SHALL 全站使用 Noto Sans TC 作為唯一字型，移除 Noto Serif TC。

#### Scenario: 字體匯入

- **WHEN** 頁面載入
- **THEN** `<head>` 僅含 Noto Sans TC（weight 300/400/500/700/900）連結，不含 Noto Serif TC

#### Scenario: body 預設 font-family

- **WHEN** 任何文字渲染
- **THEN** font-family chain 為 `'Noto Sans TC', system-ui, -apple-system, sans-serif`

#### Scenario: 標題、KPI 數字統一 sans

- **WHEN** `<h1>`、`<h2>`、`.panel-title`、KPI 大數、`.num`、`.font-serif` 渲染
- **THEN** font-family 均為 `'Noto Sans TC', sans-serif`
- **AND** `.font-serif` class 暫保留為 alias 指向 sans，避免大規模 markup 改動

#### Scenario: 數字 tabular-nums

- **WHEN** `.num` class 套用
- **THEN** 含 `font-variant-numeric: tabular-nums`，數字等寬對齊

### Requirement: 全站小數位分類規則

系統 SHALL 在 `src/utils/format.ts` 提供 5 個分類 utility，所有顯示遵循其預設精度。

#### Scenario: 金額顯示

- **WHEN** 呼叫 `fmtMoney(312450)`
- **THEN** 回傳 `'312,450'`（0 位小數、千分位、無正負號）

#### Scenario: 百分比顯示

- **WHEN** 呼叫 `fmtPct(0.1234)`
- **THEN** 回傳 `'+12.3%'`（預設 1 位小數、自動加 +/− 號）

- **WHEN** 呼叫 `fmtPct(-0.045)`
- **THEN** 回傳 `'−4.5%'`

- **WHEN** 呼叫 `fmtPct(0)`
- **THEN** 回傳 `'0.0%'`（0 不加號）

- **WHEN** 呼叫 `fmtPct(0.013253, 4)`
- **THEN** 回傳 `'+1.3253%'`（顯式指定 4 位仍生效）

#### Scenario: 勝率顯示

- **WHEN** 呼叫 `fmtWinRate(0.6)`
- **THEN** 回傳 `'60%'`（0 位、無正負號）

- **WHEN** 呼叫 `fmtWinRate(0.5833)`
- **THEN** 回傳 `'58%'`

#### Scenario: 一般指標顯示

- **WHEN** 呼叫 `fmtRatio(1.4267)`
- **THEN** 回傳 `'1.43'`（2 位、無正負號）

- **WHEN** 呼叫 `fmtRatio(Infinity)`
- **THEN** 回傳 `'∞'`

#### Scenario: 萬元金額

- **WHEN** 呼叫 `fmtWan(285000)`
- **THEN** 回傳 `'28.5 萬'`

### Requirement: 元件呼叫一致性

全站元件 SHALL 不再使用 inline `toFixed` / `(x*100).toFixed` 等格式化邏輯，改呼叫 utility。

#### Scenario: 勝率/敗率呼叫 fmtWinRate

- **WHEN** PortfolioPerformanceBlock、MultiScaleEVBlock、cmp-table 等渲染勝率/敗率
- **THEN** 統一呼叫 `fmtWinRate(rate)`，不再 inline `(rate * 100).toFixed(2)`

#### Scenario: 賠率/PF/Hurst/D 呼叫 fmtRatio

- **WHEN** 渲染賠率、獲利因子、Hurst、D 值
- **THEN** 統一呼叫 `fmtRatio(value)`（預設 2 位）

#### Scenario: 金額呼叫 fmtMoney

- **WHEN** 渲染損益、平均獲利/虧損、總投入等元金額
- **THEN** 統一呼叫 `fmtMoney(value)`（0 位、千分位）
