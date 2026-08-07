## MODIFIED Requirements

### Requirement: 整體績效 Dashboard（PortfolioPerformanceBlock）
系統 SHALL 提供 `PortfolioPerformanceBlock` 元件，以「Hero 列 + 8 張主指標卡 + 弱化細部統計」三層結構呈現整體 Dashboard。

#### Scenario: Hero 列以總實現損益為主數字
- **WHEN** Block 渲染
- **THEN** Hero 列左欄顯示 `ResultCard emphasis="hero"`：標題「總實現損益」、值為 `±xxx,xxx 元`（千分位、紅漲綠跌色）；右欄顯示 4 象限結論徽章（QuadrantBadge size="large"）+ 「賠率 X × 獲利因子 X」副標

#### Scenario: 8 張主指標卡
- **WHEN** Block 渲染
- **THEN** 顯示 8 張 `ResultCard emphasis="normal"`（grid 2 列 × 4 欄，桌機；2 欄 × 4 列，手機）依序為：總實現損益（Hero 同步顯示在第 1 卡）、整體報酬率、整體勝率、獲利因子、平均持有天數、勝場均報酬、敗場均虧損、損益比（賠率）

#### Scenario: 弱化細部統計 inline 行
- **WHEN** Block 渲染
- **THEN** 8 卡片下方顯示 inline 緊湊行（text-small + text-faint/dim）：總投入、最大單筆獲利、最大單筆虧損、最大回撤金額 / 比例、最長持有天數、最短持有天數（不重覆已在主層的指標）

#### Scenario: 4 象限與既有 EV 4 象限分開
- **WHEN** Block 渲染的徽章
- **THEN** 顯示 `PerformanceQuadrant` 標籤（含可能的「單向紀錄」），不使用既有 EV 的「高賠率正期望值」標籤

#### Scenario: 計算依據摺疊
- **WHEN** Block 底部「▶ 展開計算依據」被點擊
- **THEN** 展開區塊顯示各指標的公式與所用筆數
