## MODIFIED Requirements

### Requirement: Individual 分頁結果置頂

Individual 分頁 SHALL 在開啟後無需捲動即可看到期望值、賠率與象限判斷，並以三層視覺層次（Hero 結論 / 中層指標 / 弱化細節）呈現結果區塊。EV 區塊改為多尺度年化版本（`MultiScaleEVBlock`），其餘區塊維持。計算步驟區塊預設摺疊，使用者點擊後展開。區塊順序為「期望報酬與賠率優勢（多尺度）→ 下行風險 → 趨勢延續性偵測 → 未來資產淨值模擬 → 建議行動參考」，每個區塊副標附加資料頻率標注。數據來源改為 API 抓取，載入中顯示 Skeleton 佔位元件。

#### Scenario: 選股後顯示載入 Skeleton

- **WHEN** 使用者選取股票且 API 尚未回應
- **THEN** 結果區以 Skeleton 卡片佔位，側邊欄 StockSelector 顯示「載入中...」

#### Scenario: 開啟分頁未選股時顯示引導

- **WHEN** 使用者開啟個股分析頁，尚未選取股票
- **THEN** 頁面頂部顯示 StockSelector，結果區顯示空態說明「請選取股票以開始分析」

#### Scenario: 完整結果依序排列

- **WHEN** 個股頁 API 數據載入完成
- **THEN** 畫面由上至下依序顯示：股票名稱標題 → 「期望報酬與賠率優勢」（多尺度）→ 「下行風險：最壞情境虧損」→ 「趨勢延續性偵測」→ 「未來資產淨值模擬」→ 「建議行動參考」

#### Scenario: EV 區塊改為多尺度年化呈現

- **WHEN** EV 區塊（標題：「期望報酬與賠率優勢」）渲染
- **THEN** 區塊內顯示 `MultiScaleEVBlock`，包含狀態判讀橫幅 + 三尺度卡片（短期日頻 60 / 中期月頻 36 / 長期月頻全部）+ Hero 列（長期年化 EV + 象限徽章 large）+ 計算步驟摺疊；副標「EV 期望值多尺度分析（短/中/長）· 使用日報酬 60 筆 + 月報酬 N 筆」

#### Scenario: 月報酬不足 60 筆的降級

- **WHEN** 月報酬筆數 < 60
- **THEN** 不顯示 `MultiScaleEVBlock`，改顯示說明列「月報酬資料不足 5 年，無法使用多尺度 EV」

#### Scenario: VaR 區塊 Hero 結論

- **WHEN** VaR 區塊（標題：「下行風險：最壞情境虧損」）渲染
- **THEN** 區塊頂部顯示 Hero 列（VaR95 大數字 + 風險等級判讀標籤 low/mid/high）；副標附加頻率標注；下方保留 VaR99 與 VarHistogram

#### Scenario: 蒙地卡羅 Hero 結論

- **WHEN** 蒙地卡羅區塊（標題：「未來資產淨值模擬」）渲染
- **THEN** 區塊頂部顯示 Hero 列（5 年 P50 大數字 + 期望範圍副標）；副標附加「使用月報酬 N 筆，初始 100 萬，模擬 100 條路徑」資訊；下方保留 1/3/5 年三組詳細區塊與 FanChart

#### Scenario: 計算步驟預設摺疊

- **WHEN** 任一區塊內的計算步驟首次渲染
- **THEN** 計算步驟區塊預設為收合狀態，標題文字標示「▶ 展開計算步驟」；使用者點擊展開後文字變為「▼ 收折計算步驟」並顯示完整內容

#### Scenario: 區塊副標附加頻率標注

- **WHEN** 任一分析區塊渲染
- **THEN** 標題下方顯示副標，包含資料來源頻率與技術名稱

## ADDED Requirements

### Requirement: 報酬率顯示色彩與符號慣例
所有「報酬率」顯示位置 SHALL 採用台股「紅漲綠跌」慣例：正報酬以紅色 + `+` 號顯示、負報酬以綠色 + `−` 號顯示、0 以中性色顯示。實作上透過 `fmtPct(n)` 與 `colorByReturn(n)` 兩個 utility 函式集中處理。

#### Scenario: 正報酬顯示
- **WHEN** 任何報酬率欄位（EV、Avg Gain、年化 EV 等）的值 > 0
- **THEN** 數字格式為 `+X.XX%`（帶 + 號），ResultCard color 為 `'red'`

#### Scenario: 負報酬顯示
- **WHEN** 任何報酬率欄位（EV、VaR、Avg Loss 等）的值 < 0
- **THEN** 數字格式為 `−X.XX%`（帶 − 號），ResultCard color 為 `'green'`

#### Scenario: 零報酬顯示
- **WHEN** 報酬率值 = 0
- **THEN** 數字格式為 `0.XX%`（無正負號），ResultCard color 為 `'default'`

#### Scenario: Avg Loss 顯示（內部為絕對值）
- **WHEN** EVResult.avgLoss 欄位顯示
- **THEN** 顯示時補回負號 `−X.XX%` 並使用 `'green'` 色（資料層仍維持絕對值不變）

#### Scenario: 非報酬率欄位不適用慣例
- **WHEN** 顯示欄位為勝率、敗率（機率）、Hurst H 值、MC 金額（萬）、風險等級徽章
- **THEN** 沿用既有色彩語意，不套用「紅漲綠跌」慣例
