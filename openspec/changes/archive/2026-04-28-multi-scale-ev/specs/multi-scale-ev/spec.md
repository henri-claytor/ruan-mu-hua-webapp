## ADDED Requirements

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
- **WHEN** `|annual_short − annual_long| > 0.05` 但兩者同號（同正或同負）
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
- **THEN** 區塊顯示三組（短/中/長）的單期 EV 值與年化轉換過程：例如「短期：日 EV = 0.04% → 年化 = (1+0.0004)^252 − 1 = +10.6%」

#### Scenario: 月報酬不足 60 筆的降級
- **WHEN** `calcMultiScaleEV` 回傳 `null`
- **THEN** 個股頁不顯示 `MultiScaleEVBlock`，改顯示一行說明「月報酬資料不足 5 年，無法使用多尺度 EV」，使用 `text-faint text-small` 樣式

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
