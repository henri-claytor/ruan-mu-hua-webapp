## MODIFIED Requirements

### Requirement: 多尺度 EV 窗口定義

系統 SHALL 提供 `calcMultiScaleEV(monthlyReturns, dailyReturns)` 函式，回傳三個尺度的年化 EV，每個尺度含 `tier`（'primary' | 'reference'）與 `label`（顯示用標題）。

窗口定義（個股頁）：

| key | label | 窗口 | 頻率 | tier |
|-----|-------|------|------|------|
| `short` | 最近 3 個月 | 60 | daily | primary |
| `medium` | 最近 1 年 | 240 | daily | primary |
| `long` | 最近 5 年 | 60 | monthly | reference |

#### Scenario: 三個尺度回傳 tier 與 label

- **WHEN** 呼叫 `calcMultiScaleEV(monthly, daily)`（daily.length ≥ 240、monthly.length ≥ 60）
- **THEN** 回傳 `{ short, medium, long, divergence }`
- **AND** `short.label === '最近 3 個月'`、`short.tier === 'primary'`、`short.windowSize === 60`、`short.freq === 'daily'`
- **AND** `medium.label === '最近 1 年'`、`medium.tier === 'primary'`、`medium.windowSize === 240`、`medium.freq === 'daily'`
- **AND** `long.label === '最近 5 年'`、`long.tier === 'reference'`、`long.windowSize === 60`、`long.freq === 'monthly'`

#### Scenario: 資料不足降級

- **WHEN** daily.length < 60
- **THEN** `short === null`
- **AND** WHEN daily.length < 240 THEN `medium === null`
- **AND** WHEN monthly.length < 60 THEN `long === null`

### Requirement: Divergence 判讀只看主要尺度

系統 SHALL 在判讀「一致 / 有差異」時，僅比較 `short`（最近 3 個月）與 `medium`（最近 1 年）兩個 primary 尺度；`long`（5 年）只作為畫面參考，不影響 divergence 結果。

#### Scenario: 兩主要尺度同號且偏離 < 30% → stable

- **WHEN** short.evAnnual 與 medium.evAnnual 同號（同正或同負）
- **AND** `|evAnnualShort - evAnnualMedium| / max(|short|, |medium|) < 0.3`
- **THEN** `divergence === 'stable'`

#### Scenario: 短期顯著低於中期

- **WHEN** short.evAnnual < medium.evAnnual 且 gap > 0.3
- **THEN** `divergence === 'short-deteriorating'`

#### Scenario: 短期顯著高於中期

- **WHEN** short.evAnnual > medium.evAnnual 且 gap > 0.3
- **THEN** `divergence === 'short-improving'`

#### Scenario: 同號 + 偏離超過 30% 但無方向偏好

- **WHEN** 同號但 gap ≥ 0.3（兩者距離大）
- **THEN** `divergence === 'mixed'`

#### Scenario: 主要尺度資料不足

- **WHEN** short === null 或 medium === null
- **THEN** `divergence === 'stable'`（無法判讀，預設穩定）

### Requirement: MultiScaleEVBlock 視覺權重區分

`MultiScaleEVBlock` SHALL 對 primary 與 reference 尺度採用不同視覺權重。

#### Scenario: primary 卡片並排顯示

- **WHEN** 渲染 `short`（最近 3 個月）與 `medium`（最近 1 年）
- **THEN** 兩卡以 `grid-cols-2` 並排，採 cream `bg-card2` 底 + 金色淡邊
- **AND** 標題使用對應的 `label`（「最近 3 個月」/「最近 1 年」）
- **AND** 數字字級 serif 24px，紅漲綠跌依正負

#### Scenario: reference 卡片獨立全寬弱化

- **WHEN** 渲染 `long`（最近 5 年）
- **THEN** 該卡片獨立佔 1 整行（grid-cols-1），位於前 2 卡之下
- **AND** 採弱化樣式：`bg-elevated`、邊框較淡、數字字級降為 serif 20px、整體文字 `text-dim`
- **AND** 標題顯示「最近 5 年」+ 「參考用」小 chip（金棕色淡 tag）

#### Scenario: Divergence banner 文字

- **WHEN** divergence === 'stable'
- **THEN** banner 文字為「近 3 個月與近 1 年趨勢一致」

- **WHEN** divergence === 'mixed'
- **THEN** banner 文字為「近 3 個月與近 1 年趨勢有差異」

- **WHEN** divergence === 'short-improving'
- **THEN** banner 文字為「⚠ 短期動能轉強：近 3 個月年化 EV 顯著高於近 1 年」

- **WHEN** divergence === 'short-deteriorating'
- **THEN** banner 文字為「⚠ 短期動能轉弱：近 3 個月年化 EV 顯著低於近 1 年」
