## ADDED Requirements

### Requirement: 比較頁期望報酬率採「最近 1 年」尺度

`ComparePage` 的期望報酬率、勝率、實際損益比 SHALL 採用個股頁的 medium scale（最近 1 年，日報酬 240 筆），與個股頁主判斷一致。

#### Scenario: 兩股皆 daily ≥ 240 筆

- **WHEN** A、B 兩股的 dailyReturns 都 ≥ 240
- **THEN** 期望報酬率 / 勝率 / 損益比皆來自 `calcMultiScaleEV.medium.ev`
- **AND** scale label 為「最近 1 年」

#### Scenario: 某股 daily 60–239 → fallback short

- **WHEN** 某股 dailyReturns 60–239
- **THEN** 該股的期望報酬率採 `calcMultiScaleEV.short`
- **AND** scale label 為「最近 3 個月」

#### Scenario: 某股 daily < 60 → fallback long

- **WHEN** 某股 dailyReturns < 60
- **THEN** 該股的期望報酬率採 `calcMultiScaleEV.long`（月報酬 60 筆）
- **AND** scale label 為「最近 5 年」

### Requirement: 比較表標示資料時間尺度

`ComparePage` 比較表頂部 SHALL 明確標示每個指標的時間尺度。

#### Scenario: 表頂說明區

- **WHEN** 比較表渲染
- **THEN** 表頂 banner 含兩行資訊：
  - 「🟢 綠色背景 = 該項目較佳」
  - 「資料尺度 — 期望報酬率：{scaleLabel} · 下行虧損 / 趨勢強度：{freqLabel}」

#### Scenario: 綜合勝出方副標

- **WHEN** 綜合勝出方主判斷卡渲染
- **THEN** 副標含「6 項指標統計 · 基於 {scaleLabel} 表現」

### Requirement: 不同股票尺度不一致時取 A 的尺度標示

當 A、B 兩股使用不同 scale（因樣本不足）時，表頂統一顯示 A 的 scale label，避免混淆。

#### Scenario: A medium、B short

- **WHEN** A 用 medium、B 用 short
- **THEN** 表頂 scale label 顯示「最近 1 年（A）/ 最近 3 個月（B）」雙標
