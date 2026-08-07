## MODIFIED Requirements

### Requirement: Individual 分頁結果置頂

Individual 分頁 SHALL 在開啟後無需捲動即可看到期望值、賠率與象限判斷，計算步驟區塊置於結果下方。VaR、蒙地卡羅與 Hurst 區塊緊接於 EV 結果之後，依序排列，均預設展開。數據來源改為 API 抓取，載入中顯示 Skeleton 佔位元件。

#### Scenario: 選股後顯示載入 Skeleton

- **WHEN** 使用者選取股票且 API 尚未回應
- **THEN** 結果區以 Skeleton 卡片佔位，側邊欄 StockSelector 顯示「載入中...」

#### Scenario: 開啟分頁未選股時顯示引導

- **WHEN** 使用者開啟個股分析頁，尚未選取股票
- **THEN** 頁面頂部顯示 StockSelector，結果區顯示空態說明「請選取股票以開始分析」

#### Scenario: 完整結果依序排列

- **WHEN** 個股頁 API 數據載入完成
- **THEN** 畫面由上至下依序顯示：股票名稱標題 → EV 指標區 → VaR 區塊（含頻率標注）→ 蒙地卡羅區塊 → Hurst 區塊（含頻率標注）

## REMOVED Requirements

### Requirement: 空態與 Skeleton 載入態（舊版）
**Reason**: 舊版空態為「請輸入數據」，現在改為「請選取股票」；Skeleton 觸發時機從「資料不足」改為「API 載入中」。
**Migration**: 新版空態與 Skeleton 已整合於上方 MODIFIED 需求中。

## ADDED Requirements

### Requirement: 移除 /hurst 獨立頁面

系統 SHALL 從 NavBar、App 路由中移除 `/hurst` 頁面，Hurst 分析結果僅透過個股頁與投資組合頁呈現。

#### Scenario: 直接訪問 /hurst 時重導向

- **WHEN** 使用者直接訪問 `/hurst` URL
- **THEN** 系統重導向至首頁 `/`

#### Scenario: NavBar 不顯示 Hurst 項目

- **WHEN** 任何頁面渲染 NavBar
- **THEN** 導覽項目只有：首頁 / 個股分析 / 投資組合 / 比較分析，無「Hurst 指數」項目
