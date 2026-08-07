## MODIFIED Requirements

### Requirement: Individual 分頁結果置頂
Individual 分頁 SHALL 在開啟後無需捲動即可看到期望值、賠率與象限判斷，計算步驟區塊置於結果下方。Hurst Exponent 區塊 SHALL 附加於賠率計算步驟之後。

#### Scenario: 開啟分頁即見結果
- **WHEN** 使用者開啟 Individual 分頁
- **THEN** 畫面頂部顯示期望值數字（EV）、賠率、損益平衡賠率與象限判斷文字

#### Scenario: 計算步驟置於下方
- **WHEN** 使用者向下捲動 Individual 分頁
- **THEN** 可看到基礎統計（勝率、敗率、Avg Gain/Loss）、賠率計算步驟與 Hurst Exponent 區塊

### Requirement: Portfolio 分頁蒙地卡羅結果置頂於 Section 5
Portfolio 分頁的 Section 5 SHALL 先顯示 P5/P50/P95 統計結果與圖表，再顯示基礎參數（μ、σ）與路徑明細。Hurst Exponent 區塊 SHALL 附加於 Section 5 蒙地卡羅模擬之後。

#### Scenario: Section 5 結果先於參數
- **WHEN** 使用者捲動至 Portfolio 分頁的 Section 5
- **THEN** 先看到 P5/P50/P95 數字與圖表，往下才看到 μ、σ 與路徑明細

#### Scenario: Hurst 區塊在 Section 5 之後
- **WHEN** 使用者繼續向下捲動 Portfolio 分頁
- **THEN** 可看到 Section 6（Hurst Exponent）區塊，顯示加權組合的 H 值與解讀
