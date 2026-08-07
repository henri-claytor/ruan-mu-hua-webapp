## Why

個股頁已完成「主判斷金邊 + 副卡 + 參考橫列 + ActionGuide 在頂部 + 全站白話命名」的視覺體驗。組合頁（PortfolioPage）目前仍是舊結構：
- ActionGuide 在頁尾
- 自定義 `PortfolioVarBlock` / `PortfolioMcBlock` 是舊版（VaR 用 Hero ResultCard + 整列徽章；MC 用 3 卡老樣式）
- 缺少 FractalDimensionBlock（走勢規律性）
- 命名仍有「賠率」「VaR」殘留

為了讓使用者在個股 / 組合兩頁有一致體驗，將個股頁的全套邏輯同步套到組合頁。

## What Changes

- **新增「計算組合」按鈕**：設定好股票與權重後，按下按鈕才執行計算與顯示結果（與個股頁「查詢」按鈕邏輯一致）
  - 移除「股票選好 / 權重有效 → 自動計算」的隱性行為
  - 新增 `computed` 狀態：true 才渲染結果區塊
  - 按鈕狀態：未準備 disabled / 準備好 enabled / 已計算 →「重新計算」
- **ActionGuide 移到頂部**：計算結果中第一個區塊（與個股頁一致）
- **PortfolioVarBlock 改造**：複用個股 VarBlock 結構 — 95% 主卡（金邊 + 主判斷 chip + 40px）+ 99% 橫向參考列 + Histogram
- **PortfolioMcBlock 改造**：3 卡並排（1 年 / 3 年 / 5 年），5 年為主判斷 + μ/σ 整合
- **Hurst 區塊**：已用共用 MultiScaleHurstBlock（已套主判斷邏輯）— 確認 titleOverride 正確
- **新增 FractalDimensionBlock**：組合頁加入「組合走勢規律性偵測」區塊（個股頁有但組合頁沒有）
- **命名**：殘留的「VaR」「賠率」改為「下行虧損」「損益比」（panel title / subtitle）
- **不動**：股票選擇與加權配置區塊（屬於輸入區，不適用主判斷邏輯）、StockVsPortfolioComparison（屬於個股對比，不是指標卡）

## Capabilities

### Modified Capabilities

- `result-first-layout`：PortfolioPage 採與個股頁一致的「結論優先 → 細節在下」結構

## Impact

- **影響檔案**：
  - `src/pages/PortfolioPage.tsx`：
    - ActionGuide 移到頂部
    - `PortfolioVarBlock` 改造（complete rewrite，與個股 VarBlock 同結構）
    - `PortfolioMcBlock` 改造（複製個股 McBlock 結構）
    - 加 FractalDimensionBlock 區塊
    - 殘留命名修正
- **不影響**：邏輯、tests、API、Zustand store

## Risks / Trade-offs

- PortfolioPage 與 IndividualPage 兩個 VarBlock / McBlock 結構相似但獨立 — 短期重複，未來可抽共用元件
- 「組合 5 年中位情境」與「組合 VaR 95%」都是主判斷 → 同頁有多個「主判斷 chip」是預期行為（不同區塊各自獨立判斷）
