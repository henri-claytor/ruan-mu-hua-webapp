## ADDED Requirements

### Requirement: 投資組合頁三層視覺層次與命名
Portfolio Analyzer 頁面 SHALL 採用與個股分析頁一致的三層視覺層次（Hero 結論 / 中層指標 / 弱化細節），且區塊名稱以「動詞 / 名詞詞組描述用途」為主標、技術名稱為副標。區塊順序為「組合期望報酬與賠率優勢 → 組合下行風險 → 組合趨勢延續性偵測 → 組合未來淨值模擬 → 建議行動參考」，每個區塊副標附加資料頻率標注。

#### Scenario: 區塊重新命名

- **WHEN** Portfolio 頁面結果區渲染
- **THEN** 區塊標題依序為：「組合期望報酬與賠率優勢」「組合下行風險：最壞情境虧損」「組合趨勢延續性偵測」「組合未來淨值模擬」「建議行動參考」

#### Scenario: 區塊順序「現況 → 推估 → 建議」

- **WHEN** Portfolio 頁面結果區渲染
- **THEN** 區塊由上至下順序為 EV → VaR → Hurst → MC → ActionGuide，蒙地卡羅 MC 排在現況指標之後、ActionGuide 之前

#### Scenario: 組合 EV 區塊 Hero 列

- **WHEN** 「組合期望報酬與賠率優勢」區塊渲染
- **THEN** 頂部顯示 Hero 列（組合 EV 大數字 emphasis="hero"），副標附加「使用組合月報酬 N 筆」；下方依序顯示勝率、敗率、實際賠率三張 normal 卡片

#### Scenario: 組合 VaR 區塊 Hero 列

- **WHEN** 「組合下行風險」區塊渲染
- **THEN** 頂部顯示 Hero 列（組合 VaR95 大數字 + 風險等級判讀），副標附加頻率標注（日頻 / 月頻），下方保留 VaR99 與 VarHistogram

#### Scenario: 組合 Hurst 區塊 Hero 列（單尺度）

- **WHEN** 「組合趨勢延續性偵測」區塊渲染
- **THEN** 頂部顯示 Hero 列（H 值 emphasis="hero" + 解讀文字「趨勢延續型 / 隨機遊走型 / 均值回歸型」），副標附加頻率標注；下方保留 R / S / 累積偏差圖

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

## REMOVED Requirements

### Requirement: 投資組合整合 Hurst 指數結果區
**Reason**：原規格描述「Hurst 區塊 SHALL 在蒙地卡羅之後顯示」，新順序中 Hurst 移到 MC 之前，此規格已不適用。
**Migration**：替換為新的「投資組合頁三層視覺層次與命名」規格中的「組合 Hurst 區塊 Hero 列（單尺度）」場景，行為相同（依雙頻計算規則優先日頻、降級月頻），僅順序與呈現樣式調整。
