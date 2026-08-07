# multi-scale-ev Specification

## Purpose

對個股的月報酬與日報酬序列在三個窗口（短期日頻 60 / 中期月頻 36 / 長期月頻全部）各執行一次 EV 計算，並透過複利公式年化到「年化報酬 %」，使三個尺度數量級對齊可直接比較。協助使用者偵測短期 vs 長期動能變化（regime change）：當短期年化 EV 顯著偏離長期並跨越 0% 分界線時，提示動能轉弱或轉強。

## Requirements

### Requirement: 三尺度年化 EV 計算
系統 SHALL 提供 `calcMultiScaleEV(monthly, daily)` 函式，對短/中/長三個尺度各執行一次 `calcEV`，並將結果做複利年化轉換，回傳三個 `ScaleEV` 與一個 `divergence` 狀態。

#### Scenario: 三尺度都成功計算
- **WHEN** `monthly.length >= 60` 且 `daily.length >= 60` 且 `monthly.length >= 36`
- **THEN** 回傳物件 `{ short, medium, long, divergence }`，三者皆非 null：
  - `short` 使用 `daily.slice(-60)`，年化公式 `(1+ev)^252 − 1`
  - `medium` 使用 `monthly.slice(-36)`，年化公式 `(1+ev)^12 − 1`
  - `long` 使用全部 `monthly`，年化公式 `(1+ev)^12 − 1`

#### Scenario: 月報酬不足 60 筆
- **WHEN** `monthly.length < 60`
- **THEN** 函式回傳 `null`，呼叫端顯示「月報酬資料不足 5 年，無法使用多尺度 EV」

#### Scenario: 日報酬不足 60 筆
- **WHEN** `monthly.length >= 60` 但 `daily.length < 60`
- **THEN** `short` 為 `null`，`medium` 與 `long` 仍計算，divergence 退化為 `stable`

#### Scenario: 月報酬不足 36 筆
- **WHEN** `monthly.length` 介於 60 與 36 之間
- **THEN** `medium` 為 `null`，但 `long` 仍計算（使用全部月報酬）

#### Scenario: ScaleEV 結構
- **WHEN** 任一尺度成功計算
- **THEN** 該尺度回傳 `{ ev: EVResult, evAnnual: number, windowSize: number, freq: 'daily' | 'monthly' }`，其中 `ev.ev` 為單期 EV、`evAnnual` 為年化後 EV

### Requirement: EV Divergence 狀態判斷
系統 SHALL 根據短期年化 EV 與長期年化 EV 的差距以及 0% 分界線跨越情況，將 divergence 分類為 `stable`、`short-improving`、`short-deteriorating`、`mixed` 之一。

#### Scenario: 三尺度一致
- **WHEN** `|annual_short − annual_long| ≤ 0.05`
- **THEN** divergence 為 `stable`

#### Scenario: 短期轉負、長期仍正
- **WHEN** `annual_short < annual_long − 0.05` 且 `annual_short < 0 ≤ annual_long`
- **THEN** divergence 為 `short-deteriorating`

#### Scenario: 短期轉正、長期仍負
- **WHEN** `annual_short > annual_long + 0.05` 且 `annual_short > 0 ≥ annual_long`
- **THEN** divergence 為 `short-improving`

#### Scenario: 有差距但未跨越 0
- **WHEN** `|annual_short − annual_long| > 0.05` 但兩者同號
- **THEN** divergence 為 `mixed`

#### Scenario: 短期資料不足
- **WHEN** `short` 為 `null`
- **THEN** divergence 為 `stable`

### Requirement: MultiScaleEVBlock 元件呈現
系統 SHALL 在個股分析頁顯示 `MultiScaleEVBlock`，取代原 `EVBlock`，包含狀態判讀橫幅、三張並列卡片與依長期 quadrant 的徽章。

#### Scenario: 三卡片並列顯示
- **WHEN** 三尺度全部成功計算
- **THEN** 元件以三欄 grid 顯示「短期 3 個月（日頻 60 筆）/ 中期 3 年（月頻 36 筆）/ 長期 全期（月頻 N 筆）」三張卡片，每張顯示年化 EV、對應 quadrant 解讀

#### Scenario: 狀態判讀橫幅依 divergence 顯示
- **WHEN** divergence 為 `short-deteriorating`
- **THEN** 橫幅顯示「⚠ 短期動能轉弱：短期年化 EV 顯著低於長期」並使用 amber 警示樣式

#### Scenario: stable 狀態橫幅
- **WHEN** divergence 為 `stable`
- **THEN** 橫幅顯示「三尺度一致，狀態穩定」並使用一般資訊樣式

#### Scenario: Hero 列以長期為主
- **WHEN** 三尺度全部成功計算
- **THEN** Hero 列顯示「長期年化 EV」大數字 + 長期 quadrant 徽章 large 版 + 「賠率優勢」結論（皆依長期 EVResult）

#### Scenario: 短期樣本誤差提示
- **WHEN** 短期卡片渲染
- **THEN** 卡片下方附「樣本較小，年化誤差較大」說明文字

#### Scenario: 計算步驟摺疊顯示
- **WHEN** 計算步驟區塊展開
- **THEN** 區塊顯示三組（短/中/長）的單期 EV 值與年化轉換過程

#### Scenario: 月報酬不足 60 筆的降級
- **WHEN** `calcMultiScaleEV` 回傳 `null`
- **THEN** 個股頁不顯示 `MultiScaleEVBlock`，改顯示一行說明「月報酬資料不足 5 年，無法使用多尺度 EV」

### Requirement: ActionGuide 整合 EV divergence 訊號
系統 SHALL 在 `buildIndividualGuide` 中新增 `evDivergence` 訊號，並依其值產生對應建議行動文字。

#### Scenario: 短期動能轉弱
- **WHEN** `evDivergence === 'short-deteriorating'`
- **THEN** ActionGuide 顯示「⚠ 短期年化 EV 顯著低於長期，近期表現轉弱，注意停損」

#### Scenario: 短期動能轉強
- **WHEN** `evDivergence === 'short-improving'`
- **THEN** ActionGuide 顯示「⚠ 短期年化 EV 顯著高於長期，近期動能轉強，可關注買進訊號」

#### Scenario: stable 不顯示 EV divergence 訊息
- **WHEN** `evDivergence === 'stable'` 或為 `undefined`
- **THEN** 不顯示與 EV divergence 相關的建議

### Requirement: MultiScaleEVBlock 支援 title / dailyCountLabel override
`MultiScaleEVBlock` 元件 SHALL 接受可選 `titleOverride?: string` 與 `dailyCountLabelOverride?: string` props，供呼叫端（如組合頁）覆寫預設標題與副標的日報酬描述文字。

#### Scenario: 個股頁不傳 override
- **WHEN** 個股頁使用 `<MultiScaleEVBlock result={...} monthlyCount={...} dailyCount={...} />`（無 override）
- **THEN** 顯示既有預設標題「期望報酬與賠率優勢」，副標含「日報酬 N 筆」

#### Scenario: 組合頁傳入 titleOverride
- **WHEN** 組合頁使用 `<MultiScaleEVBlock ... titleOverride="組合期望報酬與賠率優勢" />`
- **THEN** 標題顯示為「組合期望報酬與賠率優勢」，其他內容（Hero / 三卡片 / 弱化 inline / 計算步驟）行為不變

#### Scenario: 組合頁傳入 dailyCountLabelOverride
- **WHEN** 組合頁使用 `<MultiScaleEVBlock ... dailyCountLabelOverride="日報酬最少 N 筆" />`
- **THEN** 副標的日報酬描述用 override 字串取代預設「日報酬 N 筆」

### Requirement: MultiScaleHurstBlock 支援 title override
`MultiScaleHurstBlock` 元件 SHALL 接受可選 `titleOverride?: string` prop，供呼叫端（如組合頁）覆寫預設標題。

#### Scenario: 組合頁傳入 titleOverride
- **WHEN** 組合頁使用 `<MultiScaleHurstBlock ... titleOverride="組合趨勢延續性偵測" />`
- **THEN** 標題顯示為「組合趨勢延續性偵測」，其他內容（divergence 橫幅 / 三卡片 / 計算步驟）行為不變

## ADDED Requirements (v2 — individual page rework)

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
