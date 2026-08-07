## ADDED Requirements

### Requirement: 指標命名集中表

系統 SHALL 在 `src/lib/labels.ts` 提供集中命名表 `METRIC_LABELS`，所有 UI 字串從此匯入，禁止散落寫死。

#### Scenario: 集中表內容

- **WHEN** 任何元件渲染指標標題
- **THEN** 由 `METRIC_LABELS` 取得字串，至少包含：
  - `evAnnual` = '年化期望報酬率'
  - `payoffRatio` = '損益比'
  - `profitFactor` = '獲利因子'
  - `winRate` = '勝率'、`lossRate` = '敗率'
  - `hurstH` = '趨勢強度 H'
  - `fractalD` = '分形維度 D'
  - `var95` / `var99` = '95% 下行虧損' / '99% 下行虧損'
  - `mcP5` / `mcP50` / `mcP95` = '悲觀情境' / '中位情境' / '樂觀情境'
  - `totalPnl` = '總實現損益'
  - `overallReturn` = '整體報酬率'
  - `avgHolding` = '平均持有天數'

### Requirement: 指標卡視覺層級統一規格

所有指標卡 SHALL 採統一視覺層級：主標題 → 視窗描述 → 指標名稱 → 主數字 → 底層值 → 評級 chip → 警語。

#### Scenario: 卡片內容由上至下

- **WHEN** 任何指標卡（EV / VaR / Hurst / D / MC / 績效 metric）渲染
- **THEN** 依序呈現：
  1. 主標題（18px 粗體，或 reference tier 弱化）
  2. 視窗描述（11px dim，僅有窗口概念的卡片）
  3. 指標名稱（13px dim）
  4. 主數字（28–36px 粗體 + 紅漲綠跌）
  5. 底層值（11px dim，必有）
  6. 評級 chip（若該指標有狀態判讀）
  7. 警語（若樣本不足）

#### Scenario: 底層值內容對應

- **WHEN** 卡片渲染底層值
- **THEN** 依下表對應：
  - EV 卡片 → 「日平均報酬率 X%」或「月平均報酬率 X%」
  - VaR 卡片 → 「N 筆日報酬第 K 百分位」
  - Hurst H 卡片 → 「R/S 迴歸斜率（M 點）」
  - 分形維度 D 卡片 → 「H = X（D = 2 − H）」
  - Monte Carlo 中位 / 悲觀 / 樂觀 → 「μ=X% / σ=Y%」
  - 績效 metric-card → 依 D3 對應表（總投入 / 年化 / 勝場數比 / 等）

### Requirement: 全站「賠率」改稱「損益比」

所有使用者面對的字串 SHALL 將「賠率」改為「損益比」；內部變數 / type / 函式名稱保持 `payoff` / `payoffRatio`。

#### Scenario: UI 文字

- **WHEN** 任何元件、診斷訊息、建議文案、PDF / Excel 匯出顯示
- **THEN** 顯示「損益比」，不顯示「賠率」

#### Scenario: 內部命名保留

- **WHEN** code 中變數 / interface / type 使用 `payoffRatio`
- **THEN** 不變更，僅 UI 字串改

### Requirement: VaR 與 Monte Carlo 命名

- VaR 95% / 99% SHALL 顯示為「95% 下行虧損」/「99% 下行虧損」
- Monte Carlo P5 / P50 / P95 SHALL 顯示為「悲觀情境」/「中位情境」/「樂觀情境」
- 副標可保留技術名稱（如「VaR 95%」、「P50 終值」）作為小字輔助

#### Scenario: VaR 主標

- **WHEN** VarBlock 渲染
- **THEN** 區塊內主指標卡標題為「95% 下行虧損」/「99% 下行虧損」

#### Scenario: Monte Carlo 主標

- **WHEN** McBlock 渲染各情境
- **THEN** 標題為「悲觀情境」「中位情境」「樂觀情境」
