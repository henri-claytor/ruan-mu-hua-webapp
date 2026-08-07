## MODIFIED Requirements

### Requirement: Hurst 累積偏差折線圖

Interactive Charts SHALL 在個股分析頁與投資組合頁的 Hurst 結果區塊顯示累積偏差序列折線圖，視覺化 R/S Analysis 的核心數據。此圖表不再出現於獨立的 /hurst 頁面（已移除）。

#### Scenario: 折線圖顯示累積偏差

- **WHEN** 個股頁或投資組合頁的 Hurst 計算完成
- **THEN** 折線圖顯示 Xₜ 序列，X 軸為資料點編號，Y 軸為累積偏差值

#### Scenario: R 範圍標示

- **WHEN** 折線圖渲染完成
- **THEN** 圖上以水平虛線標示 MAX(Xₜ)（綠色）與 MIN(Xₜ)（紅色），並標示 R = MAX − MIN

#### Scenario: 頻率標注於圖表副標題

- **WHEN** Hurst 使用日頻數據計算
- **THEN** 折線圖副標題顯示「累積偏差序列（Xₜ）— 日頻 N 筆」

#### Scenario: 降級月頻時圖表副標題標注

- **WHEN** Hurst 因日報酬不足改用月報酬計算
- **THEN** 折線圖副標題顯示「累積偏差序列（Xₜ）— 月頻 N 筆」
