## ADDED Requirements

### Requirement: 矩陣表上方四象限圖例
系統 SHALL 在 `StockQuadrantMatrix` 元件內部、表格之前提供 `QuadrantLegend` 元件，顯示 5 個分類的彩色說明卡。

#### Scenario: 圖例顯示 5 個分類
- **WHEN** 矩陣表渲染
- **THEN** 表格上方顯示 5 個分類說明卡：Q1 打法好・結果好 / Q2 打法差・結果好 / Q3 打法好・結果差 / Q4 打法差・結果差 / 單向紀錄；前 4 卡用 2×2 grid，單向紀錄獨佔下方一行

#### Scenario: 圖例配色與徽章一致
- **WHEN** 圖例渲染
- **THEN** 每個分類卡的配色與該分類的 QuadrantBadge 一致（Q1 綠、Q2 indigo、Q3 amber、Q4 紅、單向紀錄 slate）

#### Scenario: 圖例含簡述
- **WHEN** 圖例每張卡渲染
- **THEN** 顯示分類標題（如「打法好・結果好」）+ 1–2 句簡述（如「賠率高 + 獲利因子高，策略與執行雙優」）

### Requirement: 矩陣表「診斷摘要」文字欄
系統 SHALL 將 `StockQuadrantMatrix` 既有「診斷」欄（emoji 計數）改為「診斷摘要」文字欄，每股顯示 1 句具體文字描述。

#### Scenario: 全敗 ≥ 3 筆摘要
- **WHEN** 某股 nWins === 0 且 nLosses >= 3
- **THEN** 顯示「N 筆全敗，平均虧損 X.X%，停損紀律需改善」

#### Scenario: 全敗 2 筆摘要
- **WHEN** 某股 nWins === 0 且 nLosses === 2
- **THEN** 顯示「N 筆全敗，疑似未停損」

#### Scenario: 全勝 ≥ 5 筆摘要
- **WHEN** 某股 nLosses === 0 且 nWins >= 5
- **THEN** 顯示「N 筆全勝，均報酬 X.X%」，並依平均報酬與持有天數附加效率描述：< 10% → 「屬薄利多筆型」、> 25% → 「高報酬選股精準」、< 15 天 → 「短週期高效率」

#### Scenario: 全勝 < 5 筆摘要
- **WHEN** 某股 nLosses === 0 且 nWins < 5
- **THEN** 顯示「N 筆全勝，樣本少參考性有限」

#### Scenario: 賠率偏低摘要
- **WHEN** 某股有勝有敗且 payoffRatio < 0.8
- **THEN** 顯示「賠率 X.XX 偏低，靠勝率撐場，結構脆弱」

#### Scenario: 資金管理問題摘要
- **WHEN** 某股 payoffRatio >= 1.5 且 profitFactor < 1.0
- **THEN** 顯示「邏輯對（賠率 X.XX）但押注管理有問題（PF Y.YY）」

#### Scenario: 集中度高摘要
- **WHEN** 某股 |pnlContribution| > 0.2
- **THEN** 顯示「貢獻整體 X.X%，集中度高」

#### Scenario: 雙優摘要
- **WHEN** 某股 payoffRatio >= 1.5 且 profitFactor >= 2.0
- **THEN** 顯示「打法與結果雙優（賠率 X.XX、PF Y.Y）」

#### Scenario: 規則優先順序
- **WHEN** 多條規則同時符合
- **THEN** 依優先順序回傳第一條：全敗 → 全勝 → 賠率偏低 → 資金管理 → 集中度 → 雙優 → 樣本不足 → 預設

### Requirement: QuadrantBadge 支援 5 類分類
`QuadrantBadge` 元件 SHALL 接受新的「單向紀錄（全勝或全敗）」標籤，顯示對應的中性配色與 compact 簡短版。

#### Scenario: 完整標籤顯示
- **WHEN** `quadrant === '單向紀錄（全勝或全敗）'`
- **THEN** 渲染中性藍 / slate 樣式 + ClipboardCheck icon

#### Scenario: compact 簡短版
- **WHEN** 同樣 quadrant 且 `compact={true}`
- **THEN** 顯示「單向紀錄」短標

### Requirement: 單向紀錄個股的賠率與獲利因子顯示
矩陣表渲染「單向紀錄」分類的個股時 SHALL 在賠率與獲利因子欄顯示「—」，且不顯示對應進度條。

#### Scenario: 賠率欄顯示
- **WHEN** 某股 quadrant === '單向紀錄（全勝或全敗）'
- **THEN** 賠率欄顯示「—」（淡色 text-faint），不顯示 ∞ 或 0

#### Scenario: 獲利因子欄顯示
- **WHEN** 同上
- **THEN** 獲利因子欄顯示「—」，不顯示 ∞ 或 0

#### Scenario: 進度條不顯示
- **WHEN** 同上
- **THEN** 賠率與獲利因子欄都不顯示進度條（既有 ProgressBar 元件僅在數值有限時渲染）

### Requirement: 4 象限篩選 chips 含「單向」
矩陣表頂部的 4 象限篩選 chips SHALL 擴為 6 個：全部 / Q1 / Q2 / Q3 / Q4 / 單向。

#### Scenario: 5 + 全部 chips
- **WHEN** 篩選列渲染
- **THEN** 顯示 6 個 chips：「全部」「Q1 雙優」「Q2 隱藏風險」「Q3 管理問題」「Q4 待檢討」「單向紀錄」

#### Scenario: 點擊「單向」過濾
- **WHEN** 使用者點擊「單向」chip
- **THEN** 矩陣表僅顯示 quadrant 為「單向紀錄（全勝或全敗）」的個股
