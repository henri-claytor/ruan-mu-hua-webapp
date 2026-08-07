## ADDED Requirements

### Requirement: Individual 分頁結果置頂
Individual 分頁 SHALL 在開啟後無需捲動即可看到期望值、賠率與象限判斷，計算步驟區塊置於結果下方。

#### Scenario: 開啟分頁即見結果
- **WHEN** 使用者開啟 Individual 分頁
- **THEN** 畫面頂部顯示期望值數字（EV）、賠率、損益平衡賠率與象限判斷文字

#### Scenario: 計算步驟置於下方
- **WHEN** 使用者向下捲動 Individual 分頁
- **THEN** 可看到基礎統計（勝率、敗率、Avg Gain/Loss）與賠率計算步驟的完整數字

### Requirement: VaR 分頁結果置頂
VaR 分頁 SHALL 在開啟後無需捲動即可看到 VaR 95% 與 VaR 99% 數字及解讀說明，排序數據表置於下方。

#### Scenario: 開啟分頁即見 VaR 數字
- **WHEN** 使用者開啟 VaR 分頁
- **THEN** 畫面頂部顯示 VaR 95% 與 VaR 99% 的數值與解讀文字

#### Scenario: 排序表置於下方
- **WHEN** 使用者向下捲動 VaR 分頁
- **THEN** 可看到 120 筆報酬率由低至高的排序數據表

### Requirement: MonteCarlo 分頁統計與圖表置頂
MonteCarlo 分頁 SHALL 在開啟後無需捲動即可看到 P5/P50/P95 統計結果與信心區間圖表，基礎參數與路徑明細置於下方。

#### Scenario: 開啟分頁即見模擬結果
- **WHEN** 使用者開啟 MonteCarlo 分頁
- **THEN** 畫面頂部顯示三個時間區間（1/3/5 年）的 P5、P50、P95 終值數字

#### Scenario: 圖表緊鄰統計結果
- **WHEN** 使用者開啟 MonteCarlo 分頁
- **THEN** 扇形圖與長條圖顯示在統計結果區塊附近，不需大量捲動

#### Scenario: 基礎參數與路徑明細置於下方
- **WHEN** 使用者向下捲動 MonteCarlo 分頁
- **THEN** 可看到 μ、σ 參數與 100 條路徑的終值明細

### Requirement: Portfolio 分頁蒙地卡羅結果置頂於 Section 5
Portfolio 分頁的 Section 5 SHALL 先顯示 P5/P50/P95 統計結果與圖表，再顯示基礎參數（μ、σ）與路徑明細。

#### Scenario: Section 5 結果先於參數
- **WHEN** 使用者捲動至 Portfolio 分頁的 Section 5
- **THEN** 先看到 P5/P50/P95 數字與圖表，往下才看到 μ、σ 與路徑明細

### Requirement: 公式正確性維持不變
排版重組 SHALL 不影響任何計算公式的結果，命名範圍（returns、portfolio_returns）MUST 持續正確參照原始數據範圍。

#### Scenario: 重組後 Individual 計算結果不變
- **WHEN** 執行 rebuildIndividual() 並貼入相同數據
- **THEN** 期望值、勝率、賠率結果與重組前完全一致

#### Scenario: 重組後 Portfolio 計算結果不變
- **WHEN** 執行 rebuildPortfolio() 並貼入相同數據
- **THEN** 加權組合期望值、VaR、蒙地卡羅結果與重組前完全一致
