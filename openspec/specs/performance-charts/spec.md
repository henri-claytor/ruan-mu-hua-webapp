# performance-charts Specification

## Purpose

提供績效分析頁的視覺化圖表：累積實現損益曲線（含最大回撤標注）、個股損益貢獻長條圖、持有天數分佈直方圖。將表格無法呈現的時序與分佈資訊以圖表方式呈現。

## Requirements

### Requirement: 累積損益曲線
系統 SHALL 提供 `CumulativePnlChart` 元件，輸入 trades 陣列，渲染依 sellDate 升序的累積實現損益曲線，並標注最大回撤區段。

#### Scenario: 主曲線渲染
- **WHEN** trades 排序後依序累加 pnl
- **THEN** 圖表 X 軸為 sellDate、Y 軸為累積損益（元）；以 AreaChart 呈現主曲線

#### Scenario: 滾動高點顯示
- **WHEN** 圖表渲染
- **THEN** 顯示一條淺灰虛線代表 runningMax（滾動高點）

#### Scenario: 最大回撤標注
- **WHEN** 圖表渲染且最大回撤 < 0
- **THEN** 在最大回撤區段以紅色半透明 ReferenceArea 標注，圖表標題下方副標顯示「最大回撤 −X 元（−Y.Y%）」

#### Scenario: 從未創高點時無回撤標注
- **WHEN** 累積損益從未為正（永遠在 0 以下）
- **THEN** 不顯示 ReferenceArea，副標顯示「從未創淨值高點」

### Requirement: 個股損益貢獻長條圖
系統 SHALL 提供 `StockContributionBar` 元件，水平長條顯示前 15 名個股的 totalPnl 貢獻，並依絕對損益降序排列。

#### Scenario: 排序與顯示
- **WHEN** 元件渲染且 stockStats.length <= 15
- **THEN** 顯示全部，依 `|totalPnl|` 降序

#### Scenario: 超過 15 檔聚合「其他」
- **WHEN** stockStats.length > 15
- **THEN** 顯示前 15 名，剩餘合併為「其他（N 檔）」一條，pnl 為剩餘總和

#### Scenario: 配色為紅漲綠跌
- **WHEN** 顯示某檔的長條
- **THEN** totalPnl > 0 用紅色、totalPnl < 0 用綠色

#### Scenario: 標籤顯示
- **WHEN** 元件渲染
- **THEN** 每條標籤顯示「stockId stockName」+ 「±X,XXX 元」

### Requirement: 持有天數分佈直方圖
系統 SHALL 提供 `HoldingDaysDistribution` 元件，將交易依持有天數分為 6 個固定桶，每桶顯示勝場與敗場的疊加長條。

#### Scenario: 6 個固定分桶
- **WHEN** 元件渲染
- **THEN** X 軸顯示 6 個分桶：「0-7 天」「8-14 天」「15-30 天」「31-60 天」「61-90 天」「90+ 天」

#### Scenario: 疊加勝敗場
- **WHEN** 某桶有交易
- **THEN** 該桶顯示為 stacked bar：紅色（勝場數）+ 綠色（敗場數）

#### Scenario: 無交易的桶
- **WHEN** 某分桶無任何交易
- **THEN** 該桶顯示為 0（空長條）

#### Scenario: holdingDaysHistogram utility
- **WHEN** `holdingDaysHistogram(trades)` 呼叫
- **THEN** 回傳 6 元素陣列，每元素包含 `{ bucket: string, minDays, maxDays, wins: number, losses: number, avgWinReturn: number, avgLossReturn: number }`

### Requirement: PerformanceCharts 容器
系統 SHALL 在績效分析頁提供 `PerformanceCharts` 容器，整合 3 張圖表。

#### Scenario: 摺疊狀態
- **WHEN** 容器首次渲染
- **THEN** 預設展開（按鈕「▼ 收折績效視覺化」）

#### Scenario: 容器內排版
- **WHEN** 容器展開
- **THEN** 由上至下依序顯示：累積損益曲線（全寬）→ 個股貢獻長條 + 持有天數分佈（桌機並排，手機 stack）→ 持有天數 vs 報酬率散布圖（全寬）

#### Scenario: 持有天數 vs 報酬率散布圖
- **WHEN** 容器展開且 trades.length >= 5
- **THEN** 在最末位置渲染 `HoldingReturnScatter` 元件

#### Scenario: 樣本不足時散布圖優雅降級
- **WHEN** trades.length < 5
- **THEN** `HoldingReturnScatter` 顯示「樣本不足無法計算相關性」訊息，不渲染散布圖

#### Scenario: 交易筆數不足時容器顯示提示
- **WHEN** trades.length < 5
- **THEN** 容器仍渲染，但圖表上方顯示「交易筆數較少（< 5 筆），圖表參考度有限」說明
