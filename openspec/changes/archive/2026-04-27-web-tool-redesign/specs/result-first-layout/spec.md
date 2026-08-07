## MODIFIED Requirements

### Requirement: Individual 分頁結果置頂

Individual 分頁 SHALL 在開啟後無需捲動即可看到期望值、賠率與象限判斷，計算步驟區塊置於結果下方。VaR 與蒙地卡羅區塊緊接於 EV 結果之後，依序排列，均預設展開。

#### Scenario: 開啟分頁即見結果

- **WHEN** 使用者開啟 Individual 分頁
- **THEN** 畫面頂部顯示期望值數字（EV）、賠率、損益平衡賠率與象限判斷文字

#### Scenario: 完整結果依序排列

- **WHEN** 個股頁有效資料輸入完成
- **THEN** 畫面由上至下依序顯示：EV 指標區 → VaR 區塊 → 蒙地卡羅區塊 → 輸入區

#### Scenario: 計算步驟置於下方

- **WHEN** 使用者向下捲動 Individual 分頁
- **THEN** 可看到基礎統計（勝率、敗率、Avg Gain/Loss）、賠率計算步驟

## ADDED Requirements

### Requirement: 側邊欄導覽（桌機）+ 底部 Tab Bar（手機）

系統 SHALL 將現有的頂部 NavBar 替換為：
- **桌機（md+）**：左側固定寬 200px 的 sidebar，含 Logo、頁面項目清單、active 項目以 `border-l-[3px] border-blue-500 bg-blue-50 text-blue-700` 標示
- **手機（<md）**：底部固定 tab bar，active 項目以 `border-t-[3px] border-blue-500 text-blue-600` 標示

導覽項目清單（順序）：
1. 🏠 首頁（/）
2. 📊 個股分析（/individual）
3. 🗂️ 投資組合（/portfolio）
4. 〰️ Hurst 指數（/hurst）
5. ⚖️ 比較分析（/compare）

#### Scenario: 桌機側邊欄渲染

- **WHEN** 使用者在 768px 以上裝置開啟網站
- **THEN** 頁面左側顯示 200px 固定 sidebar，右側為主內容區

#### Scenario: 手機底部 tab bar 渲染

- **WHEN** 使用者在 768px 以下裝置開啟網站
- **THEN** 頁面底部顯示固定 tab bar，頂部無 NavBar

#### Scenario: Active 項目視覺標示

- **WHEN** 使用者在 `/individual` 頁面
- **THEN** 側邊欄（或底部 tab）的「個股分析」項目以藍色邊框與淡藍背景標示為 active

### Requirement: 空態與 Skeleton 載入態

各分析頁面 SHALL 在資料未輸入時顯示「空態」說明（引導使用者輸入資料），在計算中顯示 Skeleton 佔位元件。

#### Scenario: 個股頁空態顯示

- **WHEN** 使用者首次開啟個股頁，尚未輸入任何資料
- **THEN** 結果區顯示灰色虛線框與「請在下方輸入月報酬率以開始計算」說明文字

#### Scenario: 計算完成後空態消失

- **WHEN** 使用者輸入有效資料（≥ 10 筆）
- **THEN** 空態說明消失，結果區塊即時顯示計算數值
