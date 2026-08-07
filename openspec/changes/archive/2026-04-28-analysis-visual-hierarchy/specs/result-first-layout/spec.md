## MODIFIED Requirements

### Requirement: Individual 分頁結果置頂

Individual 分頁 SHALL 在開啟後無需捲動即可看到期望值、賠率與象限判斷，並以三層視覺層次（Hero 結論 / 中層指標 / 弱化細節）呈現結果區塊。計算步驟區塊預設摺疊，使用者點擊後展開。區塊順序為「期望報酬與賠率優勢 → 下行風險 → 趨勢延續性偵測 → 未來資產淨值模擬 → 建議行動參考」，每個區塊副標附加資料頻率標注。數據來源改為 API 抓取，載入中顯示 Skeleton 佔位元件。

#### Scenario: 選股後顯示載入 Skeleton

- **WHEN** 使用者選取股票且 API 尚未回應
- **THEN** 結果區以 Skeleton 卡片佔位，側邊欄 StockSelector 顯示「載入中...」

#### Scenario: 開啟分頁未選股時顯示引導

- **WHEN** 使用者開啟個股分析頁，尚未選取股票
- **THEN** 頁面頂部顯示 StockSelector，結果區顯示空態說明「請選取股票以開始分析」

#### Scenario: 完整結果依序排列

- **WHEN** 個股頁 API 數據載入完成
- **THEN** 畫面由上至下依序顯示：股票名稱標題 → 「期望報酬與賠率優勢」→ 「下行風險：最壞情境虧損」→ 「趨勢延續性偵測」→ 「未來資產淨值模擬」→ 「建議行動參考」；不再顯示「軌道分隔線」

#### Scenario: EV 區塊三層視覺層次

- **WHEN** EV 區塊（標題：「期望報酬與賠率優勢」）渲染
- **THEN** 區塊頂部顯示 Hero 列（期望值大數字 + 象限徽章 large 版 + 賠率優勢結論）；中層顯示「實際賠率」「損益平衡賠率」兩張一般指標卡（emphasis="normal"）；底部顯示弱化的「基礎統計 inline 行」（勝率/敗率/Avg Gain/Avg Loss 緊湊一行）；計算步驟改為可摺疊區塊（預設收合，按鈕「▶ 展開計算步驟」）

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

## ADDED Requirements

### Requirement: ResultCard 視覺強調等級
`ResultCard` 共用元件 SHALL 接受 `emphasis: 'hero' | 'normal' | 'muted'` prop（預設 `'normal'`），用以表達卡片在頁面中的視覺權重，並對應不同的字級、配色與邊框樣式。

#### Scenario: hero 等級樣式
- **WHEN** ResultCard 傳入 `emphasis="hero"`
- **THEN** 數值字級採 `text-display`（36px）粗體，背景採對應 color 的較深底色（例如 green → bg-green-50 + border-2 border-green-200）

#### Scenario: muted 等級樣式
- **WHEN** ResultCard 傳入 `emphasis="muted"`
- **THEN** 數值字級降為 `text-body`，文字顏色為 `text-dim`，移除底色與邊框，呈現「弱化次要資訊」的視覺

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
