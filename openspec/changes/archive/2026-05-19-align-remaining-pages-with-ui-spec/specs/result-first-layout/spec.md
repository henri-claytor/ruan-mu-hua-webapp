## ADDED Requirements

### Requirement: PortfolioPage ui-spec 對齊

系統 SHALL 使 `PortfolioPage` 視覺結構對齊 ui-spec 範本：加入股票 field + chips、actions 按鈕、組合加權配置 port-row、組合風險與報酬概覽 3 cols + stats-row + sbadge。

#### Scenario: 加入股票 field 與 chips

- **WHEN** PortfolioPage 渲染
- **THEN** 頂部顯示 `.field`（含 label「加入股票」+ StockSelector + 「＋ 加入」`.btn-solid`）
- **AND** 已選個股以 `.chip` 列顯示（金色 pill 樣式 + × 移除）

#### Scenario: actions 按鈕列

- **WHEN** 加入股票區後
- **THEN** 顯示 `.actions` row（複製摘要 `.btn-ghost` + 計算組合 `.btn-solid`，右對齊）

#### Scenario: 組合加權配置 panel

- **WHEN** 「組合加權配置」panel 渲染
- **THEN** 內含多列 `.port-row`，每列包含：股票名 / 權重% / 進度條（金棕填充）/ 貢獻 EV（紅色）/ × 移除
- **AND** 每列底部金色 1px 分隔線（最後一列無）

#### Scenario: 組合風險與報酬 3 cols

- **WHEN** 「組合風險與報酬概覽」panel 渲染
- **THEN** 含 3 個 `.evcol`（cream 底 + 金色淡邊）：EV / VaR / Hurst
- **AND** 數字採 serif 24px + 紅漲綠跌（EV 紅 / VaR 綠 / Hurst 金棕）

#### Scenario: 模擬結果 stats row

- **WHEN** 3 cols 之後
- **THEN** 顯示 `.stats-row`（上下 border）：「模擬結果」+ P5（綠）+ P50（紅）+ P95（紅），各以 `.sdiv` 直線分隔

#### Scenario: 結論 sbadge

- **WHEN** stats-row 之後
- **THEN** 顯示 `.sbadge`（含 pulse 圓點 + 結論文字「整體配置具正期望值，建議維持現有比例」之類）

### Requirement: ComparePage ui-spec 對齊

系統 SHALL 使 `ComparePage` 採雙欄輸入 + cmp-table + 綜合建議結構。

#### Scenario: 雙欄輸入 field

- **WHEN** ComparePage 渲染
- **THEN** 顯示 `.field` 含 2 欄 grid（股票 A + 股票 B），每欄帶 `.field-label`

#### Scenario: actions

- **WHEN** field 之後
- **THEN** 顯示複製摘要 `.btn-ghost` + 開始比較 `.btn-solid`

#### Scenario: 指標對比 cmp-table

- **WHEN** 「指標對比總覽」panel 渲染
- **THEN** 內含 `.cmp-table`，表頭為 serif 11px + 金色 letter-spacing
- **AND** 每列含 metric label（dim 色）+ 兩股值（num 14px serif）
- **AND** 優勢方 cell 套 `.win` class（綠底高亮 + 加粗）
- **AND** 數值正負對應紅 / 綠

#### Scenario: 綜合建議 diag-items

- **WHEN** 「綜合建議」panel 渲染
- **THEN** 含 2 個 `.diag-item`：優勢方推薦用 `.ok`（綠系）、輔助建議用 `.warn`（金棕系）

### Requirement: PerformancePage ui-spec 對齊

系統 SHALL 使 `PerformancePage` 採 upload-area + metrics-grid + 三色 diag-item 結構。

#### Scenario: Upload area 樣式

- **WHEN** trades.length === 0
- **THEN** 顯示 `.upload-area`：dashed 金邊（rgba(154,122,46,0.25)、border-2、padding 40px、置中文字）
- **AND** hover 時邊框變實金棕 + 背景淡金棕

#### Scenario: actions 按鈕列

- **WHEN** upload-area 之後
- **THEN** 顯示「手動輸入」`.btn-ghost` + 「匯出報告」`.btn-solid`

#### Scenario: 績效指標 metrics-grid

- **WHEN** 「績效指標總覽」panel 渲染（PortfolioPerformanceBlock）
- **THEN** 8 個 metric-card 採 `.metric-card` 樣式：cream 底（bg-card2）+ 金色淡邊
- **AND** 每張卡含 label（10.5px、dim）+ value（serif 22px、紅漲綠跌）+ note（10.5px、dim）

#### Scenario: 整體結論 sbadge

- **WHEN** metric-cards 之後
- **THEN** 顯示 `.sbadge` 結論（如「整體打法品質良好，期望值為正」）

#### Scenario: 自動診斷三色 diag-item

- **WHEN** DiagnosisPanel 渲染
- **THEN** advantage 用 `.diag-item.ok`（綠 + check icon）
- **AND** warning 用 `.diag-item.warn`（金 + alert-triangle icon）
- **AND** alert 用 `.diag-item.bad`（紅 + x-circle icon）

### Requirement: 共用元件 — Panel / StatusBadge / Sdiv

系統 SHALL 提供 3 個共用元件以統一 ui-spec 結構：

- `<Panel title sub>{children}</Panel>` → 套用 `.panel` 樣式 + serif 標題 + dim 副標
- `<StatusBadge>{children}</StatusBadge>` → 套用 `.sbadge` + 自動加 pulse `.sdot`
- `<Sdiv />` → 1px×13px 金色直立分隔線

#### Scenario: Panel 結構

- **WHEN** `<Panel title="X" sub="Y">` 渲染
- **THEN** 外層 `bg-surface border border-base rounded-lg p-[26px]`
- **AND** 內含 serif h2 標題 + sans 11.5px 副標 + children

#### Scenario: StatusBadge 含 pulse dot

- **WHEN** `<StatusBadge>` 渲染
- **THEN** 結構為 inline-flex `.sbadge` 樣式，文字前自動含 `.sdot` 圓點（2s pulse 動畫）

#### Scenario: Sdiv 分隔線

- **WHEN** `<Sdiv />` 渲染
- **THEN** 輸出 `<span className="w-px h-3 bg-[rgba(154,122,46,0.18)]" />`
