## Why

個股分析頁目前有 3 個體驗問題：

1. **自動觸發**：使用者一選股票就立即發 API 抓資料，無法先確認再查；多次切換等於多次浪費 API 與重算
2. **下拉清單不易滾動**：StockSelector 候選清單在資料多時沒有明顯 scroll bar，使用者不知道可以捲
3. **多尺度 EV 標籤抽象**：目前用「短期 / 中期 / 長期」+ 筆數副標（60 / 36 / 全部）。中期是月頻 36 筆（3 年），與短期日頻 60 筆（3 個月）跨度差很大但標題不直觀；且 3 個尺度視覺權重相同，但實務上「最近 3 個月」與「最近 1 年」是主要判斷，「最近 5 年」只是長期參考

## What Changes

- **IndividualPage 改手動查詢**：
  - StockSelector 選股後不再自動抓資料
  - 新增「查詢」按鈕（`btn-solid`），按下才觸發 API + 計算
  - 已輸入 stock 與已查詢 stock 為兩個狀態（pending vs queried）
  - 變更 stock 後查詢按鈕可再次觸發

- **StockSelector 下拉清單滾動**：
  - 下拉容器加 `max-h-[300px] overflow-y-auto`，並確保 scroll bar 視覺呈現

- **多尺度 EV 計算窗口與標題重做**：
  - **第一個**：日報酬最近 60 筆 → 標題「最近 3 個月」（主要判斷）
  - **第二個**：日報酬最近 240 筆 → 標題「最近 1 年」（主要判斷）
  - **第三個**：月報酬最近 60 筆 → 標題「最近 5 年（參考）」（參考用）
  - 移除「短期 / 中期 / 長期」術語

- **視覺權重區分**：
  - 「最近 3 個月」+「最近 1 年」兩卡為**主要**樣式（既有 cream 卡片 + serif 24px 大數）
  - 「最近 5 年」卡為**弱化**樣式：灰調卡（`bg-elevated` 或更淡）、數字字級降為 18–20px、副標加「參考用」tag、整體 opacity 略降或文字 dim

- **Divergence 判讀條件調整**：
  - 「一致 / 有差異」只看前兩個尺度（主要判斷）；最近 5 年僅作為旁證，不影響 banner
  - Banner 文字微調（「兩個近期尺度一致 / 有差異，5 年趨勢供參考」）

- **保留**：
  - VaR / Hurst / 蒙地卡羅區塊不動
  - 紅漲綠跌、所有計算公式不變

## Capabilities

### Modified Capabilities

- `multi-scale-ev`：窗口定義從「短/中/長」改為「3 個月 / 1 年 / 5 年」，主要判斷 vs 參考的權重區分
- `dual-frequency-analysis`：手動查詢觸發、移除自動取資料

## Impact

- **影響檔案**：
  - `src/lib/ev.ts`：`calcMultiScaleEV()` 窗口參數重定義，回傳結構加 `isPrimary` 或 `tier`
  - `src/components/charts/MultiScaleEVBlock.tsx`：標題、視覺權重、divergence 判讀
  - `src/pages/IndividualPage.tsx`：移除自動 fetch，加 `pendingCode` 狀態 + 查詢按鈕
  - `src/components/StockSelector.tsx`：下拉清單滾動樣式
  - `src/lib/ev.test.ts`：更新測試（窗口定義改變、divergence 邏輯改變）
- **不影響**：
  - `src/lib/var.ts`、`src/lib/hurst.ts`、`src/lib/montecarlo.ts` 完全不動
  - Zustand store
  - Portfolio / Compare / Performance 頁面（PortfolioPage 也用 `calcPortfolioMultiScaleEV`，需確認是否同步調整或保留舊行為）
- **風險**：
  - PortfolioPage 也使用 `calcPortfolioMultiScaleEV`（同樣 3 尺度），需決定是否同步調整。**第一版只動個股頁，組合頁維持舊定義**，後續再 propose 對齊
  - 既有測試需要更新
  - 「最近 5 年」需要月報酬 ≥ 60 筆，若不足要降級顯示
