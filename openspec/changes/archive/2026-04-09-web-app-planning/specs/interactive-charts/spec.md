## ADDED Requirements

### Requirement: 蒙地卡羅路徑扇形圖
Interactive Charts SHALL 在 Portfolio Analyzer 的蒙地卡羅結果區塊顯示路徑扇形圖（Fan Chart），以折線圖呈現 P5/P50/P95 三條邊界與填色區間。

#### Scenario: 扇形圖顯示於統計結果旁
- **WHEN** 蒙地卡羅計算完成
- **THEN** 扇形圖顯示在 P5/P50/P95 數字的右側或下方，X 軸為月份（0–60），Y 軸為終值（萬元）

#### Scenario: P5/P50/P95 三線顏色區分
- **WHEN** 扇形圖渲染完成
- **THEN** P95 為綠線、P50 為藍線、P5 為紅線，P5–P95 區間填充淡藍色

#### Scenario: Hover 顯示數值
- **WHEN** 使用者滑鼠懸停於扇形圖某月份
- **THEN** Tooltip 顯示該月份的 P5、P50、P95 精確數值

### Requirement: VaR 分布長條圖
Interactive Charts SHALL 在 Portfolio Analyzer 的 VaR 區塊顯示報酬率分布長條圖（Histogram），標示 VaR 95% 與 VaR 99% 位置。

#### Scenario: 長條圖顯示分布
- **WHEN** 加權組合報酬率計算完成
- **THEN** 長條圖以 10 個區間顯示 120 筆報酬率的頻率分布，X 軸為報酬率（%），Y 軸為頻數

#### Scenario: VaR 垂直線標示
- **WHEN** 長條圖渲染完成
- **THEN** 圖上顯示兩條垂直線標示 VaR 95%（橘色）與 VaR 99%（紅色）位置

### Requirement: Hurst 累積偏差折線圖
Interactive Charts SHALL 在 Hurst Calculator 頁面顯示累積偏差序列折線圖，視覺化 R/S Analysis 的核心數據。

#### Scenario: 折線圖顯示累積偏差
- **WHEN** H 值計算完成
- **THEN** 折線圖顯示 Xₜ 序列，X 軸為月份編號，Y 軸為累積偏差值

#### Scenario: R 範圍標示
- **WHEN** 折線圖渲染完成
- **THEN** 圖上以水平虛線標示 MAX(Xₜ) 與 MIN(Xₜ)，並標示 R = MAX − MIN 範圍

### Requirement: 圖表響應式佈局
所有圖表 SHALL 在不同螢幕尺寸下自動調整寬度，在行動裝置（寬度 < 768px）上以全寬顯示。

#### Scenario: 桌面版圖表寬度
- **WHEN** 瀏覽器寬度 ≥ 768px
- **THEN** 圖表最大寬度為容器寬度的 60%，數字卡片與圖表並排顯示

#### Scenario: 行動版圖表全寬
- **WHEN** 瀏覽器寬度 < 768px
- **THEN** 圖表以全寬顯示，數字卡片在上、圖表在下堆疊排列
