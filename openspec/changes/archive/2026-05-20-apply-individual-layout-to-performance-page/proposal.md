## Why

個股 / 組合 / 比較三頁已套用「結論優先 + 主判斷金邊」邏輯。績效頁（PerformancePage）為「事後分析」工具，雖無 API 查詢流程，但同樣可受惠於：
- **結論優先**：重點建議 + 自動診斷移到 Dashboard 之前
- **主判斷視覺強調**：「總實現損益」加金邊主判斷
- **命名一致性**：確保所有殘留術語已替換

完成此 change 後，4 個分析頁體驗將完全統一。

## What Changes

- **區塊順序重排**：
  - 重點建議從第 5 → 第 3（Dashboard 之前）
  - 自動診斷從第 4 → 第 4（保留位置但讓出空間給 Dashboard 上方）
  - 新順序：
    ```
    1. Header + 隱私 banner
    2. 資料輸入區
    3. 🆕 重點建議（移到 Dashboard 之前）
    4. 🆕 自動診斷（移到 Dashboard 之前）
    5. 整體績效 Dashboard
    6. 個股矩陣表
    7. 績效視覺化
    8. 原始交易表格
    ```

- **「總實現損益」加金邊主判斷**：PortfolioPerformanceBlock 內 8 個 metric card 改造
  - 「總實現損益」卡升級為主判斷樣式：金邊 + 主判斷 chip + 40px 大數字
  - 其他 7 卡維持 cream 樣式
  - 用 grid layout 讓主卡占 2 columns（突出視覺）

- **命名抽查**：確認 PortfolioPerformanceBlock 計算步驟、Charts subtitle 等殘留「賠率/EV」字眼

- **PDF section ids 重排**：
  - 舊：banner / dashboard / diagnosis / recommendations / matrix / charts / trades
  - 新：banner / **recommendations** / **diagnosis** / dashboard / matrix / charts / trades

- **不需要手動觸發按鈕**：績效頁資料來自 user 輸入（store），不適用「查詢」邏輯

## Capabilities

### Modified Capabilities

- `performance-page-layout`：區塊順序重排 + 主判斷視覺強調

## Impact

- **影響檔案**：
  - `src/pages/PerformancePage.tsx`（區塊順序 + PDF section ids）
  - `src/components/trade/PortfolioPerformanceBlock.tsx`（總實現損益主判斷強化）
- **不影響**：DiagnosisPanel、RecommendationPanel 內部結構、計算邏輯、tests
- **風險**：
  - PDF 順序改變 → 既有 PDF 檔案與新版視覺差異
  - 主判斷 chip 在 PortfolioPerformanceBlock 是首次出現，可能與 Dashboard 整體標題衝突
