# result-first-layout Specification

## Purpose

定義各分析頁面的視覺層次、區塊順序與導覽結構。重點為三層視覺層次（Hero / Normal / Muted）、結論優先呈現、計算步驟可摺疊、區塊命名以「動詞 / 名詞詞組描述用途」為主標、技術名稱為副標。

## Requirements

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
- **THEN** 畫面由上至下依序顯示：股票名稱標題 → 「期望報酬與賠率優勢」→ 「下行風險：最壞情境虧損」→ 「趨勢延續性偵測」→ 「未來資產淨值模擬」→ 「建議行動參考」；不再顯示「軌道分隔線」

#### Scenario: EV 區塊改為多尺度年化呈現

- **WHEN** EV 區塊（標題：「期望報酬與賠率優勢」）渲染
- **THEN** 區塊內顯示 `MultiScaleEVBlock`，包含狀態判讀橫幅 + 三尺度卡片（短期日頻 60 / 中期月頻 36 / 長期月頻全部）+ Hero 列（長期年化 EV + 象限徽章 large）+ 計算步驟摺疊；副標「EV 期望值多尺度分析（短/中/長）· 使用日報酬 60 筆 + 月報酬 N 筆」

#### Scenario: 月報酬不足 60 筆的降級

- **WHEN** 月報酬筆數 < 60
- **THEN** 不顯示 `MultiScaleEVBlock`，改顯示說明列「月報酬資料不足 5 年，無法使用多尺度 EV」

#### Scenario: VaR 區塊 Hero 結論

- **WHEN** VaR 區塊（標題：「下行風險：最壞情境虧損」）渲染
- **THEN** 區塊頂部顯示 Hero 列（VaR95 大數字 + 風險等級判讀標籤 low/mid/high）；副標附加「使用日報酬 N 筆」或「使用月報酬 N 筆」頻率標注；下方保留 VaR99 與 VarHistogram

#### Scenario: 蒙地卡羅 Hero 結論

- **WHEN** 蒙地卡羅區塊（標題：「未來資產淨值模擬」）渲染
- **THEN** 區塊頂部顯示 Hero 列（5 年 P50 大數字 + 「期望範圍 P5: x 萬 ~ P95: y 萬」副標）；副標附加「使用月報酬 N 筆，初始 100 萬，模擬 100 條路徑」資訊；下方保留 1 年 / 3 年 / 5 年三組 P5/P50/P95 詳細區塊與 FanChart

#### Scenario: 計算步驟預設摺疊

- **WHEN** 「期望報酬與賠率優勢」區塊內的計算步驟首次渲染
- **THEN** 計算步驟區塊預設為收合狀態，標題文字標示「▶ 展開計算步驟」；使用者點擊展開後文字變為「▼ 收折計算步驟」並顯示完整內容

#### Scenario: 區塊副標附加頻率標注

- **WHEN** 任一分析區塊渲染
- **THEN** 標題下方顯示副標，包含資料來源頻率（如「使用日報酬 252 筆」「使用月報酬 120 筆」），並標示技術名稱（如「EV 期望值分析」「Hurst 指數，60/120/240 日多尺度」）

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

### Requirement: ResultCard 視覺強調等級
`ResultCard` 共用元件 SHALL 接受 `emphasis: 'hero' | 'normal' | 'muted'` prop（預設 `'normal'`），用以表達卡片在頁面中的視覺權重，並對應不同的字級、配色與邊框樣式。

#### Scenario: hero 等級樣式
- **WHEN** ResultCard 傳入 `emphasis="hero"`
- **THEN** 數值字級採 `text-display`（36px）粗體，背景採對應 color 的較深底色（例如 green → bg-green-50 + border-2 border-green-300）

#### Scenario: muted 等級樣式
- **WHEN** ResultCard 傳入 `emphasis="muted"`
- **THEN** 數值字級降為 `text-body`，文字顏色為 `text-dim`，移除底色與邊框

#### Scenario: 預設 normal 等級向後相容
- **WHEN** ResultCard 未傳入 `emphasis` 或傳入 `'normal'`
- **THEN** 沿用既有外觀（既有測試與既有頁面行為不變）

#### Scenario: large prop 與 emphasis 共存
- **WHEN** ResultCard 同時傳入 `large={true}` 與 `emphasis="normal"`
- **THEN** 視覺上等價於 `emphasis="hero"`（保留 `large` 為向後相容 alias）

### Requirement: QuadrantBadge 大版本
`QuadrantBadge` 共用元件 SHALL 接受 `size: 'normal' | 'large'` prop（預設 `'normal'`），large 版本用於 Hero 列。

#### Scenario: normal 等級
- **WHEN** QuadrantBadge 預設或 `size="normal"`
- **THEN** 沿用既有 small 圖標與字級

#### Scenario: large 等級
- **WHEN** QuadrantBadge 傳入 `size="large"`
- **THEN** 圖標放大為 24px、文字升級為 `text-h2` 粗體，並使用較深底色強調

### Requirement: 公式正確性維持不變
排版重組 SHALL 不影響任何計算公式的結果，命名範圍（returns、portfolio_returns）MUST 持續正確參照原始數據範圍。

#### Scenario: 重組後 Individual 計算結果不變
- **WHEN** 執行 rebuildIndividual() 並貼入相同數據
- **THEN** 期望值、勝率、賠率結果與重組前完全一致

#### Scenario: 重組後 Portfolio 計算結果不變
- **WHEN** 執行 rebuildPortfolio() 並貼入相同數據
- **THEN** 加權組合期望值、VaR、蒙地卡羅結果與重組前完全一致

### Requirement: 側邊欄導覽（桌機）+ 底部 Tab Bar（手機）

系統 SHALL 將 NavBar 設計為：
- **桌機（md+）**：左側固定寬 200px 的 sidebar，含 Logo、頁面項目清單、active 項目以 `border-l-[3px] border-blue-500 bg-blue-50 text-blue-700` 標示
- **手機（<md）**：底部固定 tab bar，active 項目以 `border-t-[3px] border-blue-500 text-blue-600` 標示

導覽項目清單（順序）：
1. 🏠 首頁（/）
2. 📊 個股分析（/individual）
3. 🗂️ 投資組合（/portfolio）
4. ⚖️ 比較分析（/compare）
5. 📋 績效分析（/performance）

#### Scenario: 桌機側邊欄渲染

- **WHEN** 使用者在 768px 以上裝置開啟網站
- **THEN** 頁面左側顯示 200px 固定 sidebar，包含 5 個導覽項目，右側為主內容區

#### Scenario: 手機底部 tab bar 渲染

- **WHEN** 使用者在 768px 以下裝置開啟網站
- **THEN** 頁面底部顯示固定 tab bar，包含 5 個圖標（一字排開），頂部無 NavBar

#### Scenario: Active 項目視覺標示

- **WHEN** 使用者在 `/individual` 頁面
- **THEN** 側邊欄（或底部 tab）的「個股分析」項目以藍色邊框與淡藍背景標示為 active

#### Scenario: 績效分析項目 Active 標示

- **WHEN** 使用者在 `/performance` 頁面
- **THEN** 側邊欄（或底部 tab）的「績效分析」項目以藍色邊框與淡藍背景標示為 active

### Requirement: 個股分析頁支援深度連結
個股分析頁（`/individual`）SHALL 支援透過 URL query string `?code=` 自動載入指定股票，與既有手動選股流程共存。

#### Scenario: 透過 query string 載入股票
- **WHEN** 使用者導航至 `/individual?code=2330`
- **THEN** IndividualPage 在 mount 時讀取 `code=2330`，自動觸發 `handleSelect('2330', '')`，載入該股票的 EV / VaR / Hurst / MC 分析

#### Scenario: query string 為空或缺失
- **WHEN** 使用者導航至 `/individual` 沒有 `?code=` 參數
- **THEN** 頁面行為與既有相同（顯示空態，等待使用者用 StockSelector 選股）

#### Scenario: query string 與既有狀態衝突
- **WHEN** 使用者已在頁面上選了 2317，後切換至 `/individual?code=2330`
- **THEN** 以 query string 為主，自動載入 2330（覆寫既有狀態）

#### Scenario: 重複導航至相同 code
- **WHEN** 使用者已載入 2330，再點擊另一個指向 `/individual?code=2330` 的連結
- **THEN** 不重新觸發載入（避免不必要的 API 呼叫）

#### Scenario: 不存在的股票代碼
- **WHEN** `code=9999` 在 stockList 中不存在
- **THEN** 仍嘗試呼叫 API，失敗則顯示既有 error 訊息

### Requirement: HomePage 工具卡片涵蓋全部 4 個分析功能
HomePage SHALL 在工具卡片區塊呈現全部 4 個分析功能（個股、組合、比較、績效），並依「前向 / 後向」分析方向分為兩個視覺群組。

#### Scenario: 前向分析群組（3 張卡）
- **WHEN** HomePage 渲染
- **THEN** 顯示「進場前評估」H2 標題，下方為 3 欄 grid（md:grid-cols-3）含「個股分析」、「投資組合」、「比較分析」三張卡片，連結指向 `/individual`、`/portfolio`、`/compare`

#### Scenario: 後向分析群組（1 張卡）
- **WHEN** HomePage 渲染
- **THEN** 顯示「出場後反思」H2 標題，下方為 1 欄 grid 含「績效分析」卡片，連結指向 `/performance`

#### Scenario: 績效分析卡片內容
- **WHEN** 績效分析卡片渲染
- **THEN** 顯示 Icon.ClipboardCheck、標題「績效分析」、說明「上傳已完成的交易紀錄（CSV 或手動），計算勝率、賠率、獲利因子；自動診斷打法品質與資金管理問題，可匯出 PDF / Excel 報告。」、配色為紫色 hover 變色（hover:border-purple-300 hover:bg-purple-50）

### Requirement: HomePage Hero 副標反映前後向分析
HomePage 的 Hero 區塊副標 SHALL 兩句結構強化「進場前 + 出場後」的閉環概念。

#### Scenario: 副標文字
- **WHEN** Hero 區塊渲染
- **THEN** 副標顯示兩句：「進場前用市場資料評估標的；出場後用交易紀錄反思績效」+「一站式投資分析工具」

### Requirement: HomePage 計算邏輯說明涵蓋績效指標
HomePage 的「計算邏輯說明」區塊 SHALL 由 3 欄擴為 4 欄，新增「賠率與獲利因子」一欄。

#### Scenario: 4 欄並列顯示
- **WHEN** 計算邏輯說明區塊渲染
- **THEN** 顯示 4 個說明卡片：EV、VaR、Hurst、賠率 / 獲利因子，使用 `md:grid-cols-2 lg:grid-cols-4` 響應式 layout

#### Scenario: 賠率與獲利因子內容
- **WHEN** 第 4 個說明卡片渲染
- **THEN** 標題「賠率與獲利因子」，公式內容包含「賠率 = Avg Gain / Avg Loss」與「獲利因子 = Σ獲利金額 / |Σ虧損金額|」

### Requirement: HomePage 使用說明涵蓋績效分析流程
HomePage 的「如何使用」區塊 SHALL 在既有 4 步驟（前向流程）後，加上第 5 條獨立段落（後向流程）。

#### Scenario: 既有 4 步驟保留
- **WHEN** 使用說明區塊渲染
- **THEN** 1–4 步驟與原版內容相同（不變動）

#### Scenario: 第 5 條獨立段落
- **WHEN** 使用說明區塊渲染
- **THEN** 第 4 條後顯示「—— 或 ——」分隔提示，下方為第 5 條：「前往「績效分析」上傳已完成的交易紀錄（CSV 或手動輸入），系統自動產生勝率、賠率、獲利因子分析、4 象限診斷與 PDF / Excel 報告」

### Requirement: 移除 /hurst 獨立頁面

系統 SHALL 從 NavBar、App 路由中移除 `/hurst` 頁面，Hurst 分析結果僅透過個股頁與投資組合頁呈現。

#### Scenario: 直接訪問 /hurst 時重導向

- **WHEN** 使用者直接訪問 `/hurst` URL
- **THEN** 系統重導向至首頁 `/`

#### Scenario: NavBar 不顯示 Hurst 項目

- **WHEN** 任何頁面渲染 NavBar
- **THEN** 導覽項目只有：首頁 / 個股分析 / 投資組合 / 比較分析，無「Hurst 指數」項目

### Requirement: HomePage 主視覺與功能入口（課程質感版）

系統 SHALL 在 HomePage 提供 hero 主視覺、功能入口卡片、與使用步驟說明，採課程質感風格。

#### Scenario: Hero 區塊

- **WHEN** HomePage 載入
- **THEN** 頁面頂部置中顯示 hero：
  - 主標「獲利加速輔助系統」（serif 34px / weight 900 / letter-spacing 5px / 色 `text-main`）
  - 副標兩行（sans 13px / 色 `text-dim`）：「進場前用市場資料評估標的；出場後用交易紀錄反思績效」+「一站式投資分析工具」

#### Scenario: 進場前評估 — 3 卡片 grid

- **WHEN** Hero 之後
- **THEN** 顯示 section label「進場前評估」（serif 15px / 色 `text-gold-dark` / letter-spacing 2px）
- **AND** 下方 3 欄等寬卡片（grid-cols-3，間距 13px）：個股分析 / 投資組合 / 比較分析
- **AND** 每張卡含：icon、serif 標題 16px、sans 描述 12px、底部「開始使用 →」cta

#### Scenario: 出場後反思 — 寬卡片

- **WHEN** 3 卡片之後
- **THEN** 顯示 section label「出場後反思」
- **AND** 下方寬卡片（card-wide，水平佈局）：績效分析 → `/performance`

#### Scenario: 使用步驟 howto

- **WHEN** 寬卡片之後
- **THEN** 顯示 howto 區塊（背景 `bg-card2`、padding 30px）
- **AND** 含標題「如何使用」（serif 13px / 金棕 / letter-spacing 3px）+ 下方 2×2 grid 4 個 step（圓形編號徽章 + 步驟說明文字）

#### Scenario: 卡片互動

- **WHEN** 滑鼠 hover 卡片
- **THEN** 卡片向上位移 3px + 加 shadow + 頂部金棕漸層橫條 scale 動畫

### Requirement: 頁面進入動畫

系統 SHALL 為所有頁面主要區塊加上「漸入 + 上滑」動畫，提升質感。

#### Scenario: 主要元素逐項漸入

- **WHEN** 頁面切換進入
- **THEN** 主要元素套用 `u1`–`u6` class，依序在 0.05s 延遲遞增的時間點完成淡入 + 上滑動畫（duration 0.45s）

### Requirement: 全站採課程質感 Sidebar Layout

系統 SHALL 在 `App.tsx` 採左側固定 196px 深棕 sidebar + 置中（max-w-[980px]）內容區架構，所有頁面共用此 layout。

#### Scenario: 全站佈局

- **WHEN** 任何路由渲染
- **THEN** 畫面結構為：左側 196px 固定 sidebar（深棕 #1f1509 底 + 5 nav item + 金色 active 狀態）+ 右側主內容區（bg-app）
- **AND** 主內容區包在 `.inner`（max-width 980px、padding 52px 28px 100px）


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

## ADDED Requirements (portfolio page layout — mirrors individual)

### Requirement: PortfolioPage 採手動「計算組合」觸發

系統 SHALL 提供「計算組合」按鈕，使用者設定股票與權重後按下才計算與顯示結果。

#### Scenario: 未準備好時按鈕 disabled

- **WHEN** 任何條件不滿足：股票 < 2、權重總和 ≠ 100、任何股票 monthlyReturns < 10、API 載入中
- **THEN** 按鈕 disabled

#### Scenario: 準備好 + 未計算 → enabled「計算組合」

- **WHEN** `ready === true` 且 `computed === false`
- **THEN** 按鈕 enabled，文字「計算組合」

#### Scenario: 已計算後改動 → 重置

- **WHEN** 改變股票、權重或重新 fetch 數據
- **THEN** `computed` reset 為 `false`，結果區塊不渲染（直到再次按下）

#### Scenario: 已計算狀態

- **WHEN** `computed === true` 且 stocks / weights 未變
- **THEN** 按鈕文字「重新計算」（仍 enabled）

#### Scenario: 載入中

- **WHEN** API 載入中
- **THEN** 按鈕文字「載入中...」+ disabled

### Requirement: PortfolioPage 區塊順序（結論優先）

系統 SHALL 使 PortfolioPage 在計算完成後，採與 IndividualPage 一致的「結論優先」區塊順序。

#### Scenario: 區塊由上至下順序

- **WHEN** PortfolioPage 計算完成
- **THEN** 結果區塊由上至下依序為：
  1. Action buttons（複製摘要 / 下載 PNG）
  2. **操作建議**（ActionGuide）
  3. 期望報酬與損益比優勢（MultiScaleEVBlock）
  4. 個股 vs 組合對比（StockVsPortfolioComparison）
  5. 下行風險（PortfolioVarBlock）
  6. 趨勢延續性偵測（MultiScaleHurstBlock）
  7. 走勢規律性偵測（FractalDimensionBlock）
  8. 未來資產淨值模擬（PortfolioMcBlock）

### Requirement: PortfolioVarBlock 採主判斷金邊結構

`PortfolioVarBlock` SHALL 與個股 VarBlock 結構一致：
- 95% 下行虧損為主判斷（金邊 + 主判斷 chip + 風險等級徽章 + 40px 大數字）
- 99% 下行虧損為橫向參考列
- Histogram 在區塊底部

#### Scenario: 95% 主卡渲染

- **WHEN** 計算完成
- **THEN** 顯示主卡「組合 95% 下行虧損」+ 金色 2px 邊框 + 右上「主判斷」chip + 風險等級徽章 + 40px serif 數字 + 底層「N 筆樣本第 5 百分位」

#### Scenario: 99% 橫向參考列

- **WHEN** 主卡之後
- **THEN** 顯示橫向參考列：「99% 下行虧損」+ 「第 1 百分位」+ 20px 數字 + 「有 1% 機率虧損超過 X%」

### Requirement: PortfolioMcBlock 採 3 卡並排結構

`PortfolioMcBlock` SHALL 與個股 McBlock 結構一致：1 年 / 3 年 / 5 年三卡並排，5 年為主判斷。

#### Scenario: 3 卡並排

- **WHEN** 計算完成
- **THEN** 顯示 grid-cols-3：1 年 / 3 年 / 5 年
- **AND** 5 年卡採主判斷樣式（金邊 + 主判斷 chip + 40px + μ/σ 底層）
- **AND** 1 年、3 年卡採普通樣式（cream + 36px）

### Requirement: PortfolioPage 含走勢規律性 D 區塊

系統 SHALL 在 PortfolioPage 的 Hurst 區塊之後加入 FractalDimensionBlock（走勢規律性偵測），與個股頁一致。

#### Scenario: D 區塊渲染條件

- **WHEN** `hurstMulti !== null`
- **THEN** 在 MultiScaleHurstBlock 之後渲染 `<FractalDimensionBlock hurst={hurstMulti} />`

### Requirement: PortfolioPage 命名一致

PortfolioPage 內所有使用者面對的字串 SHALL 與個股頁命名一致：「VaR」→「下行虧損」、「賠率」→「損益比」。

#### Scenario: VarBlock 標題與副標

- **WHEN** PortfolioVarBlock 渲染
- **THEN** 標題為「下行風險：最壞情境虧損」
- **AND** 副標包含「95% / 99% 下行虧損 · 使用 {freqLabel}」（不含 VaR 字眼）

## ADDED Requirements (compare page layout)

### Requirement: ComparePage 採手動「開始比較」觸發

系統 SHALL 提供「開始比較」按鈕，使用者選好兩支股票後按下才計算與顯示結果。

#### Scenario: 任一股票尚未選好或資料不足

- **WHEN** `compareA.monthlyReturns.length < 10` 或 `compareB.monthlyReturns.length < 10`
- **THEN** 按鈕 disabled

#### Scenario: 兩股皆 ready + 未計算 → enabled「開始比較」

- **WHEN** 兩股都已 fetch 完成且 monthlyReturns ≥ 10
- **AND** `computed === false`
- **THEN** 按鈕 enabled，文字「開始比較」

#### Scenario: 已計算 → 「重新比較」

- **WHEN** `computed === true`
- **THEN** 按鈕文字「重新比較」

#### Scenario: 改動 stocks → reset

- **WHEN** compareA / compareB 任一改變（stockCode 或 returns）
- **THEN** `computed` reset 為 `false`

#### Scenario: 載入中

- **WHEN** loadingA || loadingB
- **THEN** 按鈕文字「載入中...」+ disabled

### Requirement: ComparePage 區塊順序（結論優先）

系統 SHALL 使 ComparePage 在按下「開始比較」後採以下區塊順序：

#### Scenario: 順序

- **WHEN** computed === true 且兩股都有完整結果
- **THEN** 結果區由上至下依序為：
  1. 操作建議（ActionGuide，金邊強化）
  2. 綜合勝出方（主判斷卡，金邊）
  3. 比較表（cmp-table 樣式）

### Requirement: 綜合勝出方主判斷卡

系統 SHALL 在比較表前提供「綜合勝出方」主判斷卡，統計兩股在 6 項指標的勝出次數。

#### Scenario: 統計指標

- **WHEN** 渲染綜合勝出方
- **THEN** 統計以下 6 項：期望報酬率、勝率、損益比、95% 下行虧損、99% 下行虧損、趨勢強度 H

#### Scenario: 勝出方計算

- **WHEN** 計算勝出方
- **THEN** A 勝項數 > B → 顯示 labelA、B 勝 > A → 顯示 labelB、相等 → 顯示「平手」

#### Scenario: 卡片樣式

- **WHEN** 卡片渲染
- **THEN** 金邊 2px + 「綜合勝出方」chip + 「整體推薦」標題 + 36px serif 大字勝出方名稱 + 「A 勝 N 項 / B 勝 M 項 / 平手 K 項」副值

### Requirement: 比較表 cmp-table 樣式統一

系統 SHALL 使比較表採用 `.cmp-table` class 與 `.win` 高亮，與績效頁、組合頁一致。

#### Scenario: 表格 class

- **WHEN** 比較表渲染
- **THEN** `<table className="cmp-table">`
- **AND** 表頭採 serif 11px + 金色 letter-spacing（既有 .cmp-table th 樣式）

#### Scenario: 勝出 cell 高亮

- **WHEN** 某指標 A 勝出
- **THEN** A 欄位該 cell 套 `.win` class（綠底 + 加粗）

#### Scenario: 數值 serif

- **WHEN** 數值 cell 渲染
- **THEN** 套 `.num` class（serif 14px + 紅綠）

### Requirement: ComparePage 命名與其他頁一致

#### Scenario: 期望值 → 期望報酬率

- **WHEN** 比較表「期望值（EV）」列渲染
- **THEN** 顯示「期望報酬率」

#### Scenario: 副標白話化

- **WHEN** 頁面副標渲染
- **THEN** 改為「選取兩支股票，並排比較期望報酬率、下行虧損與趨勢強度」（不含 EV / VaR / Hurst 英文）
