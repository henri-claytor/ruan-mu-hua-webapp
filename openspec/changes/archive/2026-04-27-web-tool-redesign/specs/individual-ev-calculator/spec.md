## ADDED Requirements

### Requirement: 個股頁整合 VaR 與蒙地卡羅區塊

Individual EV Calculator 頁面 SHALL 在 EV 結果下方新增 VaR 與蒙地卡羅兩個可折疊區塊，使個股頁具備與投資組合頁對等的完整分析能力（詳細規格見 `individual-var-montecarlo` spec）。

#### Scenario: 完整三段結果顯示

- **WHEN** 使用者輸入至少 10 筆有效月報酬率
- **THEN** 頁面依序顯示：① EV 象限與指標、② VaR 95%/99% 直方圖、③ 蒙地卡羅 P5/P50/P95 扇形圖

#### Scenario: 資料不足時僅顯示 EV 空態

- **WHEN** 使用者輸入少於 10 筆資料
- **THEN** 所有結果區塊均隱藏，僅顯示輸入提示

### Requirement: 複製與下載按鈕整合於個股頁

Individual EV Calculator 頁面的結果區 SHALL 提供「複製摘要」與「下載 PNG」按鈕，涵蓋 EV + VaR + 蒙地卡羅的完整摘要（詳細規格見 `data-import-export` spec）。

#### Scenario: 複製摘要包含三段數值

- **WHEN** 使用者在個股頁點擊「複製摘要」
- **THEN** 剪貼簿文字同時包含 EV 指標、VaR 95%/99% 與蒙地卡羅 P50（1/3/5 年）數值
