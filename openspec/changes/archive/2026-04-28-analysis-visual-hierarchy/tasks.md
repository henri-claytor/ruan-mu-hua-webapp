## 1. 共用元件升級

- [x] 1.1 `ResultCard.tsx`：新增 `emphasis: 'hero' | 'normal' | 'muted'` prop（預設 normal）；hero 採 text-display + border-2 + 較深 bg；muted 採 text-body + text-dim + 無底色
- [x] 1.2 `ResultCard.tsx`：保留 `large` prop 並內部視為 `emphasis="hero"` alias
- [x] 1.3 `QuadrantBadge.tsx`：新增 `size: 'normal' | 'large'` prop；large 版本圖標 24px、字 text-h2、加粗、深底色

## 2. IndividualPage：EV 區塊改造

- [x] 2.1 區塊主標改「期望報酬與賠率優勢」、副標「EV 期望值分析 · 使用月報酬 N 筆」
- [x] 2.2 Hero 列：左欄 ResultCard emphasis="hero" + 右欄 QuadrantBadge size="large" + 賠率優勢結論
- [x] 2.3 中層 2 欄：實際賠率、損益平衡賠率（emphasis="normal"）
- [x] 2.4 「勝敗率與平均盈虧」改為 inline 緊湊行（text-small + text-dim）
- [x] 2.5 計算步驟用 Disclosure 元件預設收合，按鈕「▶ 展開計算步驟 / ▼ 收折計算步驟」

## 3. IndividualPage：VaR 區塊改造

- [x] 3.1 主標改「下行風險：最壞情境虧損」、副標「VaR 95% / 99% · 使用{頻率}」
- [x] 3.2 Hero 列：VaR95 emphasis="hero" + 風險等級判讀標籤（low/mid/high 三色）
- [x] 3.3 中層保留 VaR99 與 VarHistogram 並排

## 4. IndividualPage：MC 區塊改造 + 順序調整

- [x] 4.1 主標改「未來資產淨值模擬」、副標含「初始 100 萬，模擬 100 條路徑」
- [x] 4.2 Hero 列：5 年 P50（萬）emphasis="hero" + 副標「期望範圍 P5: x ~ P95: y」
- [x] 4.3 既有 1/3/5 年三欄保留為中層
- [x] 4.4 底部 μ/σ/路徑數/月報酬筆數改 inline 緊湊行
- [x] 4.5 將 `<McBlock>` 順序移到「Hurst 後、ActionGuide 前」
- [x] 4.6 移除「軌道分隔線」JSX

## 5. IndividualPage：Multi-Scale Hurst 微調

- [x] 5.1 主標改「趨勢延續性偵測」、副標「Hurst 指數，60/120/240 日多尺度 · 使用日報酬 240 筆」
- [x] 5.2 三尺度卡片標籤改為 muted 樣式（text-faint）
- [x] 5.3 短期卡片下方「樣本較小，誤差較大」字級調為 text-caption

## 6. PortfolioPage：套用相同改造

- [x] 6.1 EV 區塊：主標「組合期望報酬與賠率優勢」+ Hero 列（組合 EV 大數字）+ 中層三張卡（勝/敗/實際賠率）
- [x] 6.2 VaR 區塊：主標「組合下行風險：最壞情境虧損」+ Hero 列（VaR95 + 風險等級）
- [x] 6.3 Hurst 區塊（單尺度）：主標「組合趨勢延續性偵測」+ Hero 列（H 值 + 解讀）
- [x] 6.4 MC 區塊：主標「組合未來淨值模擬」+ Hero 列（5 年 P50 + 範圍副標）
- [x] 6.5 順序調整為 EV → VaR → Hurst → MC → ActionGuide
- [x] 6.6 各區塊基礎統計改為 inline 緊湊行
- [x] 6.7 計算步驟（如有）一律改 disclosure（Portfolio 原本就無計算步驟細節）

## 6a. PortfolioPage：股票選取區塊移至頂部且可摺疊

- [x] 6a.1 將「股票選取與比重設定」區塊從頁面底部移到頁面標題下方（結果區之上）
- [x] 6a.2 包成可摺疊容器（disclosure）+ 按鈕「▶ 展開股票選取 / ▼ 收折股票選取」
- [x] 6a.3 摺疊預設值：`useState(!ready)` 初始化；用 `userToggledRef` 追蹤手動切換，手動後不再被自動覆寫

## 7. 驗證

- [x] 7.1 `npx tsc --noEmit` 通過
- [x] 7.2 `npx vitest run` 全部通過（6 test files, 56 tests）
- [ ] 7.3 在瀏覽器確認個股頁
- [ ] 7.4 在瀏覽器確認組合頁（含股票選取摺疊行為）
- [x] 7.5 部署到 Vercel
