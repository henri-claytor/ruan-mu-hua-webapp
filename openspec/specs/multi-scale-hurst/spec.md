# multi-scale-hurst Specification

## Purpose

對日報酬序列在固定的短/中/長三個窗口（60 / 120 / 240）各執行一次 R/S 分析，產生三個 Hurst H 值與一個 divergence 狀態。協助使用者偵測 regime change：當短期 H 顯著偏離長期 H 並跨越 0.5 中性線時，提示趨勢可能正在減弱或動能轉強。

## Requirements

### Requirement: 三尺度 Hurst 計算
系統 SHALL 提供 `calcMultiScaleHurst(dailyReturns)` 函式，對日報酬序列在固定的短/中/長三個窗口（60 / 120 / 240）各執行一次 R/S 分析，回傳三個 `HurstResult` 與一個 `divergence` 狀態。函式僅支援日頻資料，不提供月頻 fallback。

#### Scenario: 資料充足時的窗口切片
- **WHEN** `dailyReturns.length >= 240`
- **THEN** 短期窗口取 `dailyReturns.slice(-60)`，中期窗口取 `dailyReturns.slice(-120)`，長期窗口取 `dailyReturns.slice(-240)`，三個窗口各自計算 H 值

#### Scenario: 資料不足時函式回傳 null
- **WHEN** `dailyReturns.length < 240`
- **THEN** 函式回傳 `null`，呼叫端負責顯示「日報酬資料不足 240 筆」提示

#### Scenario: 結果型別包含三個尺度與 divergence
- **WHEN** 函式成功回傳結果
- **THEN** 回傳物件結構為 `{ short: HurstResult, medium: HurstResult, long: HurstResult, divergence: Divergence }`，三個 H 值均為非 null

### Requirement: Divergence 狀態判斷
系統 SHALL 根據短期 H 與長期 H 的差距以及 0.5 中性線跨越情況，將 divergence 分類為 `stable`、`short-weakening`、`short-strengthening`、`mixed` 之一。

#### Scenario: 三尺度一致
- **WHEN** `|H_short − H_long| ≤ 0.10`
- **THEN** divergence 為 `stable`

#### Scenario: 短期偏弱跨越中性線
- **WHEN** `H_short < H_long − 0.10` 且 `H_short < 0.5 ≤ H_long`
- **THEN** divergence 為 `short-weakening`

#### Scenario: 短期偏強跨越中性線
- **WHEN** `H_short > H_long + 0.10` 且 `H_short > 0.5 ≥ H_long`
- **THEN** divergence 為 `short-strengthening`

#### Scenario: 有差距但未跨越中性線
- **WHEN** `|H_short − H_long| > 0.10` 但兩者同側於 0.5
- **THEN** divergence 為 `mixed`

### Requirement: MultiScaleHurstBlock 元件呈現
系統 SHALL 在個股分析頁顯示 `MultiScaleHurstBlock`，包含三張卡片並列顯示三尺度 H 值與解讀，並在最上方顯示狀態判讀橫幅。

#### Scenario: 三卡片並列顯示
- **WHEN** 三尺度 H 值全部計算完成
- **THEN** 元件以三欄 grid 顯示「短期 60日 / 中期 120日 / 長期 240日」三張卡片，每張顯示 H 值（小數 2 位）、解讀文字（趨勢型 / 中性 / 均值回歸）

#### Scenario: 狀態判讀橫幅依 divergence 顯示
- **WHEN** divergence 為 `short-weakening`
- **THEN** 橫幅顯示「⚠ 短期偏離長期：趨勢可能正在減弱」並使用 amber 警示樣式

#### Scenario: stable 狀態橫幅
- **WHEN** divergence 為 `stable`
- **THEN** 橫幅顯示「三尺度一致，狀態穩定」並使用一般資訊樣式（無警示色）

#### Scenario: 短期樣本誤差提示
- **WHEN** 短期卡片顯示時
- **THEN** 卡片下方附「樣本較小，誤差較大」說明文字

#### Scenario: 累積偏差圖只顯示長期
- **WHEN** 三尺度計算完成
- **THEN** HurstLineChart 元件只繪製長期窗口（240 日）的 `cumDeviations`，避免三組資料互相干擾，圖表標題標注「長期窗口（240日）」

#### Scenario: 資料不足時的降級提示
- **WHEN** `calcMultiScaleHurst` 回傳 `null`（日報酬 < 240 筆）
- **THEN** 個股頁不顯示 `MultiScaleHurstBlock`，改顯示一行說明「日報酬資料不足 240 筆，需要約 1 年的交易紀錄才能計算多尺度 Hurst」，使用 `text-faint text-small` 樣式

### Requirement: ActionGuide 整合 divergence 訊號
系統 SHALL 在 `buildIndividualGuide` 中接受 `hurstDivergence` 訊號，並使用短期 H 取代原本的長期 H 作為 Hurst 解讀依據。

#### Scenario: 短期偏離長期的建議
- **WHEN** `hurstDivergence === 'short-weakening'`
- **THEN** ActionGuide 顯示「⚠ 短期 H 顯著低於長期，趨勢動能可能轉弱，注意停利停損」

#### Scenario: 短期動能轉強的建議
- **WHEN** `hurstDivergence === 'short-strengthening'`
- **THEN** ActionGuide 顯示「⚠ 短期 H 顯著高於長期，動能轉強，可關注突破訊號」

#### Scenario: stable 不顯示 divergence 訊息
- **WHEN** `hurstDivergence === 'stable'` 或為 `undefined`
- **THEN** 不顯示與 divergence 相關的建議
