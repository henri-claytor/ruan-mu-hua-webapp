## MODIFIED Requirements

### Requirement: 8 KPI 4×2 grid 順序
系統 SHALL 在「一、整體投資組合概覽」章節（`PortfolioPerformanceBlock`）以 4 欄 × 2 列的 grid 排列 8 個整體 KPI，順序對齊 PDF 範本。「總實現損益」與「整體報酬率」兩張 KPI 卡 SHALL 在 `base` 副資訊位置顯示延伸指標（最大回撤、年化報酬率）。

#### Scenario: KPI 順序
- **WHEN** `PortfolioPerformanceBlock` 渲染
- **THEN** KPI 顯示順序為：第 1 列 — 總實現損益 / 整體報酬率 / 整體勝率 / 獲利因子；第 2 列 — 平均持有天數 / 勝場均報酬 / 敗場均虧損 / 損益比（賠率）

#### Scenario: KPI 數字字級
- **WHEN** 任一 KPI 渲染
- **THEN** 數字一律使用 `display` 字級，上方為 label（caption 字級）

#### Scenario: 紅漲綠跌色碼
- **WHEN** KPI 值為「總實現損益」「整體報酬率」「勝場均報酬」「敗場均虧損」其中之一
- **THEN** 正值用 `text-red-700`、負值用 `text-green-700`、零值用 `text-main`

#### Scenario: 中性色 KPI
- **WHEN** KPI 值為「整體勝率」「獲利因子」「平均持有天數」「損益比（賠率）」其中之一
- **THEN** 一律用 `text-main` 中性色，不套紅綠

#### Scenario: 總實現損益 KPI base 顯示最大回撤
- **WHEN** 「總實現損益」KpiCard 渲染
- **THEN** base 位置顯示 `最大回撤 −X,XXX 元（−Y.Y%）`（使用 `fmtMoney` + `fmtPct`），若 `maxDrawdownPct === 0` 則顯示「無回撤」

#### Scenario: 整體報酬率 KPI base 顯示年化報酬
- **WHEN** 「整體報酬率」KpiCard 渲染
- **THEN** base 位置顯示 `年化 X.X%`（使用 `fmtPct`）

#### Scenario: base 副資訊字級
- **WHEN** 任一 KpiCard 顯示 base 副資訊
- **THEN** base 文字使用 `text-caption` 字級 + `text-faint` 顏色（不搶 KPI 主數字注意力）
