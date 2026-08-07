## ADDED Requirements

### Requirement: 分形維度 D 推算與分類函式

系統 SHALL 在 `src/lib/fractalDimension.ts` 提供 `hurstToFractalDimension(h)` 與 `classifyFractalDimension(d)` 兩個純函式。

#### Scenario: D = 2 − H

- **WHEN** 呼叫 `hurstToFractalDimension(0.6)`
- **THEN** 回傳 `1.4`

- **WHEN** 呼叫 `hurstToFractalDimension(0.5)`
- **THEN** 回傳 `1.5`

- **WHEN** 呼叫 `hurstToFractalDimension(0.3)`
- **THEN** 回傳 `1.7`

#### Scenario: 5 級狀態分類

- **WHEN** `classifyFractalDimension(d)`
- **THEN** 依以下門檻分類：
  - `d < 1.4` → `'strong-trend'`
  - `1.4 ≤ d < 1.48` → `'mild-trend'`
  - `1.48 ≤ d ≤ 1.52` → `'random'`
  - `1.52 < d ≤ 1.6` → `'mild-mean-revert'`
  - `d > 1.6` → `'strong-mean-revert'`

#### Scenario: NaN 與極端值處理

- **WHEN** 傳入 `NaN`
- **THEN** `hurstToFractalDimension(NaN)` 回傳 `NaN`、`classifyFractalDimension(NaN)` 回傳 `'random'`（預設）

### Requirement: 個股頁走勢規律性偵測 panel

系統 SHALL 在 IndividualPage 的 Hurst block 之後渲染「走勢規律性偵測」panel，顯示三尺度 D 值。

#### Scenario: Panel 結構

- **WHEN** `results.hurst !== null`
- **THEN** 渲染 `.panel`，含標題「走勢規律性偵測」+ 副標「分形維度 D（Fractal Dimension）— 量化價格序列的『粗糙度』，D = 2 − H」

#### Scenario: 三尺度卡片

- **WHEN** Panel 渲染
- **THEN** 內含 grid-cols-3，分別顯示短/中/長期 3 個 D 值卡片
- **AND** 每張卡：尺度 label（短期/中期/長期）+ 窗口副標（60/120/240 日）+「D 值」label + serif 24px 數字（3 位小數）+ 狀態 chip

#### Scenario: 狀態 chip 配色

- **WHEN** 渲染狀態 chip
- **THEN** strong-trend / mild-trend 用紅或金（紅漲意涵）
- **AND** random 用 dim 色
- **AND** mild-mean-revert / strong-mean-revert 用金或綠（綠跌意涵）

#### Scenario: 資料不足降級

- **WHEN** 某尺度 h 為 NaN
- **THEN** 該卡顯示「資料不足」，不顯示 D 值

#### Scenario: hurst 為 null 時不渲染

- **WHEN** `results.hurst === null`
- **THEN** 走勢規律性偵測 panel 不渲染（與 Hurst block 同條件）
