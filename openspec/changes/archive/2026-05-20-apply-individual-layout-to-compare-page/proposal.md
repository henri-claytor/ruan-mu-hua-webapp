## Why

個股頁與組合頁已套用「結論優先 → 細節在下 + 手動觸發 + 主判斷視覺強調」的統一邏輯。比較頁（ComparePage）仍是舊結構：
- 兩支股票選好就**自動 fetch + 自動顯示**（無確認步驟）
- ActionGuide 在最底（結論在末）
- 比較表格純列表，**沒有「綜合勝出方」結論**
- 命名仍有「期望值（EV）」不一致

為使 4 頁體驗統一，將個股/組合的同套邏輯套到比較頁。

## What Changes

- **新增「開始比較」按鈕**：兩支股票都選好後，按下才計算與顯示
  - `computed` state，stocks 變動 reset
  - 按鈕狀態：未準備 disabled / ready「開始比較」/ 已計算「重新比較」/ loading「載入中...」
  - 結果區只在 `computed && 兩股都有資料` 才渲染
- **ActionGuide 移到頂部**（套用個股頁的金邊強化）
- **新增「綜合勝出方」主判斷卡**：在 ActionGuide 後、比較表前
  - 統計 6 個指標（EV / 勝率 / 損益比 / VaR95 / VaR99 / 趨勢強度）中誰勝出更多
  - 金邊 + 主判斷 chip + 「A 勝 N 項 / B 勝 M 項 / 平手 K 項」+ 「整體推薦：XXX」
- **比較表格升級**：採 `.cmp-table` 統一樣式（已在 index.css 定義）+ `.win` 綠底高亮
- **命名修正**：「期望值（EV）」→「期望報酬率」
- **StockPanel 提示文字**：「選好兩支後按開始比較」

**保留**：
- 比較表的所有指標列（EV / 勝率 / 損益比 / VaR95 / VaR99 / 趨勢強度 H / 象限）
- 「日頻不足 252 筆」警告
- compareGuide 邏輯不動

## Capabilities

### Modified Capabilities

- `result-first-layout`：ComparePage 採與個股/組合一致的「結論優先 + 手動觸發」結構

## Impact

- **影響檔案**：
  - `src/pages/ComparePage.tsx`：state 改造（加 computed）、區塊順序重組、加「綜合勝出方」卡、命名修正
- **不影響**：邏輯、tests、API、Zustand store、`buildCompareGuide`
- **風險**：
  - 「綜合勝出方」門檻是新增邏輯（純 UI 統計，無計算公式）
  - 「開始比較」改變使用者習慣（從自動 → 手動）
