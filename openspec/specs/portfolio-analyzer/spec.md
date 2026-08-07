# portfolio-analyzer Specification

## Purpose

投資組合分析頁面：使用者透過 StockSelector 選取最多 10 支股票並設定比重，系統自動抓取月/日報酬，計算加權組合的 EV、VaR、Hurst 指數與蒙地卡羅模擬，並提供建議行動參考。頁面採用三層視覺層次（Hero / Normal / Muted）並與個股分析頁的命名與順序一致。

## Requirements

### Requirement: 投資組合以股票選擇器建立

Portfolio Analyzer 頁面 SHALL 讓使用者透過 `StockSelector` 選取每支股票（最多 10 支），選取後自動呼叫月報酬 + 日報酬 API，不再需要手動貼入數據。

#### Scenario: 新增股票至投資組合

- **WHEN** 使用者點擊「+ 新增股票」並從 StockSelector 選取股票
- **THEN** 系統自動抓取該股月報酬與日報酬，抓取完成後啟用比重輸入欄

#### Scenario: 移除股票

- **WHEN** 使用者點擊某支股票的「×」按鈕
- **THEN** 該股從組合中移除，組合結果即時重算

#### Scenario: 同一支股票不可重複加入

- **WHEN** 使用者嘗試選取組合中已存在的股票代號
- **THEN** StockSelector 顯示「{股票名稱} 已在組合中」，不重複加入

### Requirement: 投資組合頁三層視覺層次與命名
Portfolio Analyzer 頁面 SHALL 採用與個股分析頁一致的三層視覺層次（Hero 結論 / 中層指標 / 弱化細節），且區塊名稱以「動詞 / 名詞詞組描述用途」為主標、技術名稱為副標。區塊順序為「組合期望報酬與賠率優勢 → 組合下行風險 → 組合趨勢延續性偵測 → 組合未來淨值模擬 → 建議行動參考」，每個區塊副標附加資料頻率標注。

#### Scenario: 區塊重新命名

- **WHEN** Portfolio 頁面結果區渲染
- **THEN** 區塊標題依序為：「組合期望報酬與賠率優勢」「組合下行風險：最壞情境虧損」「組合趨勢延續性偵測」「組合未來淨值模擬」「建議行動參考」

#### Scenario: 區塊順序「現況 → 推估 → 建議」

- **WHEN** Portfolio 頁面結果區渲染
- **THEN** 區塊由上至下順序為 EV → **個股 vs 組合對比（StockVsPortfolioComparison）** → VaR → Hurst → MC → ActionGuide，蒙地卡羅 MC 排在現況指標之後、ActionGuide 之前

#### Scenario: 個股 vs 組合對比區塊條件性顯示

- **WHEN** 組合 evMulti 或 varResult 任一為 null
- **THEN** 不渲染對比區塊（其他區塊順序不受影響）

#### Scenario: 組合 EV 區塊 Hero 列

- **WHEN** 「組合期望報酬與賠率優勢」區塊渲染
- **THEN** 頂部顯示 Hero 列（組合 EV 大數字 emphasis="hero"），副標附加「使用組合月報酬 N 筆」；下方依序顯示勝率、敗率、實際賠率三張 normal 卡片

#### Scenario: 組合 VaR 區塊 Hero 列

- **WHEN** 「組合下行風險」區塊渲染
- **THEN** 頂部顯示 Hero 列（組合 VaR95 大數字 + 風險等級判讀），副標附加頻率標注（日頻 / 月頻），下方保留 VaR99 與 VarHistogram

#### Scenario: 組合 Hurst 區塊 Hero 列（單尺度）

- **WHEN** 「組合趨勢延續性偵測」區塊渲染
- **THEN** 頂部顯示 Hero 列（H 值 emphasis="hero" + 解讀文字「趨勢延續型 / 隨機遊走型 / 均值回歸型」），副標附加頻率標注；下方保留累積偏差圖

#### Scenario: 組合 MC 區塊 Hero 列

- **WHEN** 「組合未來淨值模擬」區塊渲染
- **THEN** 頂部顯示 Hero 列（5 年 P50 大數字 + 「期望範圍 P5: x 萬 ~ P95: y 萬」副標），副標附加「使用組合月報酬 N 筆，初始 100 萬」資訊；下方保留 1/3/5 年三組詳細區塊與 FanChart

#### Scenario: 基礎統計弱化呈現

- **WHEN** 任一區塊內含基礎統計（如 EV 的勝敗率/Avg Gain/Avg Loss、MC 的 μ/σ/路徑數）
- **THEN** 改為 inline 緊湊行（text-small + text-faint/dim），不再使用 ResultCard 包裝

#### Scenario: ActionGuide 仍位於最下方

- **WHEN** 完整結果區渲染
- **THEN** ActionGuide 為最後一個區塊，在 MC 之後

### Requirement: 投資組合輸入區塊位於頁面頂部且可摺疊
Portfolio Analyzer 頁面 SHALL 把「股票選取與比重設定」區塊放在頁面頂部（緊接頁面標題下方），且該區塊為可摺疊容器，預設展開狀態依輸入完成度決定。

#### Scenario: 輸入區塊置於頁面頂部
- **WHEN** Portfolio 頁面渲染
- **THEN** 由上至下順序為：頁面標題列 → 股票選取與比重設定（可摺疊）→ 結果區（EV/VaR/Hurst/MC/ActionGuide）

#### Scenario: 未完成輸入時預設展開
- **WHEN** 頁面首次渲染且 `ready === false`（任一股未選或權重合計 ≠ 100%）
- **THEN** 股票選取區塊預設為展開狀態，按鈕標題顯示「▼ 收折股票選取」

#### Scenario: 已完成輸入時預設收合
- **WHEN** 頁面首次渲染且 `ready === true`（從 store 讀取的歷史輸入已完整）
- **THEN** 股票選取區塊預設為收合狀態，按鈕標題顯示「▶ 展開股票選取」，使用者可點擊展開以修改

#### Scenario: 使用者手動切換不被自動覆寫
- **WHEN** 使用者已手動展開或收合股票選取區塊，後續因任何狀態變化（如新增股票、調整權重）導致 `ready` 狀態切換
- **THEN** 區塊維持使用者最後的選擇，不再依 `ready` 自動覆寫

### Requirement: 加權組合期望值計算
Portfolio Analyzer SHALL 計算每支股票的 EV，並以使用者設定的比重計算加權組合 EV。

#### Scenario: 顯示加權組合 EV
- **WHEN** 所有股票數據有效且比重合計為 100%
- **THEN** 顯示加權組合 EV = Σ(股票 EV × 比重)，於 Hero 列以大數字呈現

### Requirement: 組合 VaR 計算
Portfolio Analyzer SHALL 計算加權組合報酬率序列的 VaR 95% 與 VaR 99%。

#### Scenario: 顯示 VaR 數值
- **WHEN** 加權組合報酬率序列計算完成
- **THEN** 顯示 VaR 95%（第 6 小值）與 VaR 99%（第 2 小值），單位為 %

#### Scenario: VaR 解讀說明
- **WHEN** VaR 計算完成
- **THEN** 每個 VaR 數值旁顯示說明文字：「有 5% 機率虧損超過 XX%」

### Requirement: 組合蒙地卡羅模擬
Portfolio Analyzer SHALL 對加權組合執行蒙地卡羅模擬，顯示 1 年、3 年、5 年的 P5/P50/P95 終值（以初始 100 萬元計算）。

#### Scenario: 模擬路徑數量
- **WHEN** 執行蒙地卡羅模擬
- **THEN** 預設執行 100 條模擬路徑

### Requirement: 蒙地卡羅計算公式
Portfolio Analyzer 的蒙地卡羅結果 SHALL 使用對數常態分布假設：終值 = 初始值 × exp(Σ(μ − σ²/2 + σ × Z))，其中 Z ~ N(0,1)。

#### Scenario: μ、σ 計算方式
- **WHEN** 加權組合報酬率序列確定後
- **THEN** μ = AVERAGE(portfolio_returns)，σ = STDEV(portfolio_returns)

### Requirement: 組合 Hurst 嚴格多尺度（與個股頁一致）
組合分析頁 Hurst 區塊 SHALL 採用嚴格多尺度模式：所有股票日報酬 ≥ 240 時顯示多尺度 Hurst；任一股票不足時顯示「資料不足」說明列，**不 fallback 至單尺度**（與個股分析頁行為一致）。

#### Scenario: 所有股票日報酬充足時用多尺度
- **WHEN** 所有股票 dailyReturns.length ≥ 240
- **THEN** 計算 weightedDaily240 = `calcPortfolioReturns(stocks.map(s => s.dailyReturns.slice(-240)), weights)`；呼叫 `calcMultiScaleHurst(weightedDaily240)` 取得多尺度結果；UI 用 `MultiScaleHurstBlock` 渲染，含 `titleOverride="組合趨勢延續性偵測"`

#### Scenario: 任一股票日報酬不足時顯示說明列
- **WHEN** 任一股票 dailyReturns.length < 240
- **THEN** 不渲染 Hurst 區塊主體；改顯示說明列：「組合趨勢延續性偵測未顯示：所有股票日報酬必須 ≥ 240 筆才能計算多尺度 Hurst。目前 {缺少股票名稱列表} 不足。」

#### Scenario: 不再 fallback 至單尺度
- **WHEN** 任一股票日報酬 < 240
- **THEN** 系統不呼叫 `calcHurst` 計算單尺度 Hurst；不渲染既有 `PortfolioHurstBlock` 元件（該元件已移除）

### Requirement: 組合 ActionGuide 接收 divergence 訊號
`buildPortfolioGuide` 函式 SHALL 接受可選參數 `evDivergence?: EVDivergence` 與 `hurstDivergence?: Divergence`，並依其值產生對應建議文字。

#### Scenario: 短期動能轉弱
- **WHEN** `evDivergence === 'short-deteriorating'`
- **THEN** ActionGuide 顯示「⚠ 組合短期年化 EV 顯著低於長期，近期表現轉弱」

#### Scenario: 短期動能轉強
- **WHEN** `evDivergence === 'short-improving'`
- **THEN** ActionGuide 顯示「⚠ 組合短期年化 EV 顯著高於長期，動能轉強」

#### Scenario: Hurst 短期轉弱
- **WHEN** `hurstDivergence === 'short-weakening'`
- **THEN** ActionGuide 顯示「⚠ 組合短期 H 顯著低於長期，趨勢動能可能轉弱」

#### Scenario: Hurst 短期轉強
- **WHEN** `hurstDivergence === 'short-strengthening'`
- **THEN** ActionGuide 顯示「⚠ 組合短期 H 顯著高於長期，動能轉強」

#### Scenario: stable 或 undefined 不顯示 divergence 訊息
- **WHEN** divergence 為 'stable' / 'mixed' / undefined
- **THEN** 不產生對應 divergence 建議

### Requirement: 組合 MC μ 套用紅漲綠跌
組合 MC 區塊（`PortfolioMcBlock`）顯示 μ（月均報酬）時 SHALL 套用 `fmtPct + colorByReturn` 紅漲綠跌慣例。

#### Scenario: μ 為正
- **WHEN** mcResult.mu > 0
- **THEN** μ 顯示為 `+X.XX%`（紅色）

#### Scenario: μ 為負
- **WHEN** mcResult.mu < 0
- **THEN** μ 顯示為 `−X.XX%`（綠色）

#### Scenario: μ 為 0
- **WHEN** mcResult.mu === 0
- **THEN** μ 顯示為 `0.0000%`（中性色）
